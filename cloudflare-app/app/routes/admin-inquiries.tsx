import { Form, redirect, useNavigation } from "react-router";
import { useMemo, useState } from "react";
import type { Route } from "./+types/admin-inquiries";
import { requireAdmin, verifyAdminPost } from "../lib/admin.server";
import { AdminShell } from "../components/admin/AdminShell";
import { AdminPageHeader } from "../components/admin/AdminPageHeader";
import { StatusBadge } from "../components/admin/StatusBadge";
import { Pagination } from "../components/ui/Pagination";
import type { InquiryRecord } from "../lib/domain";

const PAGE_SIZE = 20;
const STATUSES = ["new", "read", "replied", "archived"] as const;
const KINDS = ["contact", "lead", "newsletter"] as const;

export function meta() {
  return [{ title: "GoCamp Inquiries" }, { name: "robots", content: "noindex,nofollow" }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const db = context.cloudflare.env.DB;
  const session = await requireAdmin(request, db);
  const url = new URL(request.url);
  const totalRow = await db
    .prepare("SELECT COUNT(*) AS count FROM inquiries")
    .first<{ count: number }>();
  const total = totalRow?.count || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number(url.searchParams.get("page") || 1) || 1), totalPages);
  const rows = await db
    .prepare(
      `SELECT id,kind,name,email,phone,status,content_json,created_at
     FROM inquiries
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`
    )
    .bind(PAGE_SIZE, (page - 1) * PAGE_SIZE)
    .all<InquiryRecord>();
  return {
    session,
    rows: rows.results,
    total,
    page,
    totalPages,
    updated: url.searchParams.has("updated"),
    deleted: url.searchParams.has("deleted")
  };
}

export async function action({ request, context }: Route.ActionArgs) {
  const db = context.cloudflare.env.DB;
  const form = await request.formData();
  await verifyAdminPost(request, db, form);
  const id = String(form.get("id") || "");
  const status = String(form.get("status") || "");
  const operation = String(form.get("operation") || "");
  if (!/^[a-f0-9-]{36}$/i.test(id)) {
    throw new Response("Invalid request", { status: 400 });
  }
  if (operation === "delete") {
    const removed = await db.prepare("DELETE FROM inquiries WHERE id=?").bind(id).run();
    if (removed.meta.changes !== 1) {
      throw new Response("Inquiry not found", { status: 404 });
    }
    return redirect("/admin/inquiries?deleted=1");
  }
  if (!STATUSES.includes(status as (typeof STATUSES)[number])) {
    throw new Response("Invalid request", { status: 400 });
  }
  const result = await db
    .prepare("UPDATE inquiries SET status=?,updated_at=unixepoch() WHERE id=?")
    .bind(status, id)
    .run();
  if (result.meta.changes !== 1) {
    throw new Response("Inquiry not found", { status: 404 });
  }
  return redirect("/admin/inquiries?updated=1");
}

function InquiryDetails({ row }: { row: InquiryRecord }) {
  const content = JSON.parse(row.content_json) as Record<string, unknown>;
  const phone = row.phone.replace(/[^\d]/g, "");
  return (
    <details>
      <summary className="btn btn-sm btn-outline-secondary">View details</summary>
      <div className="mt-2 border rounded p-2 inquiry-details">
        {Object.entries(content).map(([key, value]) => (
          <div key={key} className="small border-bottom py-1">
            <strong className="text-capitalize">{key.replaceAll("_", " ")}:</strong>{" "}
            <span className="text-break">
              {typeof value === "object" ? JSON.stringify(value) : String(value ?? "")}
            </span>
          </div>
        ))}
        <div className="d-flex flex-wrap gap-1 mt-2">
          <a className="btn btn-sm btn-outline-primary" href={`mailto:${row.email}`}>
            Email parent
          </a>
          {phone.length >= 8 && (
            <a
              className="btn btn-sm btn-outline-success"
              href={`https://wa.me/${phone}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp
            </a>
          )}
        </div>
      </div>
    </details>
  );
}

export default function Inquiries({ loaderData }: Route.ComponentProps) {
  const { session, rows, total, page, totalPages, updated, deleted } = loaderData;
  const navigation = useNavigation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [kindFilter, setKindFilter] = useState("");

  const visible = useMemo(
    () =>
      rows.filter((row) => {
        const query = search.toLowerCase();
        const matchesSearch =
          !query || `${row.name} ${row.email} ${row.phone} ${row.id}`.toLowerCase().includes(query);
        return (
          matchesSearch &&
          (!statusFilter || row.status === statusFilter) &&
          (!kindFilter || row.kind === kindFilter)
        );
      }),
    [rows, search, statusFilter, kindFilter]
  );

  return (
    <AdminShell username={session.username} csrf={session.csrf}>
      <AdminPageHeader
        title="Inquiries & Leads"
        description="Review contact, landing and newsletter submissions."
      />
      {updated && (
        <p role="status" className="alert alert-success">
          Inquiry updated.
        </p>
      )}
      {deleted && (
        <p role="status" className="alert alert-success">
          Inquiry deleted.
        </p>
      )}

      <div className="row g-2 align-items-end mb-3">
        <div className="col-md-6">
          <label className="form-label small fw-semibold" htmlFor="inquiry-search">
            Search by name, email or phone
          </label>
          <input
            id="inquiry-search"
            className="form-control"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="col-6 col-md-3">
          <label className="form-label small fw-semibold" htmlFor="inquiry-status">
            Status
          </label>
          <select
            id="inquiry-status"
            className="form-select"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="">All statuses</option>
            {STATUSES.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </div>
        <div className="col-6 col-md-3">
          <label className="form-label small fw-semibold" htmlFor="inquiry-type">
            Type
          </label>
          <select
            id="inquiry-type"
            className="form-select"
            value={kindFilter}
            onChange={(event) => setKindFilter(event.target.value)}
          >
            <option value="">All types</option>
            {KINDS.map((kind) => (
              <option key={kind}>{kind}</option>
            ))}
          </select>
        </div>
      </div>
      <p className="small text-secondary">
        {visible.length} of {total} inquiries
      </p>

      <div className="table-responsive card shadow-sm">
        <table className="table mb-0">
          <thead>
            <tr>
              <th>Received</th>
              <th>Type</th>
              <th>Contact</th>
              <th>Details</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.id}>
                <td>{new Date(row.created_at * 1000).toLocaleString()}</td>
                <td>{row.kind}</td>
                <td>
                  <strong>{row.name}</strong>
                  <div>
                    <a href={`mailto:${row.email}`}>{row.email}</a>
                  </div>
                  <div>{row.phone}</div>
                </td>
                <td>
                  <InquiryDetails row={row} />
                </td>
                <td>
                  <Form method="post" className="d-flex flex-wrap gap-2">
                    <input type="hidden" name="csrf" value={session.csrf} />
                    <input type="hidden" name="id" value={row.id} />
                    <select
                      name="status"
                      defaultValue={row.status}
                      className="form-select form-select-sm inquiry-status-select"
                      aria-label={`Status for ${row.name}`}
                    >
                      {STATUSES.map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                    <button
                      disabled={navigation.state !== "idle"}
                      className="btn btn-outline-primary btn-sm"
                    >
                      Save
                    </button>
                    <button
                      disabled={navigation.state !== "idle"}
                      className="btn btn-outline-danger btn-sm"
                      name="operation"
                      value="delete"
                      onClick={(event) => {
                        if (!window.confirm("Delete this inquiry permanently?")) {
                          event.preventDefault();
                        }
                      }}
                    >
                      Delete
                    </button>
                  </Form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {visible.length === 0 && <p className="p-3 mb-0">No matching inquiries.</p>}
      </div>
      <Pagination
        page={page}
        totalPages={totalPages}
        ariaLabel="Inquiry pages"
        href={(target) => `?page=${target}`}
      />
    </AdminShell>
  );
}
