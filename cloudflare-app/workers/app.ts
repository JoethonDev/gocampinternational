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

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const started = performance.now();
    try {
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
