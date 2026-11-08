import type { InquiryRecord } from "../../lib/domain";
import { readPage } from "../../lib/pagination.server";
import { INQUIRY_KINDS, INQUIRY_STATUSES } from "./inquiries.shared";

export const INQUIRY_PAGE_SIZE = 20;

export type InquiryFilters = {
  q: string;
  status: string;
  kind: string;
};

export async function loadInquiryPage(db: D1Database, url: URL) {
  const statusParam = url.searchParams.get("status") || "";
  const kindParam = url.searchParams.get("kind") || "";
  const filters: InquiryFilters = {
    q: (url.searchParams.get("q") || "").trim().slice(0, 120),
    status: INQUIRY_STATUSES.includes(statusParam as (typeof INQUIRY_STATUSES)[number])
      ? statusParam
      : "",
    kind: INQUIRY_KINDS.includes(kindParam as (typeof INQUIRY_KINDS)[number]) ? kindParam : ""
  };
  const clauses: string[] = [];
  const values: string[] = [];

  if (filters.q) {
    const escaped = filters.q.replace(/[!%_]/g, (character) => `!${character}`);
    const pattern = `%${escaped}%`;
    clauses.push(
      "(LOWER(name) LIKE LOWER(?) ESCAPE '!' OR LOWER(email) LIKE LOWER(?) ESCAPE '!' OR LOWER(phone) LIKE LOWER(?) ESCAPE '!' OR LOWER(id) LIKE LOWER(?) ESCAPE '!')"
    );
    values.push(pattern, pattern, pattern, pattern);
  }
  if (filters.status) {
    clauses.push("status=?");
    values.push(filters.status);
  }
  if (filters.kind) {
    clauses.push("kind=?");
    values.push(filters.kind);
  }

  const where = clauses.length ? ` WHERE ${clauses.join(" AND ")}` : "";
  const countRow = await db
    .prepare(`SELECT COUNT(*) AS count FROM inquiries${where}`)
    .bind(...values)
    .first<{ count: number }>();
  const total = countRow?.count || 0;
  const totalPages = Math.max(1, Math.ceil(total / INQUIRY_PAGE_SIZE));
  const page = Math.min(readPage(url), totalPages);
  const result = await db
    .prepare(
      `SELECT id,kind,name,email,phone,status,content_json,created_at
       FROM inquiries${where}
       ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`
    )
    .bind(...values, INQUIRY_PAGE_SIZE, (page - 1) * INQUIRY_PAGE_SIZE)
    .all<InquiryRecord>();

  return {
    rows: result.results || [],
    total,
    page,
    totalPages,
    filters
  };
}
