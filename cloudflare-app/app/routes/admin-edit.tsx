import { redirect } from "react-router";
import type { Route } from "./+types/admin-edit";
import { requireAdmin } from "../lib/admin.server";
import { duplicateEntity, ensureKind, saveEntity } from "../lib/catalog-write.server";
import { AdminShell } from "../components/admin/AdminShell";
import { listCategories, listPrograms } from "../lib/catalog.server";
import type { CategoryRecord, ProgramRecord } from "../lib/domain";
import { EntityEditorPage } from "../features/admin/catalog/EntityEditorPage";

export function meta() {
  return [{ title: "Edit GoCamp Content" }, { name: "robots", content: "noindex,nofollow" }];
}

export async function loader({ request, context, params }: Route.LoaderArgs) {
  const db = context.cloudflare.env.DB;
  const session = await requireAdmin(request, db);
  const kind = ensureKind(params.kind || "");
  const slug = params.slug || "";
  const isNew = slug === "new";
  if (!isNew && !/^[a-z0-9][a-z0-9_-]{0,159}$/.test(slug)) {
    throw new Response("Invalid ID", { status: 404 });
  }
  const row = isNew
    ? null
    : await db
        .prepare("SELECT content_json,revision FROM catalog_entities WHERE kind=? AND slug=?")
        .bind(kind, slug)
        .first<{ content_json: string; revision: number }>();
  if (!isNew && !row) throw new Response("Not found", { status: 404 });

  const [categories, programs, media] = await Promise.all([
    kind === "program" ? listCategories(db) : Promise.resolve<CategoryRecord[]>([]),
    kind === "destination" ? listPrograms(db, false) : Promise.resolve<ProgramRecord[]>([]),
    db
      .prepare("SELECT id FROM media_assets WHERE is_public=1 ORDER BY created_at DESC LIMIT 300")
      .all<{ id: string }>()
  ]);
  return {
    session,
    kind,
    slug,
    isNew,
    item: row ? (JSON.parse(row.content_json) as Record<string, unknown>) : {},
    revision: row?.revision || 0,
    categories,
    programs,
    uploadedMedia: (media.results || []).map((item) => `/media/${item.id}`),
    saved: new URL(request.url).searchParams.has("saved")
  };
}

export async function action({ request, context, params }: Route.ActionArgs) {
  const kind = ensureKind(params.kind || "");
  const slug = params.slug || "";
  const form = await request.formData();
  if (form.get("intent") === "duplicate") {
    if (slug === "new") {
      throw new Response("Save the new record before duplicating it", { status: 400 });
    }
    const copy = await duplicateEntity(request, context.cloudflare.env.DB, kind, form, slug);
    return redirect(`/admin/catalog/${kind}/${copy}?saved=1`);
  }
  const value = await saveEntity(
    request,
    context.cloudflare.env.DB,
    kind,
    form,
    slug === "new" ? undefined : slug
  );
  return redirect(`/admin/catalog/${kind}/${value}?saved=1`);
}

export default function Edit({ loaderData }: Route.ComponentProps) {
  const { session, kind, slug, isNew, item, revision, categories, programs, uploadedMedia, saved } =
    loaderData;
  return (
    <AdminShell username={session.username} csrf={session.csrf}>
      <EntityEditorPage
        session={session}
        kind={kind}
        slug={slug}
        isNew={isNew}
        item={item}
        revision={revision}
        categories={categories}
        programs={programs}
        uploadedMedia={uploadedMedia}
        saved={saved}
      />
    </AdminShell>
  );
}
