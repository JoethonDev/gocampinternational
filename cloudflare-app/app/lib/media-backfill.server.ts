import { sha256Bytes } from "./crypto.server";
/**
 * Staging-only migration helper for media predating the WebP upload pipeline.
 * Preserves every existing /media/:id and legacy_path reference.
 */
export async function backfillWebp(env: Env, maxItems = 20) {
  if (String(env.GOCAMP_ENV) !== "staging") return { processed: 0, converted: 0, failures: [] };
  const items = await env.DB.prepare(
    "SELECT id,object_key,mime_type FROM media_assets WHERE mime_type != 'image/webp' ORDER BY id LIMIT ?"
  )
    .bind(Math.min(Math.max(maxItems, 1), 20))
    .all<{ id: string; object_key: string; mime_type: string }>();

  let converted = 0;
  const failures: string[] = [];
  for (const item of items.results || []) {
    try {
      const original = await env.MEDIA.get(item.object_key);
      if (!original) throw new Error("Missing original R2 object");
      const optimized = (
        await env.IMAGES.input(original.body).output({
          format: "image/webp",
          quality: 86,
          anim: true
        })
      ).response();
      if (!optimized.ok || !optimized.headers.get("content-type")?.startsWith("image/webp")) {
        throw new Error("WebP encoder failed");
      }
      const bytes = await optimized.arrayBuffer();
      if (!bytes.byteLength) throw new Error("Empty output");
      const sha = await sha256Bytes(bytes);
      // The original name stays in D1 for CMS; the R2 key is immutable.
      const commonKey = `images/optimized/${sha.slice(0, 2)}/${sha}.webp`;
      const existing = await env.DB.prepare(
        "SELECT id FROM media_assets WHERE object_key=? AND id!=? LIMIT 1"
      )
        .bind(commonKey, item.id)
        .first<{ id: string }>();
      // Keep distinct /media IDs even if two preexisting records are duplicates.
      const key = existing
        ? `images/optimized/${sha.slice(0, 2)}/${sha}-${item.id}.webp`
        : commonKey;
      if (!(await env.MEDIA.head(key))) {
        await env.MEDIA.put(key, bytes, {
          httpMetadata: {
            contentType: "image/webp",
            cacheControl: "public, max-age=31536000, immutable"
          },
          customMetadata: { sha256: sha, optimized_from: item.object_key }
        });
      }
      const updated = await env.DB.prepare(
        "UPDATE media_assets SET object_key=?,mime_type='image/webp',bytes=?,sha256=? WHERE id=? AND object_key=?"
      )
        .bind(key, bytes.byteLength, sha, item.id, item.object_key)
        .run();
      if (updated.meta.changes === 1) converted++;
    } catch (error) {
      failures.push(`${item.id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return { processed: (items.results || []).length, converted, failures };
}
