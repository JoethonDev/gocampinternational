import test from "node:test";
import assert from "node:assert/strict";
import { loadTypeScript } from "./load-typescript.mjs";
import { SqliteD1, entity, admin, statusIs } from "./sqlite-d1.mjs";

const { saveEntity, duplicateEntity, changeBulkStatus } = await loadTypeScript(
  "../app/lib/catalog-write.server.ts"
);
const row = (db, kind, slug) =>
  db.sql.prepare("SELECT * FROM catalog_entities WHERE kind=? AND slug=?").get(kind, slug);

test("new forms cannot overwrite existing revision-zero records", async () => {
  const db = new SqliteD1();
  entity(db, "program", "existing", { name: "Original" });
  const { request, form } = await admin(db, {
    slug: "existing",
    name: "Replacement",
    status: "active"
  });
  await assert.rejects(saveEntity(request, db, "program", form), statusIs(409));
  assert.equal(row(db, "program", "existing").name, "Original");
  assert.equal(row(db, "program", "existing").revision, 0);
});

test("simultaneous creates reject the losing insert without overwriting", async () => {
  const db = new SqliteD1();
  const { request, form } = await admin(db, {
    slug: "new-id",
    name: "Losing name",
    status: "active"
  });
  db.beforeWriteBatch = () => entity(db, "program", "new-id", { name: "Winning name" });
  await assert.rejects(saveEntity(request, db, "program", form), statusIs(409));
  assert.equal(row(db, "program", "new-id").name, "Winning name");
});

test("an edit cannot recreate a record that was deleted", async () => {
  const db = new SqliteD1();
  const { request, form } = await admin(db, { slug: "gone", name: "Gone", status: "active" });
  await assert.rejects(saveEntity(request, db, "program", form, "gone"), statusIs(404));
  assert.equal(row(db, "program", "gone"), undefined);
});

test("a stale destination edit leaves the winner's JSON and links intact", async () => {
  const db = new SqliteD1();
  entity(db, "program", "winner");
  entity(db, "program", "stale");
  entity(db, "destination", "uk", { program_ids: ["winner"] });
  db.sql.prepare("INSERT INTO destination_programs VALUES(?,?,?)").run("uk", "winner", 0);
  const { request, form } = await admin(db, {
    slug: "uk",
    name: "Stale",
    status: "active",
    revision: "0",
    program_ids: "stale"
  });
  db.beforeWriteBatch = () =>
    db.sql.exec("UPDATE catalog_entities SET revision=1 WHERE kind='destination' AND slug='uk'");
  await assert.rejects(saveEntity(request, db, "destination", form, "uk"), statusIs(409));
  assert.deepEqual(JSON.parse(row(db, "destination", "uk").content_json).program_ids, ["winner"]);
  assert.equal(
    db.sql.prepare("SELECT program_slug FROM destination_programs").get().program_slug,
    "winner"
  );
});

test("a child record conflict rolls back a category rename", async () => {
  const db = new SqliteD1();
  entity(db, "category", "old-category");
  entity(db, "program", "program", { category_slug: "old-category" });
  const { request, form } = await admin(db, {
    slug: "renamed",
    name: "Renamed",
    status: "active",
    revision: "0"
  });
  db.beforeWriteBatch = () =>
    db.sql.exec("UPDATE catalog_entities SET revision=1 WHERE kind='program'");
  await assert.rejects(saveEntity(request, db, "category", form, "old-category"), statusIs(409));
  assert.ok(row(db, "category", "old-category"));
  assert.equal(row(db, "category", "renamed"), undefined);
  assert.equal(row(db, "program", "program").category_slug, "old-category");
});

test("bulk conflict rolls back earlier updates instead of partially committing", async () => {
  const db = new SqliteD1();
  entity(db, "program", "one");
  entity(db, "program", "two");
  const { request, form } = await admin(db, { ids: ["one", "two"], status: "inactive" });
  db.beforeWriteBatch = () =>
    db.sql.exec("UPDATE catalog_entities SET revision=1 WHERE slug='two'");
  await assert.rejects(changeBulkStatus(request, db, "program", form), statusIs(409));
  assert.equal(row(db, "program", "one").status, "active");
  assert.equal(row(db, "program", "one").revision, 0);
  assert.equal(row(db, "program", "two").revision, 1);
});

test("category rename rejects a program linked after the snapshot", async () => {
  const db = new SqliteD1();
  entity(db, "category", "old-category");
  const { request, form } = await admin(db, {
    slug: "renamed",
    name: "Renamed",
    status: "active",
    revision: "0"
  });
  db.beforeWriteBatch = () =>
    entity(db, "program", "new-program", { category_slug: "old-category" });
  await assert.rejects(saveEntity(request, db, "category", form, "old-category"), statusIs(409));
  assert.ok(row(db, "category", "old-category"));
  assert.equal(row(db, "category", "renamed"), undefined);
});

test("program rename rejects a destination linked after the snapshot", async () => {
  const db = new SqliteD1();
  entity(db, "program", "old-program");
  const { request, form } = await admin(db, {
    slug: "renamed",
    name: "Renamed",
    status: "active",
    revision: "0"
  });
  db.beforeWriteBatch = () => {
    entity(db, "destination", "new-destination", { program_ids: ["old-program"] });
    db.sql
      .prepare("INSERT INTO destination_programs VALUES('new-destination','old-program',0)")
      .run();
  };
  await assert.rejects(saveEntity(request, db, "program", form, "old-program"), statusIs(409));
  assert.ok(row(db, "program", "old-program"));
  assert.equal(
    db.sql.prepare("SELECT program_slug FROM destination_programs").get().program_slug,
    "old-program"
  );
});

test("a program removed after destination validation cannot become a dangling link", async () => {
  const db = new SqliteD1();
  entity(db, "program", "removed");
  const { request, form } = await admin(db, {
    slug: "uk",
    name: "UK",
    status: "active",
    program_ids: "removed"
  });
  db.beforeWriteBatch = () => db.sql.exec("DELETE FROM catalog_entities WHERE kind='program'");
  await assert.rejects(saveEntity(request, db, "destination", form), statusIs(409));
  assert.equal(row(db, "destination", "uk"), undefined);
  assert.equal(db.sql.prepare("SELECT COUNT(*) AS n FROM destination_programs").get().n, 0);
});

test("a successful program rename updates destination JSON and links together", async () => {
  const db = new SqliteD1();
  entity(db, "program", "old-program");
  entity(db, "destination", "uk", { program_ids: ["old-program"] });
  db.sql.prepare("INSERT INTO destination_programs VALUES('uk','old-program',0)").run();
  const { request, form } = await admin(db, {
    slug: "renamed",
    name: "Renamed",
    status: "active",
    revision: "0"
  });
  assert.equal(await saveEntity(request, db, "program", form, "old-program"), "renamed");
  assert.equal(row(db, "program", "old-program"), undefined);
  assert.deepEqual(JSON.parse(row(db, "destination", "uk").content_json).program_ids, ["renamed"]);
  assert.equal(
    db.sql.prepare("SELECT program_slug FROM destination_programs").get().program_slug,
    "renamed"
  );
});

test("100-record bulk updates fit D1's 100-parameter limit", async () => {
  const db = new SqliteD1();
  const ids = Array.from({ length: 100 }, (_, i) => `program-${i}`);
  for (const id of ids) entity(db, "program", id);
  const { request, form } = await admin(db, { ids, status: "inactive" });
  assert.equal(await changeBulkStatus(request, db, "program", form), 100);
  assert.equal(
    db.sql.prepare("SELECT COUNT(*) AS n FROM catalog_entities WHERE status='inactive'").get().n,
    100
  );
  assert.ok(db.maxBindings <= 100);
});

test("destinations can save 150 linked programs within D1 limits", async () => {
  const db = new SqliteD1();
  const ids = Array.from({ length: 150 }, (_, i) => `program-${i}`);
  for (const id of ids) entity(db, "program", id);
  const { request, form } = await admin(db, {
    slug: "uk",
    name: "UK",
    status: "active",
    program_ids: ids.join("\n")
  });
  assert.equal(await saveEntity(request, db, "destination", form), "uk");
  assert.equal(db.sql.prepare("SELECT COUNT(*) AS n FROM destination_programs").get().n, 150);
  assert.ok(db.maxBindings <= 100);
});

test("long IDs duplicate repeatedly without LIKE limits or invalid copy IDs", async () => {
  for (const slug of ["uk-academic-philosophy-politics-and-economics", "a".repeat(160)]) {
    const db = new SqliteD1();
    entity(db, "program", slug);
    const { request, form } = await admin(db);
    const first = await duplicateEntity(request, db, "program", form, slug);
    const second = await duplicateEntity(request, db, "program", form, slug);
    assert.notEqual(first, second);
    for (const id of [first, second]) {
      assert.match(id, /^[a-z0-9][a-z0-9_-]{0,159}$/);
      assert.ok(row(db, "program", id));
    }
  }
});
