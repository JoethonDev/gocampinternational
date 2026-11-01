import sourceMedia from "../../legacy-media.json";
import type { MediaAsset } from "../../lib/domain";

export type StaticMedia = { path: string; folder: string; bytes: number };
export type MediaUsage = { count: number; refs: string[] };
export type MediaLibraryData = Awaited<ReturnType<typeof loadMediaLibrary>>;

const PAGE_SIZE = 24;
const ALL_STATIC = sourceMedia as StaticMedia[];

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function loadUsage(
  db: D1Database,
  items: StaticMedia[]
): Promise<Record<string, MediaUsage>> {
  if (items.length === 0) return {};
  const [catalog, documents, registered] = await Promise.all([
    db
      .prepare("SELECT kind,slug,content_json FROM catalog_entities")
      .all<{ kind: string; slug: string; content_json: string }>(),
    db
      .prepare("SELECT key,content_json FROM site_documents")
      .all<{ key: string; content_json: string }>(),
    db
      .prepare(
        "SELECT legacy_path,id FROM media_assets WHERE legacy_path IN (" +
          items.map(() => "?").join(",") +
          ")"
      )
      .bind(...items.map((item) => item.path))
      .all<{ legacy_path: string; id: string }>()
  ]);
  const usage: Record<string, MediaUsage> = {};
  const ids = new Map((registered.results || []).map((row) => [row.legacy_path, row.id]));
  for (const item of items) {
    const patterns = [item.path, ids.has(item.path) ? `/media/${ids.get(item.path)}` : null]
      .filter((path): path is string => Boolean(path))
      .map((path) => new RegExp(`${escapeRegExp(path)}(?![a-zA-Z0-9_.-])`, "g"));
    const refs: string[] = [];
    let count = 0;
    for (const row of catalog.results || []) {
      const countForRow = patterns.reduce(
        (total, pattern) => total + (row.content_json.match(pattern)?.length || 0),
        0
      );
      if (countForRow) {
        count += countForRow;
        refs.push(`catalog:${row.kind}/${row.slug}`);
      }
    }
    for (const row of documents.results || []) {
      const countForRow = patterns.reduce(
        (total, pattern) => total + (row.content_json.match(pattern)?.length || 0),
        0
      );
      if (countForRow) {
        count += countForRow;
        refs.push(`document:${row.key}`);
      }
    }
    usage[item.path] = { count, refs };
  }
  return usage;
}

export async function loadMediaLibrary(db: D1Database, url: URL) {
  const query = (url.searchParams.get("q") || "").trim();
  const requestedFolder = url.searchParams.get("folder") || "all";
  const folder = ["all", "images", "uploads"].includes(requestedFolder) ? requestedFolder : "all";
  const filtered = ALL_STATIC.filter(
    (item) =>
      (folder === "all" || item.folder === folder) &&
      (!query || item.path.toLowerCase().includes(query.toLowerCase()))
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number(url.searchParams.get("page") || 1) || 1), totalPages);
  const items = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const [usage, mediaRows] = await Promise.all([
    loadUsage(db, items),
    db
      .prepare(
        `SELECT id,display_name,mime_type,bytes,is_public,created_at
       FROM media_assets
       WHERE legacy_path IS NULL
       ORDER BY created_at DESC
       LIMIT 300`
      )
      .all<MediaAsset>()
  ]);
  return {
    rows: mediaRows.results,
    items,
    usage,
    total: filtered.length,
    totalStatic: ALL_STATIC.length,
    page,
    totalPages,
    q: query,
    folder
  };
}

export const MEDIA_PAGE_SIZE = PAGE_SIZE;
