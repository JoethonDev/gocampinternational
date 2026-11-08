import test from "node:test";
import assert from "node:assert/strict";
import { loadTypeScript } from "./load-typescript.mjs";

const { aboutSectionImage } = await loadTypeScript("../app/config/site.ts");

test("About Us sections may omit an image and show text full-width", () => {
  assert.equal(aboutSectionImage({}), "");
  assert.equal(aboutSectionImage({ image: "" }), "");
  assert.equal(aboutSectionImage({ image: "   " }), "");
  assert.equal(
    aboutSectionImage({ image: " /media/db67b319-afd4-5cb6-9f57-1d098e311223 " }),
    "/media/db67b319-afd4-5cb6-9f57-1d098e311223"
  );
});
