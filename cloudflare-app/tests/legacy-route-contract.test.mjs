import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = path => readFileSync(new URL(path, import.meta.url), "utf8");
const routes = source("../app/routes.ts");
const legacy = source("../app/routes/legacy-root.ts");
const legacyProgram = source("../app/routes/legacy-program.ts");
const phpRouter = source("../../index.php");
const rewrite = source("../../.htaccess");

test("legacy PHP routes have canonical aliases, without inventing program pages", () => {
  assert.match(routes, /route\(":legacy","routes\/legacy-root\.ts"\)/);
  assert.match(routes, /route\("program\/:legacy","routes\/legacy-program\.ts"\)/);
  for (const alias of ["home","index","index.php","home.php","about_us","about_us.php","contact_us","contact_us.php","faq.php"]) {
    assert.ok(legacy.includes(alias + ":") || legacy.includes(JSON.stringify(alias) + ":"), "Missing alias: " + alias);
  }
  assert.match(legacy,/redirect\(canonical, 301\)/);
  assert.match(legacyProgram,/status: 404/);
  assert.match(phpRouter,/program\/category/);
  assert.match(rewrite,/program\/index/);
  assert.doesNotMatch(routes, /route\("program\/:slug"/);
});
test("historically disabled program listing and gallery remain disabled", () => {
  assert.match(routes, /route\("programs","routes\/hidden-programs\.tsx"\)/);
  assert.match(routes, /route\("gallery","routes\/hidden-gallery\.tsx"\)/);
  assert.match(routes, /route\("program\/category","routes\/category\.tsx"\)/);
  assert.match(legacy,/Not Found/);
});
