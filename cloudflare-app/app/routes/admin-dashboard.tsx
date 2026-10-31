import { Link } from "react-router";
import type { Route } from "./+types/admin-dashboard";
import { requireAdmin } from "../lib/admin.server";
import { AdminShell } from "../components/admin/AdminShell";
import { AdminPageHeader } from "../components/admin/AdminPageHeader";

export function meta() {
  return [{ title: "GoCamp Admin Dashboard" }, { name: "robots", content: "noindex,nofollow" }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const db = context.cloudflare.env.DB;
  const session = await requireAdmin(request, db);
  const [catalog, inquiries] = await Promise.all([
    db
      .prepare(
        "SELECT kind,status,COUNT(*) AS count FROM catalog_entities GROUP BY kind,status ORDER BY kind,status"
      )
      .all<{ kind: string; status: string; count: number }>(),
    db
      .prepare(
        "SELECT kind,status,COUNT(*) AS count FROM inquiries GROUP BY kind,status ORDER BY kind,status"
      )
      .all<{ kind: string; status: string; count: number }>()
  ]);
  return { session, counts: catalog.results, forms: inquiries.results };
}

const KINDS = [
  ["program", "Programs"],
  ["destination", "Destinations"],
  ["category", "Categories"]
] as const;

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const { session, counts, forms } = loaderData;
  return (
    <AdminShell username={session.username} csrf={session.csrf}>
      <AdminPageHeader
        title="Dashboard"
        description="Overview of the staging content catalog and submitted inquiries."
      />
      <div className="row g-4">
        {KINDS.map(([kind, label]) => (
          <div className="col-md-4" key={kind}>
            <div className="card h-100 shadow-sm">
              <div className="card-body">
                <h2 className="h5">{label}</h2>
                <p className="text-secondary">
                  {counts
                    .filter((item) => item.kind === kind)
                    .map((item) => `${item.status}: ${item.count}`)
                    .join(" · ") || "No entries"}
                </p>
                <Link className="btn btn-primary btn-sm me-2" to={`/admin/catalog/${kind}`}>
                  Manage
                </Link>
                <Link className="btn btn-outline-primary btn-sm" to={`/admin/catalog/${kind}/new`}>
                  Create
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="card shadow-sm mt-4">
        <div className="card-body">
          <h2 className="h5">Inquiries and leads</h2>
          <p>
            {forms.map((item) => `${item.kind} ${item.status}: ${item.count}`).join(" · ") ||
              "No submissions yet"}
          </p>
          <Link to="/admin/inquiries">Manage inquiries</Link>
        </div>
      </div>
    </AdminShell>
  );
}
