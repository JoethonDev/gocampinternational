import { getCloudflare } from "../lib/cloudflare-context";
import type { Route } from "./+types/admin-media-names";
import { requireAdmin } from "../lib/admin.server";

export async function loader({ request, context }: Route.LoaderArgs) {
  const db = getCloudflare(context).env.DB;
  await requireAdmin(request, db);
  const rows = await db
    .prepare(
      `SELECT id,display_name FROM media_assets
     WHERE is_public=1 AND legacy_path IS NULL
     ORDER BY created_at DESC, id DESC LIMIT 5000`
    )
    .all<{ id: string; display_name: string }>();

  return Response.json(
    {
      items: (rows.results || []).map((row) => ({
        path: `/media/${row.id}`,
        name: row.display_name
      }))
    },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
