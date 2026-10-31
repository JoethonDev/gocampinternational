#!/usr/bin/env node
/** Source-approved PR39 overlay, never mutates PR40 baseline. Generates idempotent D1 insert-only statements. */
import { readFile, writeFile } from "node:fs/promises";
const data = JSON.parse(
  await readFile(
    new URL("../migration/overlays/pr39-approved-inactive.json", import.meta.url),
    "utf8"
  )
);
if (data.source !== "PR39" || Object.keys(data.records).length !== 2)
  throw Error("Invalid approved draft overlay");
const quoted = (v) => "'" + String(v).replaceAll("'", "''") + "'";
const lines = [
  "-- PR39 approved inactive draft overlay; INSERT OR IGNORE prevents overwriting CMS changes",
  "BEGIN TRANSACTION;"
];
for (const [slug, v] of Object.entries(data.records)) {
  if (v.id !== slug || v.status !== "inactive" || v.image !== "")
    throw Error("Draft cannot be published: " + slug);
  lines.push(
    "INSERT OR IGNORE INTO catalog_entities(kind,slug,name,status,category_slug,sort_order,content_json,revision) VALUES('program'," +
      [slug, v.name, v.status, v.category_slug].map(quoted).join(",").replace(/^/, "") +
      ",99," +
      quoted(JSON.stringify(v)) +
      ",0);"
  );
}
lines.push("COMMIT;");
const path = process.argv[2] || "migration/overlays/pr39-approved-inactive.sql";
await writeFile(path, lines.join("\n") + "\n");
console.log("Prepared approved PR39 inactive overlay (2 records): " + path);
