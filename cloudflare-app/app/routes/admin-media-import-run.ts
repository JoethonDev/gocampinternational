import { getCloudflare } from "../lib/cloudflare-context";
import type { Route } from "./+types/admin-media-import-run";
import { verifyAdminPost } from "../lib/admin.server";
import {
  BATCH_SIZE,
  LEGACY_IMAGES,
  importLegacyImage,
  requireStaging
} from "../features/admin/media-import.server";

const noStore = { "Cache-Control": "no-store" };

export function loader() {
  throw new Response("Method Not Allowed", { status: 405, headers: { Allow: "POST" } });
}

export async function action({ request, context }: Route.ActionArgs) {
  const env = getCloudflare(context).env;
  requireStaging(env);
  if (request.method !== "POST") {
    throw new Response("Method not allowed", { status: 405 });
  }
  const form = await request.formData();
  await verifyAdminPost(request, env.DB, form);
  const raw = String(form.get("cursor") ?? "");
  const cursor = Number(raw);
  if (!/^\d+$/.test(raw) || !Number.isSafeInteger(cursor) || cursor > LEGACY_IMAGES.length) {
    throw new Response("Invalid cursor", { status: 400 });
  }
  const batch = LEGACY_IMAGES.slice(cursor, cursor + BATCH_SIZE);
  const results = await Promise.allSettled(
    batch.map((item) => importLegacyImage(item, request, env))
  );
  const failures = results.flatMap((result, index) =>
    result.status === "rejected"
      ? [
          {
            path: batch[index].path,
            reason: result.reason instanceof Error ? result.reason.message : "Import failed"
          }
        ]
      : []
  );
  return Response.json(
    {
      uploaded: 0,
      existing: results.filter((result) => result.status === "fulfilled").length,
      failures,
      nextCursor: failures.length ? cursor : Math.min(LEGACY_IMAGES.length, cursor + BATCH_SIZE),
      total: LEGACY_IMAGES.length
    },
    { headers: noStore }
  );
}
