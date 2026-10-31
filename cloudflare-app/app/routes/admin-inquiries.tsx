import { Form, redirect, useNavigation } from "react-router";
import { useMemo, useState } from "react";
import type { Route } from "./+types/admin-inquiries";
import { requireAdmin, verifyAdminPost } from "../lib/admin.server";
import { AdminShell } from "../components/admin/AdminShell";
import { AdminPageHeader } from "../components/admin/AdminPageHeader";
import { AdminRowActions } from "../components/admin/AdminRowActions";
import { AdminTable, type AdminTableColumn } from "../components/admin/AdminTable";
import { AdminToolbar, AdminToolbarField } from "../components/admin/AdminToolbar";
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

  const columns: AdminTableColumn<InquiryRecord>[] = [
    {
      key: "received",
      label: "Received",
      render: (row) => (
        <span className="small text-secondary">
          {new Date(row.created_at * 1000).toLocaleString()}
        </span>
      )
    },
    {
      key: "type",
      label: "Type",
      render: (row) => <span className="admin-badge-soft text-capitalize">{row.kind}</span>
    },
    {
      key: "contact",
      label: "Contact",
      render: (row) => (
        <>
          <strong>{row.name || "Newsletter subscriber"}</strong>
          <div>
            <a href={`mailto:${row.email}`}>{row.email}</a>
          </div>
          {row.phone && <div className="small text-secondary">{row.phone}</div>}
        </>
      )
    },
    { key: "details", label: "Details", render: (row) => <InquiryDetails row={row} /> },
    {
      key: "status",
      label: "Status",
      className: "text-end",
      render: (row) => (
        <Form method="post" className="d-flex flex-wrap justify-content-end gap-2">
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
          <AdminRowActions>
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
          </AdminRowActions>
        </Form>
      )
    }
  ];

  return (
    <AdminShell username={session.username} csrf={session.csrf}>
      <AdminPageHeader
        title="Inquiries & Leads"
        description="Review contact, landing and newsletter submissions."
        aside={<span className="admin-badge-soft">{total} total</span>}
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
      <AdminToolbar>
        <AdminToolbarField label="Search" htmlFor="inquiry-search">
          <input
            id="inquiry-search"
            className="form-control"
            placeholder="Name, email or phone"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </AdminToolbarField>
        <AdminToolbarField label="Status" htmlFor="inquiry-status">
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
        </AdminToolbarField>
        <AdminToolbarField label="Type" htmlFor="inquiry-type">
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
        </AdminToolbarField>
      </AdminToolbar>
      <AdminTable
        columns={columns}
        rows={visible}
        rowKey={(row) => row.id}
        ariaLabel="Inquiries"
        emptyTitle="No matching inquiries"
        emptyDescription="Try a different search, status or type filter."
      />
      <Pagination
        page={page}
        totalPages={totalPages}
        ariaLabel="Inquiry pages"
        summary={`Page ${page} of ${totalPages} · ${total} inquiries`}
        href={(target) => `?page=${target}`}
      />
    </AdminShell>
  );
}
