import type { Route } from "./+types/admin-media-optimize-run";
import { verifyAdminPost } from "../lib/admin.server";
import { optimizeStoredMedia } from "../lib/media-optimization.server";
import { requireStaging } from "../features/admin/media-import.server";

const BATCH = 2;
type MediaAsset = { id: string; object_key: string; mime_type: string };

export function loader() {
  throw new Response("Method Not Allowed", { status: 405, headers: { Allow: "POST" } });
}

export async function action({ request, context }: Route.ActionArgs) {
  const env = context.cloudflare.env;
  requireStaging(env);
  if (request.method !== "POST") throw new Response("Method Not Allowed", { status: 405 });
  const form = await request.formData();
  await verifyAdminPost(request, env.DB, form);

  const cursor = String(form.get("cursor") || "");
  if (cursor.length > 1200 || cursor.includes("\0")) {
    throw new Response("Invalid cursor", { status: 400 });
  }
  const batch = await env.DB.prepare(
    `SELECT id,object_key,mime_type FROM media_assets
     WHERE object_key > ? AND mime_type IN ('image/jpeg','image/png','image/webp','image/avif')
     ORDER BY object_key LIMIT ?`
  )
    .bind(cursor, BATCH)
    .all<MediaAsset>();

  const results = [];
  for (const row of batch.results || []) {
    // Deliberately serial: avoids GPU concurrency spikes and stays within free usage.
    results.push(await optimizeStoredMedia(env, row));
  }
  return Response.json({
    nextCursor: batch.results?.at(-1)?.object_key || cursor,
    processed: results.length,
    created: results.reduce((sum, item) => sum + item.created.length, 0),
    skipped: results.reduce((sum, item) => sum + item.skipped.length, 0),
    failures: results.flatMap((item) =>
      item.errors.map((message) => ({
        mediaId: item.mediaId,
        message
      }))
    ),
    done: (batch.results?.length || 0) < BATCH
  });
}
