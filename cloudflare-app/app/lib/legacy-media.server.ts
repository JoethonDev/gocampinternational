import { r2Response } from "./r2-response.server";
import { isImagePreset } from "./responsive-media";

export async function serveR2Image(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const key = pathname.slice(1);
  // Only read image files from the staging R2 bucket; never expose arbitrary object keys.
  if (
    !new RegExp(
      "^(?:images|uploads)/[a-zA-Z0-9_().%+-][a-zA-Z0-9_().%+/-]*[.](webp|png|jpe?g|avif|gif|svg|ico)$",
      "i"
    ).test(key) ||
    key.includes("..") ||
    /%2f/i.test(key) ||
    /%5c/i.test(key)
  ) {
    return new Response("Not found", { status: 404 });
  }
  const preset = url.searchParams.get("variant");
  const read = (candidate: string) =>
    request.method === "HEAD" ? env.MEDIA.head(candidate) : env.MEDIA.get(candidate);
  // Materialized R2 variants, not dynamic transformation and not a cache.
  // Legacy .png/.gif URLs keep working when D1 now points at WebP.
  // Honor CMS visibility for direct and historical URLs as well as /media/:id.
  const registry = await env.DB.prepare(
    "SELECT object_key,is_public FROM media_assets WHERE legacy_path=? OR object_key=? LIMIT 1"
  )
    .bind("/" + key, key)
    .first<{ object_key: string; is_public: number }>();
  if (registry && !registry.is_public) return new Response("Not found", { status: 404 });
  const sourceKey = registry?.object_key || key;
  const optimizedKey = isImagePreset(preset) ? `optimized/${preset}/${sourceKey}.webp` : null;
  const obj = (optimizedKey && (await read(optimizedKey))) || (await read(sourceKey));
  if (obj) return r2Response(request, obj, "public, max-age=86400");
  // R2 is the source of truth: no local/GitHub static-asset fallback after migration.
  return new Response("Image not found", { status: 404 });
}
