// GoCamp staging custom-domain bridge.
// Cloudflare Pages supplies the TLS certificate and external-DNS hostname.
// The service binding invokes the existing full-stack React Router Worker,
// which continues to own D1, R2, authentication, and all application routes.
export default {
  async fetch(request, env) {
    if (!env.GOCAMP_WORKER) {
      return new Response("Staging bridge service binding is missing", {
        status: 503,
        headers: { "Cache-Control": "no-store" }
      });
    }
    return env.GOCAMP_WORKER.fetch(request);
  }
};
