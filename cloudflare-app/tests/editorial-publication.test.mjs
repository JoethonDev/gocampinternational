import test from "node:test";
import assert from "node:assert/strict";
import { loadTypeScript } from "./load-typescript.mjs";
import { SqliteD1 } from "./sqlite-d1.mjs";

const { loadPublishedDocument, editorialPublishedAt, publishEditorialDocuments } =
  await loadTypeScript("../app/lib/editorial-publish.server.ts");

test("editorial D1 drafts remain invisible until explicitly published to R2", async () => {
  const db = new SqliteD1();
  db.sql
    .prepare("INSERT INTO site_documents(key,content_json) VALUES(?,?)")
    .run("site_settings", JSON.stringify({ public_content: { home: { intro: "First" } } }));
  db.sql
    .prepare("INSERT INTO site_documents(key,content_json) VALUES(?,?)")
    .run("faq", JSON.stringify([{ question: "Original question", answer: "Original answer" }]));

  const files = new Map();
  const env = {
    DB: db,
    MEDIA: {
      async get(key) {
        const value = files.get(key);
        return value === undefined
          ? null
          : {
              async json() {
                return JSON.parse(value);
              }
            };
      },
      async put(key, value) {
        files.set(key, value);
      }
    }
  };

  assert.equal((await loadPublishedDocument(env, "faq"))[0].question, "Original question");
  assert.equal(await editorialPublishedAt(env), null);
  const firstPublishedAt = await publishEditorialDocuments(env);
  assert.match(firstPublishedAt, /^\d{4}-\d{2}-\d{2}T/);

  db.sql
    .prepare("UPDATE site_documents SET content_json=? WHERE key='faq'")
    .run(JSON.stringify([{ question: "Draft question", answer: "Draft answer" }]));
  assert.equal((await loadPublishedDocument(env, "faq"))[0].question, "Original question");
  await publishEditorialDocuments(env);
  assert.equal((await loadPublishedDocument(env, "faq"))[0].question, "Draft question");
  assert.ok(await editorialPublishedAt(env));
});
