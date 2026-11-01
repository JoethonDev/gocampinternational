/**
 * Upload-time R2 image optimization, shared with the staging-only backfill.
 * Variants are permanent R2 objects, not per-request transformations or a cache.
 * Originals are never overwritten. Names are deterministic and retries are safe.
 */
export const RESPONSIVE_PRESETS = [
  { name: "mobile", width: 480, quality: 82 },
  { name: "tablet", width: 960, quality: 84 },
  { name: "desktop", width: 1600, quality: 87 }
] as const;

type Preset = (typeof RESPONSIVE_PRESETS)[number];
type MediaSource = {
  id: string;
  object_key: string;
  mime_type: string;
};
export type OptimizationResult = {
  mediaId: string;
  created: string[];
  skipped: string[];
  errors: string[];
  width?: number;
  height?: number;
};

const supportedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
export const variantKey = (objectKey: string, preset: string) =>
  `optimized/${preset}/${objectKey}.webp`;

function isValidDimension(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

async function makeVariant(
  env: Env,
  buffer: ArrayBuffer,
  preset: Preset,
  sourceWidth: number
): Promise<{ data: ArrayBuffer; method: "ai" | "standard" }> {
  const ai = sourceWidth < preset.width && preset.width <= sourceWidth * 4;
  const base = { width: preset.width, fit: (sourceWidth < preset.width ? "contain" : "scale-down") as "contain" | "scale-down" };
  const run = async (generated: boolean) => {
    // Transform options match Cloudflare's 2026 Images feature options.
    const options = generated ? { ...base, upscale: "generate" as const } : base;
    const result = await env.IMAGES.input(new Blob([buffer]).stream())
      .transform(options)
      .output({ format: "image/webp", quality: preset.quality });
    const response = result.response();
    if (!response.ok) throw new Error(`Image conversion returned ${response.status}`);
    return response.arrayBuffer();
  };
  if (ai) {
    try {
      return { data: await run(true), method: "ai" };
    } catch (error) {
      const message = String(error instanceof Error ? error.message : error).toLowerCase();
      // Never retry on plan limit or account authorization errors.
      if (/9422|quota|limit|billing/.test(message)) throw error;
      return { data: await run(false), method: "standard" };
    }
  }
  return { data: await run(false), method: "standard" };
}

export async function optimizeStoredMedia(env: Env, asset: MediaSource): Promise<OptimizationResult> {
  const result: OptimizationResult = { mediaId: asset.id, created: [], skipped: [], errors: [] };
  if (!supportedTypes.has(asset.mime_type)) {
    result.skipped.push("unsupported_or_animated");
    return result;
  }
  const source = await env.MEDIA.get(asset.object_key);
  if (!source) {
    result.errors.push("Original image is missing from staging R2");
    return result;
  }
  if (source.size > 20 * 1024 * 1024) {
    result.skipped.push("above_cloudflare_images_20_mb_limit");
    return result;
  }
  const bytes = await source.arrayBuffer();
  let info: { width: number; height: number };
  try {
    const raw = await env.IMAGES.info(new Blob([bytes]).stream());
    if (!("width" in raw && "height" in raw) || !isValidDimension(raw.width) || !isValidDimension(raw.height)) {
      throw new Error("Cloudflare returned invalid image dimensions");
    }
    info = { width: raw.width, height: raw.height };
    result.width = raw.width;
    result.height = raw.height;
    await env.DB.prepare(
      "UPDATE media_assets SET width=?,height=? WHERE id=?"
    ).bind(info.width, info.height, asset.id).run();
  } catch (error) {
    result.errors.push(`info: ${error instanceof Error ? error.message : String(error)}`);
    return result;
  }

  for (const preset of RESPONSIVE_PRESETS) {
    const key = variantKey(asset.object_key, preset.name);
    const existing = await env.DB.prepare(
      "SELECT object_key FROM media_variants WHERE media_id=? AND preset=?"
    ).bind(asset.id, preset.name).first<{ object_key: string }>();
    if (existing && await env.MEDIA.head(existing.object_key)) {
      result.skipped.push(preset.name);
      continue;
    }
    try {
      const optimized = await makeVariant(env, bytes, preset, info.width);
      if (optimized.data.byteLength > 2 * 1024 * 1024) {
        result.skipped.push(`${preset.name}: exceeds 2 MB target`);
        continue;
      }
      const transformedInfo = await env.IMAGES.info(new Blob([optimized.data]).stream());
      if (!("width" in transformedInfo && "height" in transformedInfo) || !isValidDimension(transformedInfo.width) || !isValidDimension(transformedInfo.height)) {
        throw new Error("No valid output dimensions");
      }
      const previous = await env.MEDIA.head(key);
      if (!previous) {
        await env.MEDIA.put(key, optimized.data, {
          httpMetadata: { contentType: "image/webp" }
        });
      }
      try {
        await env.DB.prepare(
          `INSERT INTO media_variants
            (media_id,preset,object_key,mime_type,bytes,width,height,method)
           VALUES(?,?,?,'image/webp',?,?,?,?)
           ON CONFLICT(media_id,preset) DO UPDATE SET
              object_key=excluded.object_key,
              bytes=excluded.bytes,
              width=excluded.width,
              height=excluded.height,
              method=excluded.method`
        ).bind(
          asset.id, preset.name, key, optimized.data.byteLength,
          transformedInfo.width, transformedInfo.height, optimized.method
        ).run();
      } catch (error) {
        if (!previous) await env.MEDIA.delete(key).catch(() => undefined);
        throw error;
      }
      result.created.push(preset.name);
    } catch (error) {
      result.errors.push(`${preset.name}: ${error instanceof Error ? error.message : String(error)}`);
      // Keep the original accessible. Other variants may still succeed.
    }
  }
  return result;
}
