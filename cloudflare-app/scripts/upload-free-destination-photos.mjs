/**
 * One-shot staging import of three free-license destination photographs.
 * Run only as an explicit deployment maintenance step; not part of regular builds.
 * Sources: Unsplash License, photographer pages recorded for attribution.
 * No source images are stored in git; files are served from R2.
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const BUCKET = "gocamp-staging-media";
const photos = [
  {
    slug: "italy",
    filename: "italy-venice-rialto-bridge",
    photoId: "photo-1523906834658-6e24ef2386f9",
    source: "https://unsplash.com/photos/rialto-bridge-venice-italy-hFXZ5cNfkOk",
    photographer: "Damiano Baschiera"
  },
  {
    slug: "switzerland",
    filename: "switzerland-lauterbrunnen-alpine-village",
    photoId: "photo-1681151510371-3f07fd29235a",
    source: "https://unsplash.com/photos/a-village-in-the-mountains-with-a-church-in-the-foreground-HD7PbOyIXx4",
    photographer: "Ilia Bronskiy"
  },
  {
    slug: "austria",
    filename: "austria-hallstatt-lakeside-village",
    photoId: "photo-1698871061456-1834361d4e44",
    source: "https://unsplash.com/photos/a-scenic-view-of-a-town-on-a-lake-UJEOLuvPPHM",
    photographer: "Leonhard Niederwimmer"
  }
];

const presets = [
  { name: "original", width: 1920, height: 1080, quality: 79 },
  { name: "mobile", width: 480, height: 270, quality: 74 },
  { name: "tablet", width: 960, height: 540, quality: 77 },
  { name: "desktop", width: 1600, height: 900, quality: 80 }
];

if (process.env.CI !== "true") {
  throw new Error("This staging maintenance importer must only run in Cloudflare Builds (CI=true).");
}

const directory = await mkdtemp(path.join(tmpdir(), "gocamp-free-destinations-"));
try {
  for (const photo of photos) {
    const mainKey = `images/destinations/${photo.slug}/${photo.filename}.webp`;
    for (const preset of presets) {
      const key = preset.name === "original"
        ? mainKey
        : `optimized/${preset.name}/${mainKey}.webp`;
      const url = new URL(`https://images.unsplash.com/${photo.photoId}`);
      url.search = new URLSearchParams({
        fm: "webp",
        fit: "crop",
        crop: "entropy",
        w: String(preset.width),
        h: String(preset.height),
        q: String(preset.quality)
      }).toString();

      const response = await fetch(url, { headers: { Accept: "image/webp" }, signal: AbortSignal.timeout(45000) });
      if (!response.ok) throw new Error(`${photo.slug}/${preset.name} download returned HTTP ${response.status}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      if (response.headers.get("content-type")?.split(";")[0] !== "image/webp" ||
          bytes.subarray(0, 4).toString("ascii") !== "RIFF" ||
          bytes.subarray(8, 12).toString("ascii") !== "WEBP") {
        throw new Error(`${photo.slug}/${preset.name} was not a valid WebP file`);
      }
      if (bytes.byteLength < 1000 || bytes.byteLength > 2 * 1024 * 1024) {
        throw new Error(`${photo.slug}/${preset.name} unexpected WebP size: ${bytes.byteLength}`);
      }

      const localFile = path.join(directory, `${photo.slug}-${preset.name}.webp`);
      await writeFile(localFile, bytes);
      const upload = execFileSync("./node_modules/.bin/wrangler", [
        "r2", "object", "put", `${BUCKET}/${key}`, "--file", localFile,
        "--content-type", "image/webp"
      ], { encoding: "utf8", maxBuffer: 2 * 1024 * 1024, timeout: 90000, env: { ...process.env, CI: "true" } });
      if (!/upload|create|success|complete/i.test(upload)) {
        throw new Error(`Cannot confirm R2 upload of ${key}: ${upload.slice(0, 300)}`);
      }
      console.log("DESTINATION_MEDIA_UPLOADED " + JSON.stringify({
        slug: photo.slug, preset: preset.name, objectKey: key,
        width: preset.width, height: preset.height, bytes: bytes.byteLength,
        sha256: createHash("sha256").update(bytes).digest("hex"),
        source: photo.source, photographer: photo.photographer
      }));
    }
  }
} finally {
  await rm(directory, { recursive: true, force: true });
}
