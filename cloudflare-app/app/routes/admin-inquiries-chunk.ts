import type { Route } from "./+types/admin-inquiries-chunk";
import { requireAdmin } from "../lib/admin.server";
import type { InquiryRecord } from "../lib/domain";
import { readPage } from "../lib/pagination.server";

const PAGE_SIZE = 20;

export async function loader({ request, context }: Route.LoaderArgs) {
  const db = context.cloudflare.env.DB;
  await requireAdmin(request, db);
  const requestedPage = readPage(new URL(request.url));
  const total =
    (await db.prepare("SELECT COUNT(*) AS count FROM inquiries").first<{ count: number }>())
      ?.count || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  const result = await db
    .prepare(
      `SELECT id,kind,name,email,phone,status,content_json,created_at
       FROM inquiries ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`
    )
    .bind(PAGE_SIZE, (page - 1) * PAGE_SIZE)
    .all<InquiryRecord>();
  return Response.json(
    { rows: result.results || [], page, total, totalPages },
    {
      headers: { "Cache-Control": "private, no-store" }
    }
  );
}
