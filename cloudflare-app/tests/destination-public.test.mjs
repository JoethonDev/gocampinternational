import test from "node:test";
import assert from "node:assert/strict";
import { loadTypeScript } from "./load-typescript.mjs";

const { publicDestination } = await loadTypeScript("../app/lib/catalog.server.ts");

test("public destination records exclude inactive content and minimize coming-soon previews", () => {
  const inactive = {
    slug: "hidden-place",
    name: "Hidden Place",
    status: "inactive",
    intro_text: "unpublished details",
    program_ids: ["secret-program"]
  };
  assert.equal(publicDestination(inactive), null);

  const comingSoon = publicDestination({
    ...inactive,
    slug: "new-place",
    status: "coming-soon"
  });
  assert.deepEqual(comingSoon, {
    slug: "new-place",
    name: "Hidden Place",
    status: "coming-soon"
  });

  const active = publicDestination({ ...inactive, status: "active" });
  assert.equal(active.intro_text, "unpublished details");
  assert.equal(active.program_ids[0], "secret-program");
});
