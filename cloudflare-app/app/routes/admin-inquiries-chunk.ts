import { getCloudflare } from "../lib/cloudflare-context";
import type { Route } from "./+types/admin-inquiries-chunk";
import { requireAdmin } from "../lib/admin.server";
import { loadInquiryPage } from "../features/admin/inquiries.server";

export async function loader({ request, context }: Route.LoaderArgs) {
  const db = getCloudflare(context).env.DB;
  await requireAdmin(request, db);
  const result = await loadInquiryPage(db, new URL(request.url));
  return Response.json(result, {
    headers: { "Cache-Control": "private, no-store" }
  });
}
