import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");
test("PR40 landing form fields and consent are preserved in React and server validation",()=>{
  const src=read("../../landing.php"),react=read("../app/routes/landing.tsx"),server=read("../app/lib/inquiries.server.ts"),routes=read("../app/routes.ts");
  for(const field of ["name","age","gender","interests[]","email","phone","privacyConsent","website"]){
    assert.ok(src.includes('name="'+field+'"'),"Missing baseline field: "+field);
    assert.ok(react.includes('name="'+field+'"'),"Missing React field: "+field);
  }
  for(const value of ["Sports","Language","Leadership","Academic"])assert.ok(react.includes(value));
  assert.match(server,/raw\.source==="Landing Page"/);
  assert.match(server,/if\(forceLanding\)raw\.source="Landing Page"/);
  assert.match(react,/submitInquiry\(request,context\.cloudflare\.env\.DB,"lead",true\)/);
  assert.match(server,/extra\.privacyConsent="yes"/);
  assert.match(react,/noindex,nofollow/);
  assert.match(routes,/route\("landing","routes\/landing\.tsx"\)/);
  assert.match(routes,/route\("landing\.php","routes\/landing-legacy\.ts"\)/);
});
