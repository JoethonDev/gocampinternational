import { getCloudflare } from "../lib/cloudflare-context";
import type { Route } from "./+types/admin-program-quick-status";
import { changeBulkStatus } from "../lib/catalog-write.server";

export function loader() {
  throw new Response("Method Not Allowed", { status: 405, headers: { Allow: "POST" } });
}

export async function action({ request, context }: Route.ActionArgs) {
  const form = await request.formData();
  const count = await changeBulkStatus(request, getCloudflare(context).env.DB, "program", form);
  return Response.json({ success: true, count }, { headers: { "Cache-Control": "no-store" } });
}
