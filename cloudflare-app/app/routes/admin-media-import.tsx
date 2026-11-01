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
    { title: "Staging R2 media verification | GoCamp" },
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
        title="Verify migrated R2 images"
        description={`Verify ${total} R2 image objects (${(totalBytes / 1024 / 1024).toFixed(1)} MB) against the D1 media registry, preserving /images/... and /uploads/... paths.`}
        aside={
          <Link to="/admin/media" className="btn btn-sm btn-outline-secondary">
            <i className="bi bi-arrow-left me-1" /> Back to Media Library
          </Link>
        }
      />
      <AdminPanel
        title="Staging verification"
        description="R2 object sizes and SHA-256 metadata must match the D1 registry. This check makes no changes."
      >
        <button type="button" className="btn btn-primary" onClick={startImport} disabled={running}>
          <i className="bi bi-cloud-arrow-up me-1" />
          {running ? "Verifying…" : finished ? "Verify again" : "Start / resume verification"}
        </button>
        <p className="mt-3 mb-2" role="status">
          {processed} / {total} verified · {uploaded} uploaded · {existing} already present
        </p>
        <AdminProgress value={processed} max={Math.max(total, 1)} label="R2 migration progress" />
        {finished && (
          <div className="alert alert-success mt-3">
            All legacy image objects are verified in staging R2 and D1. No GitHub static media fallback is required.
          </div>
        )}
        {failure && (
          <div role="alert" className="alert alert-danger mt-3">
            {failure} — safe to retry; verified objects are skipped.
          </div>
        )}
        <p className="text-secondary small mt-3 mb-0">
          Keep this page open during verification. Checks run in small authenticated batches.
        </p>
      </AdminPanel>
    </AdminShell>
  );
}
