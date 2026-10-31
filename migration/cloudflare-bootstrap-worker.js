// Isolated migration health placeholder. NOT the GoCamp React app.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const headers = {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow"
    };
    if (request.method === "GET" && url.pathname === "/health") {
      return new Response(JSON.stringify({ service: "gocamp-migration", environment: "staging", state: "bootstrap-only", source_commit: "80432a2a6fcb4b0de6f14710748e53781ddef58c" }), { status: 200, headers });
    }
    return new Response(JSON.stringify({ error: "Migration application not deployed" }), { status: 503, headers });
  }
};
