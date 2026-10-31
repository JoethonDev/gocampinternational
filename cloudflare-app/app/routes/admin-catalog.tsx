import { redirect } from "react-router";
import type { Route } from "./+types/admin-catalog";
import { requireAdmin } from "../lib/admin.server";
import { changeBulkStatus, ensureKind } from "../lib/catalog-write.server";
import { listCategories, listDestinations, listPrograms } from "../lib/catalog.server";
import { AdminShell } from "../components/admin/AdminShell";
import { CatalogListPage } from "../features/admin/catalog/CatalogListPage";

export function meta() {
  return [{ title: "GoCamp Content Management" }, { name: "robots", content: "noindex,nofollow" }];
}

export async function loader({ request, context, params }: Route.LoaderArgs) {
  const db = context.cloudflare.env.DB;
  const session = await requireAdmin(request, db);
  const kind = ensureKind(params.kind || "");
  const [records, categories, destinations] = await Promise.all([
    kind === "program"
      ? listPrograms(db, false)
      : kind === "destination"
        ? listDestinations(db, false)
        : listCategories(db, false),
    kind === "program" ? listCategories(db, false) : Promise.resolve([]),
    kind === "program" ? listDestinations(db, false) : Promise.resolve([])
  ]);
  return {
    session,
    kind,
    records,
    categories,
    destinations,
    updated: new URL(request.url).searchParams.get("updated")
  };
}

export async function action({ request, context, params }: Route.ActionArgs) {
  const kind = ensureKind(params.kind || "");
  const updated = await changeBulkStatus(
    request,
    context.cloudflare.env.DB,
    kind,
    await request.formData()
  );
  return redirect(`/admin/catalog/${kind}?updated=${updated}`);
}

export default function Catalog({ loaderData }: Route.ComponentProps) {
  const { session, kind, records, categories, destinations, updated } = loaderData;
  return (
    <AdminShell username={session.username} csrf={session.csrf}>
      <CatalogListPage
        kind={kind}
        records={records}
        categories={categories}
        destinations={destinations}
        updated={updated}
        csrf={session.csrf}
      />
    </AdminShell>
  );
}
