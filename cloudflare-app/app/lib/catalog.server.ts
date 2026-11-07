import type {
  CatalogKind,
  CatalogRecord,
  CategoryRecord,
  DestinationRecord,
  ProgramRecord
} from "./domain";
import type { DocumentKey } from "./documents";

export type { CatalogKind, CatalogRecord, CategoryRecord, DestinationRecord, ProgramRecord };

type EntityRow = { slug: string; name: string; status: string; content_json: string };

const parseRow = <T extends CatalogRecord>(row: EntityRow): T =>
  ({
    ...(JSON.parse(row.content_json) as Record<string, unknown>),
    slug: row.slug,
    name: row.name,
    status: row.status
  }) as T;

export async function listCatalog<T extends CatalogRecord = CatalogRecord>(
  db: D1Database,
  kind: CatalogKind,
  activeOnly = true
): Promise<T[]> {
  const sql = activeOnly
    ? "SELECT slug,name,status,content_json FROM catalog_entities WHERE kind=? AND status='active' ORDER BY sort_order,slug"
    : "SELECT slug,name,status,content_json FROM catalog_entities WHERE kind=? ORDER BY sort_order,slug";
  const rows = await db.prepare(sql).bind(kind).all<EntityRow>();
  return (rows.results || []).map((row) => parseRow<T>(row));
}

export const listPrograms = (db: D1Database, activeOnly = true) =>
  listCatalog<ProgramRecord>(db, "program", activeOnly);

export const listDestinations = (db: D1Database, activeOnly = true) =>
  listCatalog<DestinationRecord>(db, "destination", activeOnly);

export const listCategories = (db: D1Database, activeOnly = true) =>
  listCatalog<CategoryRecord>(db, "category", activeOnly);

export async function findCatalog<T extends CatalogRecord = CatalogRecord>(
  db: D1Database,
  kind: CatalogKind,
  slug: string
): Promise<T | null> {
  if (!/^[a-z0-9][a-z0-9_-]{0,159}$/i.test(slug)) return null;
  const row = await db
    .prepare(
      "SELECT slug,name,status,content_json FROM catalog_entities WHERE kind=? AND slug=? LIMIT 1"
    )
    .bind(kind, slug)
    .first<EntityRow>();
  return row ? parseRow<T>(row) : null;
}

export const findDestination = (db: D1Database, slug: string) =>
  findCatalog<DestinationRecord>(db, "destination", slug);

export type PublicDestination =
  | (Omit<DestinationRecord, "status"> & { status: "active" })
  | (Pick<DestinationRecord, "slug" | "name"> & { status: "coming-soon" });

/** Return only fields intended for public destination routes. */
export function publicDestination(destination: DestinationRecord | null): PublicDestination | null {
  if (!destination) return null;
  if (destination.status === "active") return { ...destination, status: "active" };
  if (destination.status === "coming-soon") {
    return { slug: destination.slug, name: destination.name, status: "coming-soon" };
  }
  return null;
}

export const findCategory = (db: D1Database, slug: string) =>
  findCatalog<CategoryRecord>(db, "category", slug);

export async function loadDocument<T>(db: D1Database, key: DocumentKey): Promise<T | null> {
  const row = await db
    .prepare("SELECT content_json FROM site_documents WHERE key=?")
    .bind(key)
    .first<{ content_json: string }>();
  return row ? (JSON.parse(row.content_json) as T) : null;
}
