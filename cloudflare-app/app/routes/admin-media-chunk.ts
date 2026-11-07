import { getCloudflare } from "../lib/cloudflare-context";
import type { Route } from "./+types/admin-media-chunk";
import { requireAdmin } from "../lib/admin.server";
import { loadMediaLibrary } from "../features/admin/media.server";

export function loader(_args: Route.LoaderArgs) {
  return loadChunk(_args);
}

async function loadChunk({ request, context }: Route.LoaderArgs) {
  await requireAdmin(request, getCloudflare(context).env.DB);
  const data = await loadMediaLibrary(getCloudflare(context).env.DB, new URL(request.url), false);
  return Response.json(
    {
      items: data.items,
      usage: data.usage,
      page: data.page,
      totalPages: data.totalPages,
      total: data.total
    },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
