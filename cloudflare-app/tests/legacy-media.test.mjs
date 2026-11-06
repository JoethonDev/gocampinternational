import test from "node:test";
import assert from "node:assert/strict";
import { loadTypeScript } from "./load-typescript.mjs";

const { serveR2Image } = await loadTypeScript("../app/lib/legacy-media.server.ts");

function fixture(row) {
  const reads = [];
  return {
    reads,
    env: {
      DB: { prepare: () => ({ bind: () => ({ first: async () => row }) }) },
      MEDIA: {
        get: async (key) => {
          reads.push(key);
          return null;
        },
        head: async (key) => {
          reads.push(key);
          return null;
        }
      }
    }
  };
}

test("hidden registered media cannot be read through historical or direct URLs", async () => {
  for (const path of ["images/photo.png", "images/optimized-upload/photo.webp"]) {
    const { env, reads } = fixture({ object_key: "images/private.webp", is_public: 0 });
    const response = await serveR2Image(
      new Request("https://example.test/" + path + "?variant=mobile"),
      env
    );
    assert.equal(response.status, 404);
    assert.deepEqual(reads, []);
  }
});

test("converted media uses current object keys for both variants and fallback", async () => {
  const { env, reads } = fixture({ object_key: "images/converted.webp", is_public: 1 });
  await serveR2Image(new Request("https://example.test/images/old.png?variant=mobile"), env);
  assert.deepEqual(reads, ["optimized/mobile/images/converted.webp.webp", "images/converted.webp"]);
});

test("unregistered historical assets retain their original R2 fallback", async () => {
  const { env, reads } = fixture(null);
  await serveR2Image(new Request("https://example.test/images/original.webp"), env);
  assert.deepEqual(reads, ["images/original.webp"]);
});
