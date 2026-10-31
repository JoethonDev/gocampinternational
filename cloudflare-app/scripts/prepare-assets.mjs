import { cp, mkdir, readdir, stat, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.resolve(root, "..");
const targets = {
  images: new Set([".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif", ".svg", ".ico"]),
  css: new Set([".css"]),
  js: new Set([".js"]),
  uploads: new Set([".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif", ".svg"])
};
async function copySafe(dir, from, to, allowed) {
  for (const ent of await readdir(from, { withFileTypes: true })) {
    if (ent.isSymbolicLink()) continue;
    const origin = path.join(from, ent.name),
      dest = path.join(to, ent.name);
    if (ent.isDirectory()) {
      await mkdir(dest, { recursive: true });
      await copySafe(dir, origin, dest, allowed);
    } else if (ent.isFile() && allowed.has(path.extname(ent.name).toLowerCase())) {
      await mkdir(path.dirname(dest), { recursive: true });
      await cp(origin, dest);
    }
  }
}
for (const [dir, allowed] of Object.entries(targets)) {
  const from = path.join(source, dir);
  try {
    if ((await stat(from)).isDirectory())
      await copySafe(dir, from, path.join(root, "public", dir), allowed);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
// Build a searchable media inventory (path + byte size) for the admin library.
async function collectMedia(dir, urlPrefix) {
  const found = [];
  try {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory())
        found.push(...(await collectMedia(full, urlPrefix + "/" + entry.name)));
      else if (entry.isFile() && targets.images.has(path.extname(entry.name).toLowerCase())) {
        found.push({
          path: urlPrefix + "/" + entry.name,
          folder: "images",
          bytes: (await stat(full)).size
        });
      }
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  return found;
}
const inventory = (await collectMedia(path.join(source, "images"), "/images")).sort((a, b) =>
  a.path.localeCompare(b.path)
);
await writeFile(
  path.join(root, "app", "legacy-media.json"),
  JSON.stringify(inventory, null, 2) + "\n"
);
// Identify the exact Git revision served by the static-asset deployment.
const revision = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: source,
  encoding: "utf8"
}).trim();
await writeFile(path.join(root, "public", "migration-commit.txt"), revision + "\n");
console.log(
  "Prepared committed legacy public assets (no PHP copied), revision",
  revision.slice(0, 12)
);
