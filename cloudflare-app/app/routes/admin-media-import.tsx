import { useState } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/admin-media-import";
import { requireAdmin } from "../lib/admin.server";
import { LEGACY_IMAGES, requireStaging } from "../features/admin/media-import.server";
import { AdminShell } from "../components/admin/AdminShell";
import { AdminPageHeader } from "../components/admin/AdminPageHeader";
import { AdminPanel } from "../components/admin/AdminPanel";
import { AdminProgress } from "../components/admin/AdminProgress";

export function meta() {
  return [
    { title: "Staging R2 media import | GoCamp" },
    { name: "robots", content: "noindex,nofollow" }
  ];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const env = context.cloudflare.env;
  requireStaging(env);
  const session = await requireAdmin(request, env.DB);
  return {
    session,
    total: LEGACY_IMAGES.length,
    totalBytes: LEGACY_IMAGES.reduce((sum, item) => sum + item.bytes, 0)
  };
}

export default function AdminMediaImport({ loaderData }: Route.ComponentProps) {
  const { session, total, totalBytes } = loaderData;
  const [running, setRunning] = useState(false);
  const [processed, setProcessed] = useState(0);
  const [uploaded, setUploaded] = useState(0);
  const [existing, setExisting] = useState(0);
  const [failure, setFailure] = useState("");
  const [finished, setFinished] = useState(false);

  async function startImport() {
    if (running) return;
    setRunning(true);
    setFailure("");
    setFinished(false);
    setUploaded(0);
    setExisting(0);
    setProcessed(0);
    let cursor = 0;
    try {
      while (cursor < total) {
        const response = await fetch("/admin/media/import/run", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ csrf: session.csrf, cursor: String(cursor) })
        });
        if (!response.ok) throw new Error("Import request failed: HTTP " + response.status);
        const result = (await response.json()) as {
          uploaded: number;
          existing: number;
          nextCursor: number;
          failures: { path: string; reason: string }[];
        };
        if (result.failures.length) {
          throw new Error(result.failures.map((item) => item.path + ": " + item.reason).join("; "));
        }
        if (result.nextCursor <= cursor) throw new Error("Import did not advance");
        cursor = result.nextCursor;
        setProcessed(cursor);
        setUploaded((value) => value + result.uploaded);
        setExisting((value) => value + result.existing);
      }
      setFinished(true);
    } catch (error) {
      setFailure(error instanceof Error ? error.message : "Import failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <AdminShell username={session.username} csrf={session.csrf}>
      <AdminPageHeader
        title="Import legacy images to R2"
        description={`Copy ${total} repository images (${(totalBytes / 1024 / 1024).toFixed(1)} MB) to the private staging R2 bucket, preserving exact /images/... paths.`}
        aside={
          <Link to="/admin/media" className="btn btn-sm btn-outline-secondary">
            <i className="bi bi-arrow-left me-1" /> Back to Media Library
          </Link>
        }
      />
      <AdminPanel
        title="Staging import"
        description="Existing objects are checked by SHA-256. Nothing is deleted or changed in production."
      >
        <button type="button" className="btn btn-primary" onClick={startImport} disabled={running}>
          <i className="bi bi-cloud-arrow-up me-1" />
          {running ? "Importing…" : finished ? "Verify again" : "Start / resume R2 import"}
        </button>
        <p className="mt-3 mb-2" role="status">
          {processed} / {total} verified · {uploaded} uploaded · {existing} already present
        </p>
        <AdminProgress value={processed} max={Math.max(total, 1)} label="R2 migration progress" />
        {finished && (
          <div className="alert alert-success mt-3">
            All repository images are verified in staging R2. The static fallback remains enabled
            until cutover.
          </div>
        )}
        {failure && (
          <div role="alert" className="alert alert-danger mt-3">
            {failure} — safe to retry; verified objects are skipped.
          </div>
        )}
        <p className="text-secondary small mt-3 mb-0">
          Keep this page open while importing. The operation runs in small authenticated batches to
          stay within Worker request limits.
        </p>
      </AdminPanel>
    </AdminShell>
  );
}
