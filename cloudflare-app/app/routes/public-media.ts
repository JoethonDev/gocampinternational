import type { Route } from "./+types/public-media";

export async function loader({ request, context, params }: Route.LoaderArgs) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    throw new Response("Method Not Allowed", { status: 405 });
  }
  const id = params.id || "";
  if (!/^[a-f0-9-]{36}$/i.test(id)) throw new Response("Not found", { status: 404 });

  const env = context.cloudflare.env;
  const row = await env.DB.prepare(
    "SELECT object_key,mime_type FROM media_assets WHERE id=? AND is_public=1"
  ).bind(id).first<{ object_key: string; mime_type: string }>();
  if (!row) throw new Response("Not found", { status: 404 });

  const object = request.method === "HEAD" ? await env.MEDIA.head(row.object_key) : await env.MEDIA.get(row.object_key);
  if (!object) throw new Response("Not found", { status: 404 });

  // A media ID identifies stable content. Re-uploaded changed bytes receive a new ID.
  // Browser and Cloudflare edge caches can therefore safely reuse the response.
  const headers = new Headers({
    "Content-Type": row.mime_type,
    "Cache-Control": "public, max-age=86400, s-maxage=604800",
    "X-Content-Type-Options": "nosniff",
    "ETag": object.httpEtag
  });
  if (request.headers.get("If-None-Match") === object.httpEtag) {
    return new Response(null, { status: 304, headers });
  }
  return new Response(request.method === "HEAD" ? null : (object as R2ObjectBody).body, { status: 200, headers });
}
