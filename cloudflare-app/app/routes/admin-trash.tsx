import { Form, redirect, useNavigation } from "react-router";
import { useMemo, useState } from "react";
import type { Route } from "./+types/admin-trash";
import { requireAdmin, verifyAdminPost } from "../lib/admin.server";
import { AdminShell } from "../components/admin/AdminShell";
import { AdminPageHeader } from "../components/admin/AdminPageHeader";
import { AdminRowActions } from "../components/admin/AdminRowActions";
import { AdminTable, type AdminTableColumn } from "../components/admin/AdminTable";
import { AdminToolbar, AdminToolbarField } from "../components/admin/AdminToolbar";
import { StatusBadge } from "../components/admin/StatusBadge";
import { CATALOG_KIND_META } from "../config/catalog";

type TrashRow = {
  kind: "program" | "destination" | "category";
  slug: string;
  name: string;
  content_json: string;
  revision: number;
};

export function meta() {
  return [{ title: "GoCamp CMS Trash" }, { name: "robots", content: "noindex,nofollow" }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const db = context.cloudflare.env.DB;
  const session = await requireAdmin(request, db);
  const rows = await db
    .prepare(
      "SELECT kind,slug,name,content_json,revision FROM catalog_entities WHERE status='trash' ORDER BY kind,name"
    )
    .all<TrashRow>();
  return {
    session,
    rows: rows.results || [],
    saved: new URL(request.url).searchParams.has("saved")
  };
}

export async function action({ request, context }: Route.ActionArgs) {
  const db = context.cloudflare.env.DB;
  const form = await request.formData();
  await verifyAdminPost(request, db, form);
  const kind = String(form.get("kind") || "");
  const slug = String(form.get("slug") || "");
  const operation = String(form.get("operation") || "");
  if (
    !["program", "destination", "category"].includes(kind) ||
    !/^[a-z0-9][a-z0-9_-]{0,159}$/.test(slug)
  ) {
    throw new Response("Invalid trash item", { status: 400 });
  }
  if (!["restore-inactive", "restore-active", "delete"].includes(operation)) {
    throw new Response("Invalid operation", { status: 400 });
  }

  const row = await db
    .prepare("SELECT status,content_json,revision FROM catalog_entities WHERE kind=? AND slug=?")
    .bind(kind, slug)
    .first<{ status: string; content_json: string; revision: number }>();
  if (!row || row.status !== "trash") {
    throw new Response("Item is not in trash", { status: 409 });
  }
  if (Number(form.get("revision")) !== row.revision) {
    throw new Response("Item changed. Reload.", { status: 409 });
  }

  if (operation === "delete") {
    const jobs = [
      db
        .prepare(
          "DELETE FROM catalog_entities WHERE kind=? AND slug=? AND revision=? AND status='trash'"
        )
        .bind(kind, slug, row.revision)
    ];
    if (kind === "program") {
      jobs.push(db.prepare("DELETE FROM destination_programs WHERE program_slug=?").bind(slug));
    }
    if (kind === "destination") {
      jobs.push(db.prepare("DELETE FROM destination_programs WHERE destination_slug=?").bind(slug));
    }
    const result = await db.batch(jobs);
    if (result[0].meta.changes !== 1) {
      throw new Response("Concurrent change detected", { status: 409 });
    }
  } else {
    const status = operation === "restore-active" ? "active" : "inactive";
    const value = {
      ...(JSON.parse(row.content_json) as Record<string, unknown>),
      status
    };
    const result = await db
      .prepare(
        `UPDATE catalog_entities
         SET status=?,content_json=?,revision=revision+1,updated_at=unixepoch()
         WHERE kind=? AND slug=? AND revision=? AND status='trash'`
      )
      .bind(status, JSON.stringify(value), kind, slug, row.revision)
      .run();
    if (result.meta.changes !== 1) {
      throw new Response("Concurrent change detected", { status: 409 });
    }
  }
  return redirect("/admin/trash?saved=1");
}

export default function Trash({ loaderData }: Route.ComponentProps) {
  const { session, rows, saved } = loaderData;
  const navigation = useNavigation();
  const [search, setSearch] = useState("");
  const visible = useMemo(
    () =>
      rows.filter((row) =>
        `${row.name} ${row.slug} ${row.kind}`.toLowerCase().includes(search.toLowerCase())
      ),
    [rows, search]
  );

  const columns: AdminTableColumn<TrashRow>[] = [
    {
      key: "kind",
      label: "Type",
      render: (row) => {
        const meta = CATALOG_KIND_META[row.kind];
        return (
          <span className="admin-table-primary">
            <span className={`admin-table-icon admin-table-icon-${meta.accent}`}>
              <i className={`bi ${meta.icon}`} />
            </span>
            <span className="text-capitalize">{row.kind}</span>
          </span>
        );
      }
    },
    {
      key: "name",
      label: "Name",
      render: (row) => (
        <>
          <strong>{row.name}</strong>
          <div className="small text-secondary">
            <code>{row.slug}</code>
          </div>
        </>
      )
    },
    { key: "status", label: "Status", render: (row) => <StatusBadge status="trash" /> },
    {
      key: "actions",
      label: "Actions",
      className: "text-end",
      render: (row) => (
        <Form method="post" className="d-flex justify-content-end">
          <input type="hidden" name="csrf" value={session.csrf} />
          <input type="hidden" name="kind" value={row.kind} />
          <input type="hidden" name="slug" value={row.slug} />
          <input type="hidden" name="revision" value={row.revision} />
          <AdminRowActions>
            <button
              disabled={navigation.state !== "idle"}
              className="btn btn-sm btn-outline-success"
              name="operation"
              value="restore-inactive"
            >
              Restore draft
            </button>
            <button
              disabled={navigation.state !== "idle"}
              className="btn btn-sm btn-success"
              name="operation"
              value="restore-active"
            >
              Restore live
            </button>
            <button
              disabled={navigation.state !== "idle"}
              className="btn btn-sm btn-outline-danger"
              name="operation"
              value="delete"
              onClick={(event) => {
                if (!window.confirm("Permanently delete this item? This cannot be undone.")) {
                  event.preventDefault();
                }
              }}
            >
              Delete forever
            </button>
          </AdminRowActions>
        </Form>
      )
    }
  ];

  return (
    <AdminShell username={session.username} csrf={session.csrf}>
      <AdminPageHeader
        title="Trash"
        description="Trashed content is hidden from public pages. Restore as inactive before publishing."
        aside={<span className="admin-badge-soft">{rows.length} items</span>}
      />
      {saved && (
        <div className="alert alert-success" role="status">
          Trash updated.
        </div>
      )}
      <AdminToolbar>
        <AdminToolbarField label="Search" htmlFor="trash-search">
          <input
            id="trash-search"
            className="form-control"
            placeholder="Name, ID or type"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </AdminToolbarField>
      </AdminToolbar>
      <AdminTable
        columns={columns}
        rows={visible}
        rowKey={(row) => `${row.kind}-${row.slug}`}
        ariaLabel="Trashed content"
        emptyTitle={rows.length ? "No matching trash items" : "Trash is empty"}
        emptyDescription={
          rows.length
            ? "Try a different search term."
            : "Deleted catalog records will appear here for recovery."
        }
      />
    </AdminShell>
  );
}
