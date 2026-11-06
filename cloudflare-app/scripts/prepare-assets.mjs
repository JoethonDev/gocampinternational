import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.resolve(root, "..");

// Clean leftover media from older local/dev builds; these are served only by R2.
for (const directory of ["images", "uploads", "js"]) {
  await rm(path.join(root, "public", directory), { recursive: true, force: true });
}

// Stylesheets are committed in public/css; images and uploads live in R2.
await mkdir(path.join(root, "public"), { recursive: true });

// Keep the committed legacy media inventory, so editors can browse and
// reference migrated R2 images even after Git binaries are removed.
const inventoryPath = path.join(root, "app", "legacy-media.json");
const inventory = JSON.parse(await readFile(inventoryPath, "utf8"));
if (!Array.isArray(inventory) || inventory.length !== 333) {
  throw new Error("R2 media manifest is incomplete (expected 333 items)");
}
const paths = new Set();
for (const item of inventory) {
  const key = String(item?.path || "").replace(/^\//, "");
  if (
    !item ||
    !new RegExp(
      "^(?:images|uploads)/[a-zA-Z0-9_().%+/-]+[.](webp|png|jpe?g|avif|gif|svg|ico)$",
      "i"
    ).test(key) ||
    !Number.isSafeInteger(item.bytes) ||
    item.bytes <= 0 ||
    paths.has(key)
  ) {
    throw new Error("Invalid or duplicate migrated media inventory entry");
  }
  paths.add(key);
}

const revision = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: source,
  encoding: "utf8"
}).trim();
await writeFile(path.join(root, "public", "migration-commit.txt"), revision + "\n");
console.log(
  "Prepared R2-backed legacy inventory (" + inventory.length + " media files); revision",
  revision.slice(0, 12)
);
