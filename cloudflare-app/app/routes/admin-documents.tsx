import { redirect } from "react-router";
import type { Route } from "./+types/admin-documents";
import { requireAdmin } from "../lib/admin.server";
import { saveDocument } from "../lib/catalog-write.server";
import { AdminShell } from "../components/admin/AdminShell";
import { DocumentEditorPage } from "../features/admin/documents/DocumentEditorPage";
import type { DocumentKey } from "../features/admin/documents/shared";

const parseKey = (value: string): DocumentKey => {
  if (value === "site_settings" || value === "faq" || value === "camp_memories") return value;
  throw new Response("Not Found", { status: 404 });
};

export function meta() {
  return [{ title: "GoCamp Content Settings" }, { name: "robots", content: "noindex,nofollow" }];
}

export async function loader({ request, context, params }: Route.LoaderArgs) {
  const db = context.cloudflare.env.DB;
  const session = await requireAdmin(request, db);
  const key = parseKey(params.key || "");
  const row = await db
    .prepare("SELECT content_json,revision FROM site_documents WHERE key=?")
    .bind(key)
    .first<{ content_json: string; revision: number }>();
  if (!row) throw new Response("Document not found", { status: 404 });
  const media =
    key === "camp_memories"
      ? await db
          .prepare(
            "SELECT id FROM media_assets WHERE is_public=1 ORDER BY created_at DESC LIMIT 300"
          )
          .all<{ id: string }>()
      : null;
  return {
    session,
    key,
    content: row.content_json,
    revision: row.revision,
    uploadedMedia: (media?.results || []).map((item) => `/media/${item.id}`),
    saved: new URL(request.url).searchParams.has("saved")
  };
}

export async function action({ request, context, params }: Route.ActionArgs) {
  const key = parseKey(params.key || "");
  await saveDocument(request, context.cloudflare.env.DB, key, await request.formData());
  return redirect(`/admin/documents/${key}?saved=1`);
}

export default function Documents({ loaderData }: Route.ComponentProps) {
  const { session, key, content, revision, saved, uploadedMedia } = loaderData;
  return (
    <AdminShell username={session.username} csrf={session.csrf}>
      <DocumentEditorPage
        documentKey={key}
        content={content}
        revision={revision}
        saved={saved}
        uploadedMedia={uploadedMedia}
        csrf={session.csrf}
      />
    </AdminShell>
  );
}
