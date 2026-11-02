import { backfillWebp } from "../app/lib/media-backfill.server";
import { discoveryResponse } from "../app/lib/seo-discovery.server";
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
  const url = new URL(request.url);
  const pathname = url.pathname;
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
  const preset = url.searchParams.get("variant");
  const optimizedKey =
    preset && ["mobile", "tablet", "desktop"].includes(preset)
      ? `optimized/${preset}/${key}.webp`
      : null;
  const read = (candidate: string) =>
    request.method === "HEAD" ? env.MEDIA.head(candidate) : env.MEDIA.get(candidate);
  // Materialized R2 variants, not dynamic transformation and not a cache.
  const obj = (optimizedKey && await read(optimizedKey)) || await read(key);
  if (obj) {
    const headers = new Headers();
    obj.writeHttpMetadata(headers);
    headers.set("Cache-Control", "public, max-age=86400");
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("ETag", obj.httpEtag);
    headers.set("X-GoCamp-Media-Source", "r2");
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
      if (request.method === "GET" || request.method === "HEAD") {
        const discovery = await discoveryResponse(new URL(request.url), env);
        if (discovery) return applyResponseHeaders(discovery, env);
      }
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
    ctx.waitUntil(backfillWebp(env, 17).then((result) => {
      logEvent("info", "staging WebP backfill", result);
    }));
  }
} satisfies ExportedHandler<Env>;
