import test from "node:test";
import assert from "node:assert/strict";
import { SqliteD1 } from "./sqlite-d1.mjs";
import { loadTypeScript } from "./load-typescript.mjs";

const {
  isContentUrl,
  publicContentGroupsForPath,
  publicContentMediaIds,
  readPublicContent,
  validatePublicContent
} = await loadTypeScript("../app/lib/public-content.ts");
const { ensurePublicContentMediaIsPublic } = await loadTypeScript(
  "../app/lib/catalog-write.server.ts"
);

test("public content accepts only safe, well-formed link and image URLs", () => {
  for (const value of ["/about", "/?campaign=summer", "#programs", "https://example.com/path"]) {
    assert.equal(isContentUrl(value), true, value);
  }
  assert.equal(isContentUrl("mailto:team@example.com"), true);
  assert.equal(isContentUrl("tel:+201234567890"), true);
  assert.equal(isContentUrl("/media/00000000-0000-0000-0000-000000000000", true), true);
  assert.equal(isContentUrl("https://example.com", false, true), true);

  for (const value of [
    "javascript:alert(1)",
    "//example.com",
    "https:example.com",
    "https:/example.com",
    "https:///example.com",
    "http://example.com",
    "https://user:secret@example.com"
  ]) {
    assert.equal(isContentUrl(value), false, value);
  }
  assert.equal(isContentUrl("mailto:team@example.com", true), false);
  assert.equal(isContentUrl("/about", false, true), false);
});

test("public content validates override IDs, types, sizes and URL schemes", () => {
  assert.equal(validatePublicContent({ home: { intro: "Updated intro" } }), null);
  assert.match(validatePublicContent({ unknown: { title: "value" } }), /Invalid content group/);
  assert.match(validatePublicContent({ header: { unknown: "value" } }), /Invalid content field/);
  assert.match(validatePublicContent({ header: { home: false } }), /Invalid content field/);
  assert.match(
    validatePublicContent({ home: { intro: "x".repeat(5001) } }),
    /Invalid content field/
  );
  assert.match(
    validatePublicContent({ header: { "to-about": "https:example.com" } }),
    /Invalid content field/
  );
  assert.match(
    validatePublicContent({ home: { "slides.0.image": "/media/not-an-id" } }),
    /Invalid content field/
  );
});

test("stored public content falls back safely for invalid or unknown D1 overrides", () => {
  const content = readPublicContent({
    home: { intro: "Updated intro" },
    header: { "to-about": "javascript:alert(1)" },
    seo: { "home-image": "data:image/png;base64,abc" },
    extra: { ignored: "value" }
  });

  assert.equal(content.home.intro, "Updated intro");
  assert.equal(content.header["to-about"], "/about");
  assert.equal(content.seo["home-image"], "/images/banner.webp");
  assert.equal(Object.hasOwn(content, "extra"), false);
});

test("public content loader returns only groups used by the requested page", () => {
  const saved = {
    home: { intro: "Updated home" },
    contact: { "title-contact-us": "Updated contact" }
  };
  const home = readPublicContent(saved, publicContentGroupsForPath("/"));
  const contact = readPublicContent(saved, publicContentGroupsForPath("/contact/"));
  assert.equal(home.home.intro, "Updated home");
  assert.equal(Object.hasOwn(home, "contact"), false);
  assert.equal(contact.contact["title-contact-us"], "Updated contact");
  assert.equal(Object.hasOwn(contact, "home"), false);
  assert.equal(Object.hasOwn(contact, "site"), true);
});

test("public content media references must resolve to assets still marked public", async () => {
  const db = new SqliteD1();
  const id = "11111111-1111-4111-8111-111111111111";
  const content = { home: { "slides.0.image": `/media/${id}?variant=hero` } };
  assert.deepEqual(publicContentMediaIds(content), [id]);
  db.sql
    .prepare(
      "INSERT INTO media_assets(id,object_key,display_name,mime_type,sha256,is_public) VALUES(?, 'hero.webp','Hero','image/webp','hero',1)"
    )
    .run(id);
  await ensurePublicContentMediaIsPublic(db, content);
  db.sql.prepare("UPDATE media_assets SET is_public=0 WHERE id=?").run(id);
  await assert.rejects(
    () => ensurePublicContentMediaIsPublic(db, content),
    (error) => {
      assert.equal(error instanceof Response, true);
      assert.equal(error.status, 400);
      return true;
    }
  );
});
