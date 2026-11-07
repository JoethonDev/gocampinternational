// Cloudflare Pages HTTPS bridge for GoCamp production.
// Forwards each request via Service Binding to the isolated production Worker.
// The production Worker owns React Router SSR, D1, R2, media and authentication.
export default {
  async fetch(request, env) {
    if (!env.GOCAMP_WORKER) {
      return new Response("Production service binding is unavailable", {
        status: 503,
        headers: { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" }
      });
    }
    return env.GOCAMP_WORKER.fetch(request);
  }
};
