import { Form, redirect } from "react-router";
import type { Route } from "./+types/admin-seo-publish";
import { getCloudflare } from "../lib/cloudflare-context";
import { requireAdmin, verifyAdminPost } from "../lib/admin.server";
import { editorialPublishedAt, publishEditorialDocuments } from "../lib/editorial-publish.server";
import { AdminShell } from "../components/admin/AdminShell";

export function meta() {
  return [
    { title: "Publish SEO Content | GoCamp" },
    { name: "robots", content: "noindex,nofollow" }
  ];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const env = getCloudflare(context).env;
  const session = await requireAdmin(request, env.DB);
  return {
    session,
    publishedAt: await editorialPublishedAt(env),
    justPublished: new URL(request.url).searchParams.has("published")
  };
}

export async function action({ request, context }: Route.ActionArgs) {
  const env = getCloudflare(context).env;
  const form = await request.formData();
  await verifyAdminPost(request, env.DB, form);
  // This editor-controlled publication workflow is staged before production adoption.
  if (env.GOCAMP_ENV !== "staging") {
    throw new Response("Staging only", { status: 403 });
  }
  await publishEditorialDocuments(env);
  return redirect("/admin/seo-publish?published=1");
}

export default function EditorialPublish({ loaderData }: Route.ComponentProps) {
  const { session, publishedAt, justPublished } = loaderData;
  return (
    <AdminShell username={session.username} csrf={session.csrf}>
      <div className="card">
        <div className="card-body">
          <h1 className="h3">Publish editorial SEO content</h1>
          <p className="text-secondary">
            About, Contact, FAQ and shared site copy use a durable published snapshot in the staging
            R2 bucket. Saving drafts in the CMS does not update those public pages until you publish
            them here.
          </p>
          {justPublished && (
            <div className="alert alert-success" role="status">
              Editorial content published successfully.
            </div>
          )}
          <p>
            <strong>Current publication:</strong>{" "}
            {publishedAt || "Not initialized: current D1 content is still visible."}
          </p>
          <Form method="post">
            <input type="hidden" name="csrf" value={session.csrf} />
            <button type="submit" className="btn btn-primary">
              Publish / refresh editorial content
            </button>
          </Form>
          <p className="small text-secondary mt-3">
            Program, destination and category statuses remain dynamic. Unpublished catalog records
            return HTTP 404 immediately, independently of this snapshot.
          </p>
        </div>
      </div>
    </AdminShell>
  );
}
