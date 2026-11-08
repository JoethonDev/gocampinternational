import { getCloudflare } from "../lib/cloudflare-context";
import { Form, Link, redirect, useNavigation } from "react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Route } from "./+types/admin-inquiries";
import { requireAdmin, verifyAdminPost } from "../lib/admin.server";
import { AdminShell } from "../components/admin/AdminShell";
import { AdminPageHeader } from "../components/admin/AdminPageHeader";
import { AdminLoadMore } from "../components/admin/AdminLoadMore";
import { AdminRowActions } from "../components/admin/AdminRowActions";
import { AdminTable, type AdminTableColumn } from "../components/admin/AdminTable";
import { AdminToolbar, AdminToolbarField } from "../components/admin/AdminToolbar";
import type { InquiryRecord } from "../lib/domain";
import { INQUIRY_KINDS, INQUIRY_STATUSES } from "../features/admin/inquiries.shared";
import { loadInquiryPage } from "../features/admin/inquiries.server";

export function meta() {
  return [{ title: "GoCamp Inquiries" }, { name: "robots", content: "noindex,nofollow" }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const db = getCloudflare(context).env.DB;
  const session = await requireAdmin(request, db);
  const url = new URL(request.url);
  const inquiryPage = await loadInquiryPage(db, url);
  return {
    session,
    ...inquiryPage,
    updated: url.searchParams.has("updated"),
    deleted: url.searchParams.has("deleted")
  };
}

function redirectAfterMutation(request: Request, returnTo: string, outcome: "updated" | "deleted") {
  let target: URL;
  try {
    target = new URL(returnTo || "/admin/inquiries", request.url);
  } catch {
    target = new URL("/admin/inquiries", request.url);
  }
  const current = new URL(request.url);
  if (target.origin !== current.origin || target.pathname !== "/admin/inquiries") {
    target = new URL("/admin/inquiries", current);
  }
  target.searchParams.delete("updated");
  target.searchParams.delete("deleted");
  target.searchParams.set(outcome, "1");
  return redirect(`${target.pathname}${target.search}`);
}

export async function action({ request, context }: Route.ActionArgs) {
  const db = getCloudflare(context).env.DB;
  const form = await request.formData();
  await verifyAdminPost(request, db, form);
  const id = String(form.get("id") || "");
  const status = String(form.get("status") || "");
  const operation = String(form.get("operation") || "");
  const returnTo = String(form.get("returnTo") || "");
  if (!/^[a-f0-9-]{36}$/i.test(id)) {
    throw new Response("Invalid request", { status: 400 });
  }
  if (operation === "delete") {
    const removed = await db.prepare("DELETE FROM inquiries WHERE id=?").bind(id).run();
    if (removed.meta.changes !== 1) {
      throw new Response("Inquiry not found", { status: 404 });
    }
    return redirectAfterMutation(request, returnTo, "deleted");
  }
  if (!INQUIRY_STATUSES.includes(status as (typeof INQUIRY_STATUSES)[number])) {
    throw new Response("Invalid request", { status: 400 });
  }
  const result = await db
    .prepare("UPDATE inquiries SET status=?,updated_at=unixepoch() WHERE id=?")
    .bind(status, id)
    .run();
  if (result.meta.changes !== 1) {
    throw new Response("Inquiry not found", { status: 404 });
  }
  return redirectAfterMutation(request, returnTo, "updated");
}

function InquiryDetails({ row }: { row: InquiryRecord }) {
  let content: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(row.content_json) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      content = parsed as Record<string, unknown>;
    }
  } catch {
    // Keep the rest of the inquiry usable if an older row has malformed details.
  }
  const phone = row.phone.replace(/[^\d]/g, "");
  const entries = Object.entries(content);
  return (
    <details>
      <summary className="btn btn-sm btn-outline-secondary">View details</summary>
      <div className="mt-2 border rounded p-2 inquiry-details">
        {entries.length ? (
          entries.map(([key, value]) => (
            <div key={key} className="small border-bottom py-1">
              <strong className="text-capitalize">{key.replaceAll("_", " ")}:</strong>{" "}
              <span className="text-break">
                {typeof value === "object" ? JSON.stringify(value) : String(value ?? "")}
              </span>
            </div>
          ))
        ) : (
          <p className="small text-secondary mb-0">No additional details are available.</p>
        )}
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
  const { session, rows, total, page, totalPages, filters, updated, deleted } = loaderData;
  const navigation = useNavigation();
  const [allRows, setAllRows] = useState(rows || []);
  const [loadedPage, setLoadedPage] = useState(page);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const loadingRef = useRef(false);
  const loadRequest = useRef<AbortController | null>(null);
  const filterKey = `${filters.q}\u0000${filters.status}\u0000${filters.kind}`;
  const activeFilterKey = useRef(filterKey);

  useEffect(() => {
    loadRequest.current?.abort();
    loadRequest.current = null;
    loadingRef.current = false;
    activeFilterKey.current = filterKey;
    setAllRows(rows || []);
    setLoadedPage(page);
    setLoading(false);
    setLoadError("");
  }, [rows, page, filterKey]);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || loadedPage >= totalPages) return;
    loadingRef.current = true;
    setLoading(true);
    setLoadError("");
    const requestFilterKey = filterKey;
    const controller = new AbortController();
    loadRequest.current = controller;
    try {
      const params = new URLSearchParams({ page: String(loadedPage + 1) });
      if (filters.q) params.set("q", filters.q);
      if (filters.status) params.set("status", filters.status);
      if (filters.kind) params.set("kind", filters.kind);
      const response = await fetch(`/admin/inquiries/chunk?${params}`, {
        method: "GET",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const chunk = (await response.json()) as { rows: InquiryRecord[]; page: number };
      if (chunk.page !== loadedPage + 1) throw new Error("Unexpected inquiry cursor");
      if (controller.signal.aborted || activeFilterKey.current !== requestFilterKey) return;
      setAllRows((previous) => {
        const ids = new Set(previous.map((item) => item.id));
        return [...previous, ...chunk.rows.filter((item) => !ids.has(item.id))];
      });
      setLoadedPage(chunk.page);
    } catch (error) {
      if (!controller.signal.aborted) {
        setLoadError("Could not load more inquiries. Check your connection and retry.");
      }
    } finally {
      if (loadRequest.current === controller) {
        loadRequest.current = null;
        loadingRef.current = false;
        setLoading(false);
      }
    }
  }, [loadedPage, totalPages, filters, filterKey]);
  useEffect(
    () => () => {
      loadRequest.current?.abort();
      loadRequest.current = null;
    },
    []
  );
  const returnParams = new URLSearchParams();
  if (filters.q) returnParams.set("q", filters.q);
  if (filters.status) returnParams.set("status", filters.status);
  if (filters.kind) returnParams.set("kind", filters.kind);
  const returnQuery = returnParams.toString();
  const returnTo = returnQuery ? `/admin/inquiries?${returnQuery}` : "/admin/inquiries";
  const hasFilters = Boolean(filters.q || filters.status || filters.kind);

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
          <input type="hidden" name="returnTo" value={returnTo} />
          <select
            name="status"
            defaultValue={row.status}
            className="form-select form-select-sm inquiry-status-select"
            aria-label={`Status for ${row.name}`}
          >
            {INQUIRY_STATUSES.map((status) => (
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
      <Form method="get" action="/admin/inquiries" role="search" className="admin-filter-form">
        <AdminToolbar
          actions={
            <div className="admin-toolbar-summary">
              <span className="admin-count-pill">
                <strong>{total}</strong>
                <span>{total === 1 ? "match" : "matches"}</span>
              </span>
              {hasFilters && (
                <Link to="/admin/inquiries" className="admin-filter-clear">
                  Clear
                </Link>
              )}
              <button className="btn btn-sm btn-primary" type="submit">
                Apply filters
              </button>
            </div>
          }
        >
          <AdminToolbarField label="Search" htmlFor="inquiry-search">
            <input
              id="inquiry-search"
              className="form-control"
              type="search"
              name="q"
              maxLength={120}
              placeholder="Name, email, phone or ID"
              defaultValue={filters.q}
            />
          </AdminToolbarField>
          <AdminToolbarField label="Status" htmlFor="inquiry-status">
            <select
              id="inquiry-status"
              className="form-select"
              name="status"
              defaultValue={filters.status}
            >
              <option value="">All statuses</option>
              {INQUIRY_STATUSES.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </AdminToolbarField>
          <AdminToolbarField label="Type" htmlFor="inquiry-type">
            <select
              id="inquiry-type"
              className="form-select"
              name="kind"
              defaultValue={filters.kind}
            >
              <option value="">All types</option>
              {INQUIRY_KINDS.map((kind) => (
                <option key={kind}>{kind}</option>
              ))}
            </select>
          </AdminToolbarField>
        </AdminToolbar>
      </Form>
      <AdminTable
        columns={columns}
        rows={allRows}
        rowKey={(row) => row.id}
        ariaLabel="Inquiries"
        emptyTitle="No matching inquiries"
        emptyDescription={
          hasFilters
            ? "Try changing the search, status or type filters."
            : "New contact, lead and newsletter submissions will appear here."
        }
      />
      <AdminLoadMore
        shown={allRows.length}
        total={total}
        itemLabel="inquiries"
        hasMore={loadedPage < totalPages}
        loading={loading}
        error={loadError}
        onLoadMore={() => void loadMore()}
      />
    </AdminShell>
  );
}
