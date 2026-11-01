import { cp, mkdir, readdir, stat, readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.resolve(root, "..");

// Catalog images and uploads have been migrated to R2.
// Only ordinary CSS/JS assets remain in the static build.
const targets = {
  css: new Set([".css"]),
  js: new Set([".js"])
};

async function copySafe(from, to, allowed) {
  for (const entry of await readdir(from, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue;
    const origin = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) {
      await mkdir(dest, { recursive: true });
      await copySafe(origin, dest, allowed);
    } else if (entry.isFile() && allowed.has(path.extname(entry.name).toLowerCase())) {
      await mkdir(path.dirname(dest), { recursive: true });
      await cp(origin, dest);
    }
  }
}

for (const [dir, allowed] of Object.entries(targets)) {
  const from = path.join(source, dir);
  try {
    if ((await stat(from)).isDirectory()) {
      await copySafe(from, path.join(root, "public", dir), allowed);
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

// Keep the committed legacy media inventory, so editors can browse and
// reference migrated R2 images even after Git binaries are removed.
const inventoryPath = path.join(root, "app", "legacy-media.json");
const inventory = JSON.parse(await readFile(inventoryPath, "utf8"));
if (!Array.isArray(inventory) || inventory.length !== 333) {
  throw new Error("R2 media manifest is incomplete (expected 333 items)");
}
const paths = new Set();
for (const item of inventory) {
  if (
    !item ||
    !new RegExp("^(?:images|uploads)/[a-zA-Z0-9_().%+/-]+[.](webp|png|jpe?g|avif|gif|svg|ico)$", "i").test(item.path) ||
    !Number.isSafeInteger(item.bytes) ||
    item.bytes <= 0 ||
    paths.has(item.path)
  ) {
    throw new Error("Invalid or duplicate migrated media inventory entry");
  }
  paths.add(item.path);
}

const revision = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: source,
  encoding: "utf8"
}).trim();
await writeFile(path.join(root, "public", "migration-commit.txt"), revision + "\n");
console.log("Prepared R2-backed legacy inventory (" + inventory.length + " media files); revision", revision.slice(0, 12));
