// Production placeholder is deployed but NOT publicly routed, with workers.dev disabled.
// Never enable a route until the Phase 6 release gate.
export default {
  async fetch() {
    return new Response(JSON.stringify({ error: "GoCamp migration not released" }), {
      status: 503,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
        "x-robots-tag": "noindex, nofollow"
      }
    });
  }
};
