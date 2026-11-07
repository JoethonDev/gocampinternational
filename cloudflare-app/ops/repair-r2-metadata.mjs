// Temporary one-off migration helper. Removed after verification.
import { randomBytes } from "node:crypto";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

const NAME = "gocamp-r2-metadata-repair-once";
const folder = await mkdtemp(join(tmpdir(), "gocamp-r2-"));
const config = join(folder, "wrangler.json");
const worker = join(folder, "worker.mjs");
const token = randomBytes(32).toString("hex");

function helperSource() {
  const TOKEN = "RANDOM_TOKEN_PLACEHOLDER";
  const normalize = (data) => JSON.stringify(Object.entries(data || {}).sort(([a], [b]) => a.localeCompare(b)));
  const same = (a, b) => normalize(a) === normalize(b);
  return {
    async fetch(request, env) {
      if (request.method !== "POST" || request.headers.get("x-repair-key") !== TOKEN)
        return new Response("Not found", { status: 404 });
      const { cursor } = await request.json();
      const page = await env.SOURCE.list({ limit: 8, ...(cursor ? { cursor } : {}) });
      const problems = [];
      let repaired = 0;
      await Promise.all(
        page.objects.map(async ({ key }) => {
          try {
            const [source, dest] = await Promise.all([
              env.SOURCE.head(key),
              env.TARGET.head(key)
            ]);
            if (!source) throw Error("source missing");
            if (dest && (dest.etag !== source.etag || dest.size !== source.size))
              throw Error("destination content mismatch");
            if (dest && same(source.httpMetadata, dest.httpMetadata) &&
                same(source.customMetadata, dest.customMetadata)) return;
            const original = await env.SOURCE.get(key);
            if (!original) throw Error("missing source data");
            const put = await env.TARGET.put(key, original.body, {
              httpMetadata: original.httpMetadata,
              customMetadata: original.customMetadata
            });
            if (!put || put.etag !== source.etag || put.size !== source.size)
              throw Error("write corrupted object");
            const updated = await env.TARGET.head(key);
            if (!updated || updated.etag !== source.etag || updated.size !== source.size ||
                !same(source.httpMetadata, updated.httpMetadata) ||
                !same(source.customMetadata, updated.customMetadata))
              throw Error("metadata verification failed");
            repaired++;
          } catch (error) {
            problems.push({ key, error: String(error).slice(0, 140) });
          }
        })
      );
      return Response.json({
        scanned: page.objects.length,
        repaired,
        problems,
        truncated: page.truncated,
        cursor: page.truncated ? page.cursor : null
      });
    }
  };
}
function wrangler(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn("npx", ["wrangler", ...args], { cwd: process.cwd() });
    let output = "";
    proc.stdout.on("data", (x) => { output += String(x); });
    proc.stderr.on("data", (x) => { output += String(x); });
    proc.on("error", reject);
    proc.on("close", (code) => code === 0
      ? resolve(output)
      : reject(Error("Wrangler code " + code + ": " + output.slice(-1300))));
  });
}
let uploaded = false;
try {
  const js = "export default (" + helperSource.toString() + ")();";
  await writeFile(worker, js.replace('"RANDOM_TOKEN_PLACEHOLDER"', JSON.stringify(token)));
  await writeFile(config, JSON.stringify({
    name: NAME,
    main: "./worker.mjs",
    compatibility_date: "2026-10-31",
    workers_dev: true,
    preview_urls: false,
    r2_buckets: [
      { binding: "SOURCE", bucket_name: "gocamp-staging-media" },
      { binding: "TARGET", bucket_name: "gocamp-production-media" }
    ]
  }));
  const deployed = await wrangler(["deploy", "--config", config]);
  uploaded = true;
  const url = deployed.match(/https:\/\/[^\s]+\.workers\.dev/)?.[0] ||
    "https://" + NAME + ".elprincedoca.workers.dev";
  let cursor = null, count = 0, repaired = 0, pages = 0;
  for (;;) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-repair-key": token },
      body: JSON.stringify({ cursor }),
      signal: AbortSignal.timeout(25000)
    });
    if (!response.ok) throw Error("helper HTTP " + response.status);
    const batch = await response.json();
    if (batch.problems.length) throw Error("R2 errors " + JSON.stringify(batch.problems).slice(0,600));
    count += batch.scanned;
    repaired += batch.repaired;
    pages++;
    if (pages % 20 === 0)
      console.log("R2 repair progress " + JSON.stringify({ count, repaired, pages }));
    if (!batch.truncated) break;
    if (!batch.cursor || pages > 350) throw Error("invalid pagination");
    cursor = batch.cursor;
  }
  console.log("R2 REPAIR COMPLETE " + JSON.stringify({ count, repaired, pages }));
  if (count < 1426) throw Error("not all staging objects enumerated");
} finally {
  if (uploaded) {
    try {
      await wrangler(["delete", "--config", config, "--name", NAME, "--force"]);
      console.log("Temporary helper deleted");
    } catch (error) {
      console.error("TEMPORARY WORKER CLEANUP FAILED: " + String(error));
      process.exitCode = 1;
    }
  }
  await rm(folder, { recursive: true, force: true });
}
