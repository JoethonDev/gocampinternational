import type { InquiryRecord } from "../../../lib/domain";
import type {
  DashboardContentRow,
  DashboardCount,
  DashboardData,
  DashboardDocumentRow,
  DashboardMedia
} from "./types";

export async function loadDashboard(db: D1Database, env: Env): Promise<DashboardData> {
  const [catalog, inquiries, inquiryRows, recentContent, documents, media] = await Promise.all([
    db
      .prepare(
        "SELECT kind,status,COUNT(*) AS count FROM catalog_entities GROUP BY kind,status ORDER BY kind,status"
      )
      .all<DashboardCount>(),
    db
      .prepare(
        "SELECT kind,status,COUNT(*) AS count FROM inquiries GROUP BY kind,status ORDER BY kind,status"
      )
      .all<DashboardCount>(),
    db
      .prepare(
        "SELECT id,kind,name,email,phone,status,content_json,created_at FROM inquiries ORDER BY created_at DESC LIMIT 5"
      )
      .all<InquiryRecord>(),
    db
      .prepare(
        "SELECT kind,slug,name,status,updated_at FROM catalog_entities ORDER BY updated_at DESC, name LIMIT 6"
      )
      .all<DashboardContentRow>(),
    db
      .prepare("SELECT key,updated_at FROM site_documents ORDER BY key")
      .all<DashboardDocumentRow>(),
    db
      .prepare(
        "SELECT COUNT(*) AS count, COALESCE(SUM(bytes),0) AS bytes, COALESCE(SUM(is_public),0) AS published FROM media_assets"
      )
      .first<DashboardMedia>()
  ]);

  return {
    counts: catalog.results,
    inquiryCounts: inquiries.results,
    inquiries: inquiryRows.results,
    recentContent: recentContent.results,
    documents: documents.results,
    media: media || { count: 0, bytes: 0, published: 0 },
    environment: env.GOCAMP_ENV,
    source: env.MIGRATION_SOURCE_SHA,
    now: Math.floor(Date.now() / 1000)
  };
}
