import test from "node:test";
import assert from "node:assert/strict";
import { loadTypeScript } from "./load-typescript.mjs";

const { isContentUrl, readPublicContent, validatePublicContent } = await loadTypeScript(
  "../app/lib/public-content.ts"
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
