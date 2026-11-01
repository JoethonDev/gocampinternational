import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mediaFile = /\.(?:png|jpe?g|gif|webp|avif|svg|ico|bmp|tiff?)$/i;

async function findMedia(directory) {
  const files = [];
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return files;
    throw error;
  }
  for (const entry of entries) {
    const location = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) {
      files.push(...(await findMedia(location)));
    } else if (entry.isFile() && mediaFile.test(entry.name)) {
      files.push(path.relative(root, location));
    }
  }
  return files;
}

const media = [
  ...(await findMedia(path.join(root, "public"))),
  ...(await findMedia(path.join(root, "build", "client")))
];
if (media.length) {
  throw new Error("R2-only media violation: image files found in React static assets:\n" + media.join("\n"));
}
console.log("PASS: no image binaries in React public assets or client build");
