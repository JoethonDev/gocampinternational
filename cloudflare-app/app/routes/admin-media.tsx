import { getCloudflare } from "../lib/cloudflare-context";
import { redirect } from "react-router";
import type { Route } from "./+types/admin-media";
import { requireAdmin, requireSameOrigin, verifyAdminPost } from "../lib/admin.server";
import { backfillWebp } from "../lib/media-backfill.server";
import { MAX_UPLOAD_BODY_BYTES, mutateMedia, uploadMediaFiles } from "../lib/media.server";
import { AdminShell } from "../components/admin/AdminShell";
import { MediaLibraryPage } from "../features/admin/MediaLibraryPage";
import { loadMediaLibrary } from "../features/admin/media.server";
import { readLimitedForm } from "../lib/request.server";

export function meta() {
  return [{ title: "GoCamp Media Library" }, { name: "robots", content: "noindex,nofollow" }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const db = getCloudflare(context).env.DB;
  const session = await requireAdmin(request, db);
  const url = new URL(request.url);
  const data = await loadMediaLibrary(db, url);
  return {
    session,
    data,
    uploaded: Number(url.searchParams.get("uploaded") || 0),
    uploadError: url.searchParams.get("uploadError"),
    updated: url.searchParams.has("updated"),
    staging: getCloudflare(context).env.GOCAMP_ENV === "staging"
  };
}

export async function action({ request, context }: Route.ActionArgs) {
  requireSameOrigin(request);
  await requireAdmin(request, getCloudflare(context).env.DB);
  const form = await readLimitedForm(request, MAX_UPLOAD_BODY_BYTES);
  const operation = String(form.get("operation") || "");
  if (operation === "backfill-webp") {
    if (getCloudflare(context).env.GOCAMP_ENV !== "staging")
      throw new Response("Not found", { status: 404 });
    await verifyAdminPost(request, getCloudflare(context).env.DB, form);
    const result = await backfillWebp(getCloudflare(context).env, 4);
    const remaining = await getCloudflare(context)
      .env.DB.prepare("SELECT COUNT(*) AS n FROM media_assets WHERE mime_type != 'image/webp'")
      .first<{ n: number }>();
    return Response.json(
      { ...result, remaining: remaining?.n || 0 },
      {
        headers: { "Cache-Control": "no-store" }
      }
    );
  }
  if (operation === "upload") {
    const result = await uploadMediaFiles(
      request,
      getCloudflare(context).env,
      form,
      getCloudflare(context).ctx
    );
    const error = result.errors.map((item) => `${item.name}: ${item.message}`).join("; ");
    if (!result.uploaded.length) {
      return redirect(
        `/admin/media?uploadError=${encodeURIComponent(error || "Upload failed")}#uploads`
      );
    }
    return redirect(
      `/admin/media?uploaded=${result.uploaded.length}${
        error ? `&uploadError=${encodeURIComponent(error)}` : ""
      }#uploads`
    );
  }
  await mutateMedia(request, getCloudflare(context).env, form);
  return redirect("/admin/media?updated=1#uploads");
}

export default function AdminMedia({ loaderData }: Route.ComponentProps) {
  const { session, data, uploaded, uploadError, updated, staging } = loaderData;
  return (
    <AdminShell username={session.username} csrf={session.csrf}>
      <MediaLibraryPage
        key={`${data.q}|${data.folder}`}
        data={data}
        csrf={session.csrf}
        uploaded={uploaded}
        uploadError={uploadError}
        updated={updated}
        staging={staging}
      />
    </AdminShell>
  );
}
