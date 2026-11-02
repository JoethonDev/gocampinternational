import type { Route } from "./+types/public-media";
import { getMediaObject, imageResponse, requestedWidth } from "../lib/responsive-media.server";
import type { ManagedMedia } from "../lib/responsive-media.server";

export async function loader({ request, context, params }: Route.LoaderArgs) {
  if (request.method !== "GET" && request.method !== "HEAD")
    throw new Response("Method Not Allowed", { status: 405 });
  const id = params.id || "";
  if (!/^[a-f0-9-]{36}$/i.test(id)) throw new Response("Not found", { status: 404 });
  const env = context.cloudflare.env;
  const row = await env.DB.prepare(
    "SELECT id,object_key,mime_type,sha256,width FROM media_assets WHERE id=? AND is_public=1"
  ).bind(id).first<ManagedMedia>();
  if (!row) throw new Response("Not found", { status: 404 });
  const object = await getMediaObject(env, row, requestedWidth(new URL(request.url)));
  if (!object) throw new Response("Not found", { status: 404 });
  return imageResponse(request, object);
}
