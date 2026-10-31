import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = path => readFileSync(new URL(path, import.meta.url), "utf8");

test("PR40 landing form fields and consent are preserved in React and server validation", () => {
  const src = read("../../landing.php");
  const page = read("../app/features/landing/LandingPage.tsx");
  const route = read("../app/routes/landing.tsx");
  const server = read("../app/lib/inquiries.server.ts");
  const routes = read("../app/routes.ts");

  for (const field of ["name", "age", "gender", "interests[]", "email", "phone", "privacyConsent", "website"]) {
    assert.ok(src.includes('name="' + field + '"'), "Missing baseline field: " + field);
    assert.ok(page.includes('name="' + field + '"'), "Missing React field: " + field);
  }
  for (const value of ["Sports", "Language", "Leadership", "Academic"]) {
    assert.ok(page.includes(value), "Missing interest: " + value);
  }
  assert.match(server, /values\.source === "Landing Page"/);
  assert.match(server, /if \(forceLanding\) values\.source = "Landing Page"/);
  assert.match(route, /submitInquiry\(request, context\.cloudflare\.env\.DB, "lead", true\)/);
  assert.match(server, /privacyConsent: "yes"/);
  assert.match(route, /noindex,nofollow/);
  assert.match(routes, /route\(\s*"landing"\s*,\s*"routes\/landing\.tsx"\s*\)/);
  assert.match(routes, /route\(\s*"landing\.php"\s*,\s*"routes\/landing-legacy\.ts"\s*\)/);
});
