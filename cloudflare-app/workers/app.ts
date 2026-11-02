import { backfillWebp } from "../app/lib/media-backfill.server";
import { createRequestHandler } from "react-router";
import { logEvent } from "../app/lib/logger.server";

declare module "react-router" {
  export interface AppLoadContext {
    cloudflare: { env: Env; ctx: ExecutionContext };
  }
}

const handle = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE
);

function applyResponseHeaders(response: Response, env: Env): Response {
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  if (env.GOCAMP_ENV === "staging") {
    headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

async function serveR2Image(request: Request, env: Env): Promise<Response> {
  const pathname = new URL(request.url).pathname;
  const key = pathname.slice(1);
  // Only read image files from the staging R2 bucket; never expose arbitrary object keys.
  if (
    !new RegExp(
      "^(?:images|uploads)/[a-zA-Z0-9_().%+-][a-zA-Z0-9_().%+/-]*[.](webp|png|jpe?g|avif|gif|svg|ico)$",
      "i"
    ).test(key) ||
    key.includes("..") ||
    key.includes("%2f") ||
    key.includes("%5c")
  ) {
    return new Response("Not found", { status: 404 });
  }
  let r2Key = key;
  if (/\.(png|gif|jpe?g)$/i.test(key)) {
    const registered = await env.DB.prepare(
      "SELECT object_key,mime_type FROM media_assets WHERE legacy_path=? AND is_public=1 LIMIT 1"
    ).bind("/" + key).first<{ object_key: string; mime_type: string }>();
    if (registered?.mime_type === "image/webp") r2Key = registered.object_key;
  }
  const obj = request.method === "HEAD" ? await env.MEDIA.head(r2Key) : await env.MEDIA.get(r2Key);
  if (obj) {
    const headers = new Headers();
    obj.writeHttpMetadata(headers);
    headers.set("Cache-Control", r2Key === key ? "public, max-age=86400" : "public, max-age=3600");
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("ETag", obj.httpEtag);
    headers.set("X-GoCamp-Media-Source", "r2");
    if (request.headers.get("If-None-Match") === obj.httpEtag) {
      return new Response(null, { status: 304, headers });
    }
    return new Response(request.method === "HEAD" ? null : (obj as R2ObjectBody).body, {
      status: 200,
      headers
    });
  }
  // R2 is the source of truth: no local/GitHub static-asset fallback after migration.
  return new Response("Image not found", { status: 404 });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const started = performance.now();
    try {
      const pathname = new URL(request.url).pathname;
      if (
        (request.method === "GET" || request.method === "HEAD") &&
        (pathname.startsWith("/images/") || pathname.startsWith("/uploads/"))
      ) {
        return applyResponseHeaders(await serveR2Image(request, env), env);
      }
      const response = await handle(request, { cloudflare: { env, ctx } });
      const headers = new Headers(response.headers);
      headers.set("Server-Timing", `app;dur=${(performance.now() - started).toFixed(1)}`);
      return applyResponseHeaders(
        new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers
        }),
        env
      );
    } catch (error) {
      logEvent("error", "worker request failed", {
        method: request.method,
        path: new URL(request.url).pathname,
        error: error instanceof Error ? error.message : String(error)
      });
      return new Response("Internal Server Error", {
        status: 500,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff"
        }
      });
    }
  },
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    if (env.GOCAMP_ENV !== "staging") return;
    ctx.waitUntil(backfillWebp(env, 20).then((result) => {
      logEvent("info", "webp backfill", result);
    }));
  }
} satisfies ExportedHandler<Env>;
