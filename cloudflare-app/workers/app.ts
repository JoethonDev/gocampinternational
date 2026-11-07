import { serveR2Image } from "../app/lib/legacy-media.server";
import { discoveryResponse, isSeoIndexingAllowed } from "../app/lib/seo-discovery.server";
import { createRequestHandler } from "react-router";
import { createCloudflareContext } from "../app/lib/cloudflare-context";
import { logEvent } from "../app/lib/logger.server";

const handle = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE
);

function applyResponseHeaders(response: Response, env: Env, request: Request): Response {
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("X-Frame-Options", "DENY");
  headers.set(
    "Content-Security-Policy",
    "frame-ancestors 'none'; object-src 'none'; base-uri 'self'"
  );
  const pathname = new URL(request.url).pathname;
  if (/^\/admin(?:[/.]|$)/.test(pathname) || !["GET", "HEAD"].includes(request.method)) {
    headers.set("Cache-Control", "no-store");
    headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  if (env.GOCAMP_ENV === "staging" || !isSeoIndexingAllowed(new URL(request.url), env)) {
    headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const started = performance.now();
    try {
      const pathname = new URL(request.url).pathname;
      if (request.method === "GET" || request.method === "HEAD") {
        const discovery = await discoveryResponse(new URL(request.url), env);
        if (discovery) return applyResponseHeaders(discovery, env, request);
      }
      if (
        (request.method === "GET" || request.method === "HEAD") &&
        (pathname.startsWith("/images/") || pathname.startsWith("/uploads/"))
      ) {
        return applyResponseHeaders(await serveR2Image(request, env), env, request);
      }
      const response = await handle(request, createCloudflareContext(env, ctx));
      const headers = new Headers(response.headers);
      headers.set("Server-Timing", `app;dur=${(performance.now() - started).toFixed(1)}`);
      return applyResponseHeaders(
        new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers
        }),
        env,
        request
      );
    } catch (error) {
      logEvent("error", "worker request failed", {
        method: request.method,
        path: new URL(request.url).pathname,
        error: error instanceof Error ? error.message : String(error)
      });
      return applyResponseHeaders(
        new Response("Internal Server Error", {
          status: 500,
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff"
          }
        }),
        env,
        request
      );
    }
  }
} satisfies ExportedHandler<Env>;
