import type { Route } from "./+types/public-media";

export async function loader({ context, params, request }: Route.LoaderArgs) {
  const id = params.id || "";
  if (!/^[a-f0-9-]{36}$/i.test(id)) throw new Response("Not found", { status: 404 });
  const env = context.cloudflare.env;
  const requested = new URL(request.url).searchParams.get("variant");
  const preset = requested && ["mobile", "tablet", "desktop"].includes(requested) ? requested : null;
  const row = await env.DB.prepare(
    "SELECT object_key,mime_type FROM media_assets WHERE id=? AND is_public=1"
  ).bind(id).first<{ object_key: string; mime_type: string }>();
  if (!row) throw new Response("Not found", { status: 404 });

  const variant = preset ? await env.DB.prepare(
    "SELECT object_key,mime_type FROM media_variants WHERE media_id=? AND preset=?"
  ).bind(id, preset).first<{ object_key: string; mime_type: string }>() : null;
  const optimized = variant ? await env.MEDIA.get(variant.object_key) : null;
  const object = optimized || await env.MEDIA.get(row.object_key);
  if (!object) throw new Response("Not found", { status: 404 });
  const headers = new Headers({
    "Content-Type": optimized ? "image/webp" : row.mime_type,
    "Cache-Control": "public,max-age=3600",
    "X-Content-Type-Options": "nosniff"
  });
  if (object.httpEtag) headers.set("ETag", object.httpEtag);
  return new Response(object.body, { status: 200, headers });
}
