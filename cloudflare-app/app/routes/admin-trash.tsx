import { Form, Link, redirect, useNavigation } from "react-router";
import type { Route } from "./+types/admin-trash";
import { requireAdmin, verifyAdminPost } from "../lib/admin.server";
import { AdminShell } from "../components/admin/AdminShell";
import { AdminPageHeader } from "../components/admin/AdminPageHeader";

type TrashRow = {
  kind: "program" | "destination" | "category";
  slug: string;
  name: string;
  content_json: string;
  revision: number;
};

const KINDS = ["program", "destination", "category"] as const;

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
    !KINDS.includes(kind as (typeof KINDS)[number]) ||
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
  return (
    <AdminShell username={session.username} csrf={session.csrf}>
      <AdminPageHeader
        title="Trash"
        description="Trashed content is hidden from public pages. Restore as inactive to review before publishing, or explicitly restore active."
        aside={<Link to="/admin">Back to dashboard</Link>}
      />
      {saved && (
        <div className="alert alert-success" role="status">
          Trash updated.
        </div>
      )}
      <div className="row g-3">
        {KINDS.map((kind) => {
          const items = rows.filter((item) => item.kind === kind);
          return (
            <section key={kind} className="col-lg-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <h2 className="h5 text-capitalize">{kind}s</h2>
                  {items.map((item) => (
                    <div className="border rounded-3 p-3 my-2" key={item.slug}>
                      <strong>{item.name}</strong>
                      <div className="small text-secondary mb-3">{item.slug}</div>
                      <Form method="post" className="d-flex flex-wrap gap-2">
                        <input type="hidden" name="csrf" value={session.csrf} />
                        <input type="hidden" name="kind" value={kind} />
                        <input type="hidden" name="slug" value={item.slug} />
                        <input type="hidden" name="revision" value={item.revision} />
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
                            if (
                              !window.confirm(
                                "Permanently delete this item? This cannot be undone."
                              )
                            ) {
                              event.preventDefault();
                            }
                          }}
                        >
                          Delete forever
                        </button>
                      </Form>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <p className="text-secondary small">No trashed {kind}s.</p>
                  )}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </AdminShell>
  );
}
