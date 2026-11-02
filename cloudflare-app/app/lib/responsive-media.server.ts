export const MEDIA_WIDTHS = [480, 960, 1920] as const;
export type MediaWidth = (typeof MEDIA_WIDTHS)[number];
export type ManagedMedia = {
  id: string;
  object_key: string;
  mime_type: string;
  sha256: string;
  width?: number | null;
};
export function requestedWidth(url: URL): MediaWidth | null {
  const value = Number(url.searchParams.get("w"));
  return MEDIA_WIDTHS.includes(value as MediaWidth) ? (value as MediaWidth) : null;
}
export async function getMediaObject(env: Env, media: ManagedMedia, width: MediaWidth | null) {
  if (!width) return env.MEDIA.get(media.object_key);
  const preset = width === 480 ? "mobile" : width === 960 ? "tablet" : null;
  if (preset) {
    const variant = await env.DB.prepare(
      "SELECT object_key FROM media_variants WHERE media_id=? AND preset=? LIMIT 1"
    )
      .bind(media.id, preset)
      .first<{ object_key: string }>();
    if (variant) {
      const existing = await env.MEDIA.get(variant.object_key);
      if (existing) return existing;
    }
  }
  if (media.width && media.width <= width && media.mime_type === "image/webp") {
    return env.MEDIA.get(media.object_key);
  }
  if (!/^image\/(webp|jpeg|png|gif|avif)$/.test(media.mime_type))
    return env.MEDIA.get(media.object_key);
  const target =
    "optimized/responsive/" +
    media.sha256.slice(0, 2) +
    "/" +
    media.sha256 +
    "-w" +
    width +
    "-q84.webp";
  const cached = await env.MEDIA.get(target);
  if (cached) return cached;
  const source = await env.MEDIA.get(media.object_key);
  if (!source) return null;
  const resized = (
    await env.IMAGES.input(source.body)
      .transform({ width, fit: "scale-down" })
      .output({ format: "image/webp", quality: 84, anim: true })
  ).response();
  if (!resized.ok || !resized.headers.get("content-type")?.startsWith("image/webp"))
    return env.MEDIA.get(media.object_key);
  const bytes = await resized.arrayBuffer();
  if (!bytes.byteLength) return env.MEDIA.get(media.object_key);
  await env.MEDIA.put(target, bytes, {
    httpMetadata: {
      contentType: "image/webp",
      cacheControl: "public, max-age=31536000, immutable"
    },
    customMetadata: { source_sha256: media.sha256, pipeline: "responsive-q84-v1" }
  });
  return env.MEDIA.get(target);
}
export function imageResponse(request: Request, object: R2ObjectBody): Response {
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Content-Type", object.httpMetadata?.contentType || "image/webp");
  headers.set("Cache-Control", "public, max-age=86400, s-maxage=604800");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("ETag", object.httpEtag);
  headers.set("X-GoCamp-Media-Source", "r2");
  if (request.headers.get("If-None-Match") === object.httpEtag)
    return new Response(null, { status: 304, headers });
  return new Response(request.method === "HEAD" ? null : object.body, { status: 200, headers });
}
