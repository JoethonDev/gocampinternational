import { useState } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/admin-media-import";
import legacy from "../legacy-media.json";
import { requireAdmin, verifyAdminPost } from "../lib/admin.server";
import { AdminShell } from "../components/admin/AdminShell";

const BATCH_SIZE = 8;
type LegacyImage = { path: string; bytes: number; folder: string };
const images = (legacy as LegacyImage[]).filter((item) => item.path.startsWith("/images/"));
const formats: Record<string, string> = {
  webp: "image/webp",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  avif: "image/avif",
  svg: "image/svg+xml",
  ico: "image/x-icon"
};

function requireStaging(env: Env) {
  if (env.GOCAMP_ENV !== "staging") throw new Response("Not found", { status: 404 });
}

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
    total: images.length,
    totalBytes: images.reduce((sum, item) => sum + item.bytes, 0)
  };
}

async function importImage(item: LegacyImage, request: Request, env: Env) {
  const key = item.path.slice(1);
  const ext = key.split(".").at(-1)?.toLowerCase() || "";
  const mime = formats[ext];
  if (!mime) throw new Error("Unsupported extension");
  const assetResponse = await env.ASSETS.fetch(
    new Request(new URL(item.path, request.url), { method: "GET" })
  );
  if (!assetResponse.ok) throw new Error("Source asset returned HTTP " + assetResponse.status);
  const buffer = await assetResponse.arrayBuffer();
  if (buffer.byteLength !== item.bytes)
    throw new Error("Source length differs from repository inventory");
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", buffer)))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  const stored = await env.MEDIA.head(key);
  if (stored) {
    if (stored.size !== buffer.byteLength || stored.customMetadata?.sha256 !== hash) {
      throw new Error("Existing R2 object differs from source; refusing to overwrite");
    }
    return "already-present" as const;
  }
  await env.MEDIA.put(key, buffer, {
    httpMetadata: { contentType: mime, cacheControl: "public, max-age=86400" },
    customMetadata: { sha256: hash }
  });
  const verified = await env.MEDIA.head(key);
  if (
    !verified ||
    verified.size !== buffer.byteLength ||
    verified.customMetadata?.sha256 !== hash
  ) {
    throw new Error("R2 verification failed");
  }
  return "uploaded" as const;
}

export async function action({ request, context }: Route.ActionArgs) {
  const env = context.cloudflare.env;
  requireStaging(env);
  if (request.method !== "POST") throw new Response("Method not allowed", { status: 405 });
  const form = await request.formData();
  await verifyAdminPost(request, env.DB, form);
  const raw = String(form.get("cursor") ?? "");
  const cursor = Number(raw);
  if (!/^\d+$/.test(raw) || !Number.isSafeInteger(cursor) || cursor > images.length) {
    throw new Response("Invalid cursor", { status: 400 });
  }
  const batch = images.slice(cursor, cursor + BATCH_SIZE);
  const results = await Promise.allSettled(batch.map((item) => importImage(item, request, env)));
  const failures = results.flatMap((result, index) =>
    result.status === "rejected"
      ? [
          {
            path: batch[index].path,
            reason: result.reason instanceof Error ? result.reason.message : "Import failed"
          }
        ]
      : []
  );
  return Response.json(
    {
      uploaded: results.filter(
        (result) => result.status === "fulfilled" && result.value === "uploaded"
      ).length,
      existing: results.filter(
        (result) => result.status === "fulfilled" && result.value === "already-present"
      ).length,
      failures,
      nextCursor: failures.length ? cursor : Math.min(images.length, cursor + BATCH_SIZE),
      total: images.length
    },
    { headers: { "Cache-Control": "no-store" } }
  );
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
        const response = await fetch("/admin/media/import", {
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
      <div className="mb-4">
        <Link to="/admin/media" className="btn btn-sm btn-outline-secondary mb-3">
          Back to Media Library
        </Link>
        <h1 className="h2">Import legacy images to R2 — staging</h1>
        <p className="text-secondary">
          Copy {total} repository images ({(totalBytes / 1024 / 1024).toFixed(1)} MB) to the private
          staging R2 bucket, preserving the exact /images/... paths. Existing files are checked by
          SHA-256. Nothing is deleted or changed in production.
        </p>
      </div>
      <div className="card shadow-sm">
        <div className="card-body">
          <button
            type="button"
            className="btn btn-primary"
            onClick={startImport}
            disabled={running}
          >
            {running ? "Importing…" : finished ? "Verify again" : "Start / resume R2 import"}
          </button>
          <p className="mt-3 mb-1" role="status">
            {processed} / {total} verified · {uploaded} uploaded · {existing} already present
          </p>
          <progress
            value={processed}
            max={Math.max(total, 1)}
            className="w-100"
            aria-label="R2 migration progress"
          />
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
            Keep this page open while importing. The operation runs in small authenticated batches
            to stay within Worker request limits.
          </p>
        </div>
      </div>
    </AdminShell>
  );
}
