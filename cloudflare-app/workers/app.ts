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

async function serveLegacyImage(request: Request, env: Env): Promise<Response> {
  const pathname = new URL(request.url).pathname;
  const key = pathname.slice(1);
  // Never resolve an arbitrary object key; this route is only for committed public images.
  if (
    !/^images\/[a-zA-Z0-9_().%+-][a-zA-Z0-9_().%+\/-]*\.(webp|png|jpe?g|avif|gif|svg|ico)$/i.test(
      key
    ) ||
    key.includes("..") ||
    key.includes("%2f") ||
    key.includes("%5c")
  ) {
    return new Response("Not found", { status: 404 });
  }
  const obj = request.method === "HEAD" ? await env.MEDIA.head(key) : await env.MEDIA.get(key);
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
  // Transitional fallback: original committed images are still deployed as static assets.
  return env.ASSETS.fetch(request);
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const started = performance.now();
    try {
      const pathname = new URL(request.url).pathname;
      if (
        (request.method === "GET" || request.method === "HEAD") &&
        pathname.startsWith("/images/")
      ) {
        return applyResponseHeaders(await serveLegacyImage(request, env), env);
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
  }
} satisfies ExportedHandler<Env>;
