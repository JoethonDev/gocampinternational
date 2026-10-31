import type { Route } from "./+types/admin-media-preview";
import { getAdmin } from "../lib/admin.server";

/** Admin-only, uncacheable R2 preview for hidden images.
 * The public /media/:id route deliberately rejects unpublished media.
 */
export async function loader({ request, context, params }: Route.LoaderArgs) {
  const env = context.cloudflare.env;
  const id = params.id || "";
  if (!/^[a-f0-9-]{36}$/i.test(id)) throw new Response("Not found", { status: 404 });
  // Return 404 rather than exposing media existence to unauthenticated callers.
  if (!(await getAdmin(request, env.DB))) throw new Response("Not found", { status: 404 });
  const row = await env.DB.prepare("SELECT object_key,mime_type FROM media_assets WHERE id=?")
    .bind(id)
    .first<{ object_key: string; mime_type: string }>();
  if (!row || !row.mime_type.startsWith("image/")) throw new Response("Not found", { status: 404 });
  const object = await env.MEDIA.get(row.object_key);
  if (!object) throw new Response("Not found", { status: 404 });
  const headers = new Headers({
    "Content-Type": row.mime_type,
    "Cache-Control": "private,no-store",
    Vary: "Cookie",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer"
  });
  return new Response(object.body, { status: 200, headers });
}
