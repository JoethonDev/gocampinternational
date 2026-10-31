import type { Route } from "./+types/admin-dashboard";
import { requireAdmin } from "../lib/admin.server";
import { AdminShell } from "../components/admin/AdminShell";
import { DashboardPage } from "../features/admin/DashboardPage";
import type { InquiryRecord } from "../lib/domain";

export function meta() {
  return [{ title: "GoCamp Admin Dashboard" }, { name: "robots", content: "noindex,nofollow" }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const db = context.cloudflare.env.DB;
  const session = await requireAdmin(request, db);
  const [catalog, inquiries, inquiryRows, recentContent, documents, media] = await Promise.all([
    db
      .prepare(
        "SELECT kind,status,COUNT(*) AS count FROM catalog_entities GROUP BY kind,status ORDER BY kind,status"
      )
      .all<{ kind: string; status: string; count: number }>(),
    db
      .prepare(
        "SELECT kind,status,COUNT(*) AS count FROM inquiries GROUP BY kind,status ORDER BY kind,status"
      )
      .all<{ kind: string; status: string; count: number }>(),
    db
      .prepare(
        "SELECT id,kind,name,email,phone,status,content_json,created_at FROM inquiries ORDER BY created_at DESC LIMIT 5"
      )
      .all<InquiryRecord>(),
    db
      .prepare(
        "SELECT kind,slug,name,status,updated_at FROM catalog_entities ORDER BY updated_at DESC, name LIMIT 6"
      )
      .all<{ kind: string; slug: string; name: string; status: string; updated_at: number }>(),
    db
      .prepare("SELECT key,updated_at FROM site_documents ORDER BY key")
      .all<{ key: string; updated_at: number }>(),
    db
      .prepare(
        "SELECT COUNT(*) AS count, COALESCE(SUM(bytes),0) AS bytes, COALESCE(SUM(is_public),0) AS published FROM media_assets"
      )
      .first<{ count: number; bytes: number; published: number }>()
  ]);
  return {
    session,
    counts: catalog.results,
    inquiryCounts: inquiries.results,
    inquiries: inquiryRows.results,
    recentContent: recentContent.results,
    documents: documents.results,
    media: media || { count: 0, bytes: 0, published: 0 },
    environment: context.cloudflare.env.GOCAMP_ENV,
    source: context.cloudflare.env.MIGRATION_SOURCE_SHA
  };
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const { session, ...data } = loaderData;
  return (
    <AdminShell username={session.username} csrf={session.csrf}>
      <DashboardPage session={session} {...data} />
    </AdminShell>
  );
}
