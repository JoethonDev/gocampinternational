import test from "node:test";
import assert from "node:assert/strict";
import { loadTypeScript } from "./load-typescript.mjs";
import { SqliteD1, entity, admin, statusIs } from "./sqlite-d1.mjs";

const { mutateMedia } = await loadTypeScript("../app/lib/media.server.ts");
const id = "11111111-1111-4111-8111-111111111111";
const objectKey = "images/converted.webp";
const legacyPath = "/images/original.png";
function asset(db) {
  db.sql
    .prepare(
      "INSERT INTO media_assets(id,object_key,legacy_path,display_name,mime_type,sha256) VALUES(?,?,?,'photo','image/webp','dummy')"
    )
    .run(id, objectKey, legacyPath);
}

test("media deletion protects ID, current object path, legacy URL and bare memory filenames", async () => {
  for (const reference of [
    `/media/${id}`,
    `/${objectKey}?variant=mobile`,
    legacyPath,
    "original.png"
  ]) {
    for (const location of ["catalog", "document"]) {
      const db = new SqliteD1();
      asset(db);
      if (location === "catalog") entity(db, "program", "program", { image: reference });
      else
        db.sql
          .prepare("INSERT INTO site_documents(key,content_json) VALUES('camp_memories',?)")
          .run(JSON.stringify({ items: [{ image: reference }] }));
      const { request, form } = await admin(db, { id, operation: "delete" });
      const deleted = [];
      await assert.rejects(
        mutateMedia(request, { DB: db, MEDIA: { delete: async (key) => deleted.push(key) } }, form),
        statusIs(409)
      );
      assert.equal(db.sql.prepare("SELECT COUNT(*) AS n FROM media_assets").get().n, 1);
      assert.deepEqual(deleted, []);
    }
  }
});

test("a reference saved after the initial asset read prevents deletion", async () => {
  const db = new SqliteD1();
  asset(db);
  const { request, form } = await admin(db, { id, operation: "delete" });
  db.beforeRun = ({ sql }) => {
    if (sql.startsWith("DELETE FROM media_assets")) {
      db.beforeRun = undefined;
      entity(db, "program", "late-reference", { image: legacyPath });
    }
  };
  await assert.rejects(
    mutateMedia(
      request,
      { DB: db, MEDIA: { delete: async () => assert.fail("Referenced object deleted") } },
      form
    ),
    statusIs(409)
  );
  assert.equal(db.sql.prepare("SELECT COUNT(*) AS n FROM media_assets").get().n, 1);
});

test("unreferenced deletion removes the registry, variants and original legacy object", async () => {
  const db = new SqliteD1();
  asset(db);
  const variant = "optimized/mobile/images/converted.webp.webp";
  db.sql
    .prepare(
      "INSERT INTO media_variants(media_id,preset,object_key,bytes,width,height,method) VALUES(?,'mobile',?,1,480,320,'standard')"
    )
    .run(id, variant);
  const { request, form } = await admin(db, { id, operation: "delete" });
  const deleted = [];
  await mutateMedia(
    request,
    {
      DB: db,
      MEDIA: { delete: async (keys) => deleted.push(...(Array.isArray(keys) ? keys : [keys])) }
    },
    form
  );
  assert.equal(db.sql.prepare("SELECT COUNT(*) AS n FROM media_assets").get().n, 0);
  assert.equal(db.sql.prepare("SELECT COUNT(*) AS n FROM media_variants").get().n, 0);
  assert.deepEqual(new Set(deleted), new Set([objectKey, legacyPath.slice(1), variant]));
});
