/** Read-only projection of the PR40 catalog; use Worker D1 binding only. */
export type CatalogKind = "program" | "destination" | "category";
export type CatalogRecord = Record<string, unknown> & {
  slug: string; name: string; status: string; id?: string; banner?: string;
  image?: string; intro?: string; tagline?: string; category_slug?: string;
};
type EntityRow = { slug: string; name: string; status: string; content_json: string };
export async function listCatalog(db: D1Database, kind: CatalogKind, activeOnly = true): Promise<CatalogRecord[]> {
  const sql = activeOnly
    ? "SELECT slug,name,status,content_json FROM catalog_entities WHERE kind=? AND status='active' ORDER BY sort_order,slug"
    : "SELECT slug,name,status,content_json FROM catalog_entities WHERE kind=? ORDER BY sort_order,slug";
  const rows = await db.prepare(sql).bind(kind).all<EntityRow>();
  return (rows.results || []).map(r => ({
    ...(JSON.parse(r.content_json) as Record<string, unknown>),
    slug: r.slug, name: r.name, status: r.status
  } as CatalogRecord));
}
export async function findCatalog(db: D1Database, kind: CatalogKind, slug: string): Promise<CatalogRecord | null> {
  if (!/^[a-z0-9][a-z0-9_-]{0,159}$/i.test(slug)) return null;
  const row = await db.prepare(
    "SELECT slug,name,status,content_json FROM catalog_entities WHERE kind=? AND slug=? LIMIT 1"
  ).bind(kind,slug).first<EntityRow>();
  return row ? { ...(JSON.parse(row.content_json) as Record<string, unknown>), slug: row.slug, name: row.name, status: row.status } as CatalogRecord : null;
}
export async function loadDocument<T>(db: D1Database, key: "site_settings" | "camp_memories" | "faq"): Promise<T | null> {
  const row = await db.prepare("SELECT content_json FROM site_documents WHERE key=?").bind(key).first<{content_json:string}>();
  return row ? JSON.parse(row.content_json) as T : null;
}
