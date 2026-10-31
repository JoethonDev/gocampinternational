import { redirect } from "react-router";
import type { Route } from "./+types/admin-media";
import { requireAdmin, requireSameOrigin } from "../lib/admin.server";
import { uploadMedia, mutateMedia, MAX_UPLOAD_BYTES } from "../lib/media.server";
import { AdminShell } from "../components/admin/AdminShell";
import { MediaLibraryPage } from "../features/admin/MediaLibraryPage";
import { loadMediaLibrary } from "../features/admin/media.server";

export function meta() {
  return [{ title: "GoCamp Media Library" }, { name: "robots", content: "noindex,nofollow" }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const db = context.cloudflare.env.DB;
  const session = await requireAdmin(request, db);
  const data = await loadMediaLibrary(db, new URL(request.url));
  return {
    session,
    data,
    uploaded: new URL(request.url).searchParams.has("uploaded"),
    updated: new URL(request.url).searchParams.has("updated"),
    staging: context.cloudflare.env.GOCAMP_ENV === "staging"
  };
}

export async function action({ request, context }: Route.ActionArgs) {
  requireSameOrigin(request);
  await requireAdmin(request, context.cloudflare.env.DB);
  const length = Number(request.headers.get("content-length") || 0);
  if (length > MAX_UPLOAD_BYTES + 16384) {
    throw new Response("Upload too large", { status: 413 });
  }
  const form = await request.formData();
  const operation = String(form.get("operation") || "");
  if (operation === "upload") {
    const id = await uploadMedia(request, context.cloudflare.env, form);
    return redirect(`/admin/media?uploaded=${id}#uploads`);
  }
  await mutateMedia(request, context.cloudflare.env, form);
  return redirect("/admin/media?updated=1#uploads");
}

export default function AdminMedia({ loaderData }: Route.ComponentProps) {
  const { session, data, uploaded, updated, staging } = loaderData;
  return (
    <AdminShell username={session.username} csrf={session.csrf}>
      <MediaLibraryPage
        data={data}
        csrf={session.csrf}
        uploaded={uploaded}
        updated={updated}
        staging={staging}
      />
    </AdminShell>
  );
}
