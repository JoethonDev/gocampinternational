import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadTypeScript } from "./load-typescript.mjs";
import { SqliteD1, entity, admin, statusIs } from "./sqlite-d1.mjs";

const { readPage } = await loadTypeScript("../app/lib/pagination.server.ts");
const { createCloudflareContext } = await loadTypeScript("../app/lib/cloudflare-context.ts");
const { loader: inquiries } = await loadTypeScript("../app/routes/admin-inquiries-chunk.ts");
const { SelectedCatalogIds } = await loadTypeScript(
  "../app/components/admin/SelectedCatalogIds.tsx"
);
const { action: trash } = await loadTypeScript("../app/routes/admin-trash.tsx");
const { action: libraryUpload } = await loadTypeScript("../app/routes/admin-media.tsx");
const { action: selectorUpload } = await loadTypeScript("../app/routes/admin-media-upload.ts");

const workerContext = (db) => createCloudflareContext({ DB: db }, {});

test("inquiry scrolling loads the second page", async () => {
  const db = new SqliteD1();
  for (let i = 0; i < 23; i++)
    db.sql
      .prepare(
        "INSERT INTO inquiries(id,kind,email,content_json,created_at) VALUES(?,'contact',?,'{}',?)"
      )
      .run(`inquiry-${i}`, "test@example.test", 1000 - i);
  const { headers } = await admin(db);
  const response = await inquiries({
    request: new Request("https://example.test/admin/inquiries/chunk?page=2", { headers }),
    context: workerContext(db)
  });
  const result = await response.json();
  assert.equal(result.page, 2);
  assert.equal(result.rows.length, 3);
  assert.equal(result.rows[0].id, "inquiry-20");
});

test("page cursors reject fractions, negatives, overflow and non-numeric values", () => {
  assert.equal(readPage(new URL("https://example.test/")), 1);
  for (const value of ["0", "-1", "1.5", "Infinity", "NaN", "9007199254740992", "2x"]) {
    assert.throws(() => readPage(new URL(`https://example.test/?page=${value}`)), statusIs(400));
  }
});

test("the bulk form submits all 40 selected IDs even when only 15 rows are visible", () => {
  const ids = Array.from({ length: 40 }, (_, i) => `program-${i}`);
  const html = renderToStaticMarkup(createElement(SelectedCatalogIds, { ids }));
  const submitted = [...html.matchAll(/name="ids" value="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(submitted, ids);
  const page = readFileSync(
    new URL("../app/features/admin/catalog/CatalogListPage.tsx", import.meta.url),
    "utf8"
  );
  assert.match(page, /<SelectedCatalogIds ids=\{selected\}/);
  assert.doesNotMatch(page, /name="ids"/); // Table checkboxes must not duplicate the hidden IDs.
});

test("a concurrently restored trash item keeps its relationships", async () => {
  const db = new SqliteD1();
  entity(db, "destination", "uk", { status: "trash", program_ids: ["one"] });
  db.sql.prepare("INSERT INTO destination_programs VALUES('uk','one',0)").run();
  const { form, headers } = await admin(db, {
    kind: "destination",
    slug: "uk",
    revision: "0",
    operation: "delete"
  });
  db.beforeWriteBatch = () =>
    db.sql.exec("UPDATE catalog_entities SET status='active',revision=1 WHERE slug='uk'");
  await assert.rejects(
    trash({
      request: new Request("https://example.test/admin/trash", {
        method: "POST",
        headers,
        body: form
      }),
      context: workerContext(db)
    }),
    statusIs(409)
  );
  assert.equal(db.sql.prepare("SELECT status FROM catalog_entities").get().status, "active");
  assert.equal(db.sql.prepare("SELECT COUNT(*) AS n FROM destination_programs").get().n, 1);
});

test("both upload entrypoints reject headerless oversized bodies before multipart parsing", async () => {
  for (const action of [libraryUpload, selectorUpload]) {
    const db = new SqliteD1();
    const { headers } = await admin(db);
    let cancelled = false;
    const chunk = new Uint8Array(1024 * 1024);
    const body = new ReadableStream({
      pull(controller) {
        controller.enqueue(chunk);
      },
      cancel() {
        cancelled = true;
      }
    });
    const request = new Request("https://example.test/admin/media", {
      method: "POST",
      duplex: "half",
      body,
      headers: { ...headers, "Content-Type": "multipart/form-data; boundary=test" }
    });
    const context = workerContext(db);
    if (action === libraryUpload) await assert.rejects(action({ request, context }), statusIs(413));
    else assert.equal((await action({ request, context })).status, 413);
    assert.equal(cancelled, true);
  }
});
