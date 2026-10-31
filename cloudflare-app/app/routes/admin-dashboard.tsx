import type { Route } from "./+types/admin-dashboard";
import { requireAdmin } from "../lib/admin.server";
import { AdminShell } from "../components/admin/AdminShell";
import { DashboardPage } from "../features/admin/dashboard/DashboardPage";
import { loadDashboard } from "../features/admin/dashboard/dashboard.server";

export function meta() {
  return [{ title: "GoCamp Admin Dashboard" }, { name: "robots", content: "noindex,nofollow" }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const db = context.cloudflare.env.DB;
  const session = await requireAdmin(request, db);
  const data = await loadDashboard(db, context.cloudflare.env);
  return { session, ...data };
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const { session, ...data } = loaderData;
  return (
    <AdminShell username={session.username} csrf={session.csrf}>
      <DashboardPage session={session} {...data} />
    </AdminShell>
  );
}
