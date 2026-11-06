import test from "node:test";
import assert from "node:assert/strict";
import { limitRequestBody, readLimitedForm } from "../app/lib/request.server.ts";
import { r2Response } from "../app/lib/r2-response.server.ts";

function streamedRequest(chunks, headers = {}) {
  const encoder = new TextEncoder();
  return new Request("https://example.test/api/contact", {
    method: "POST",
    headers,
    duplex: "half",
    body: new ReadableStream({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
        controller.close();
      }
    })
  });
}

test("body limit counts actual UTF-8 bytes without Content-Length", async () => {
  await assert.rejects(
    limitRequestBody(streamedRequest(["é", "é", "a"]), 4),
    (error) => error instanceof Response && error.status === 413
  );
  const bounded = await limitRequestBody(streamedRequest(["é", "é"]), 4);
  assert.equal(await bounded.text(), "éé");
});

test("lying or oversized Content-Length cannot bypass the body limit", async () => {
  for (const declared of ["1", "100"]) {
    await assert.rejects(
      limitRequestBody(
        streamedRequest(["12345"], {
          "Content-Length": declared
        }),
        4
      ),
      (error) => error instanceof Response && error.status === 413
    );
  }
});

test("bounded form parsing preserves repeated fields and reports malformed multipart", async () => {
  const form = await readLimitedForm(
    streamedRequest(["item=one&item=two"], {
      "Content-Type": "application/x-www-form-urlencoded"
    }),
    100
  );
  assert.deepEqual(form.getAll("item"), ["one", "two"]);
  await assert.rejects(
    readLimitedForm(
      streamedRequest(["broken"], {
        "Content-Type": "multipart/form-data"
      }),
      100
    ),
    (error) => error instanceof Response && error.status === 400
  );
});

function object(body = true) {
  return {
    size: 5,
    httpEtag: '"version"',
    writeHttpMetadata(headers) {
      headers.set("Content-Type", "image/webp");
    },
    ...(body ? { body: new Blob(["image"]).stream() } : {})
  };
}

test("R2 response streams bodies, retains metadata and supports metadata-only HEAD", async () => {
  const response = r2Response(
    new Request("https://example.test/media/id"),
    object(),
    "public,max-age=3600"
  );
  assert.equal(await response.text(), "image");
  assert.equal(response.headers.get("Content-Length"), "5");
  assert.equal(response.headers.get("Content-Type"), "image/webp");
  const head = r2Response(
    new Request("https://example.test/media/id", { method: "HEAD" }),
    object(false),
    "public,max-age=3600"
  );
  assert.equal(head.body, null);
  assert.equal(head.headers.get("ETag"), '"version"');
});

test("R2 validators match lists, weak tags and wildcards; mismatches return the image", () => {
  for (const tag of ['"version"', 'W/"version"', '"other", W/"version"', "*"]) {
    const response = r2Response(
      new Request("https://example.test/media/id", {
        headers: { "If-None-Match": tag }
      }),
      object(),
      "public,max-age=3600"
    );
    assert.equal(response.status, 304);
    assert.equal(response.body, null);
    assert.equal(response.headers.get("Content-Length"), null);
  }
  const changed = r2Response(
    new Request("https://example.test/media/id", {
      headers: { "If-None-Match": '"older"' }
    }),
    object(),
    "public,max-age=3600"
  );
  assert.equal(changed.status, 200);
});
