import { isProduction } from "./environment.server";
/** Production-only, server-rendered discovery for search engines and AI search crawlers. */
const SITE = "https://gocampinternational.net";
function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
type Entity = {
  kind: string;
  slug: string;
  name: string;
  content_json: string;
  updated_at: number;
};
function clean(value: unknown) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function imageUrl(value: unknown): string | undefined {
  const path = String(value || "");
  if (path.startsWith("/media/") || path.startsWith("/images/") || path.startsWith("/uploads/"))
    return SITE + path;
  return undefined;
}
async function publicEntities(env: Env): Promise<Entity[]> {
  const r = await env.DB.prepare(
    "SELECT kind,slug,name,content_json,updated_at FROM catalog_entities WHERE status='active' AND kind IN ('destination','category') ORDER BY kind,sort_order,slug"
  ).all<Entity>();
  return r.results || [];
}
function entityUrl(entry: Entity) {
  return entry.kind === "destination"
    ? SITE + "/destinations/" + encodeURIComponent(entry.slug)
    : SITE + "/program/category?category=" + encodeURIComponent(entry.slug);
}
function response(body: string, type: string, ttl = 900) {
  return new Response(body, {
    headers: {
      "content-type": type,
      "cache-control": "public, max-age=" + ttl,
      "x-content-type-options": "nosniff"
    }
  });
}
export async function discoveryResponse(url: URL, env: Env): Promise<Response | null> {
  const path = url.pathname;
  if (!["/robots.txt", "/sitemap.xml", "/llms.txt"].includes(path)) return null;
  if (!isProduction(env)) {
    return path === "/robots.txt"
      ? response("User-agent: *\nDisallow: /\n", "text/plain; charset=utf-8", 300)
      : new Response("Not found", { status: 404, headers: { "x-robots-tag": "noindex,nofollow" } });
  }
  if (path === "/robots.txt") {
    // These generic rules allow Googlebot, OAI-SearchBot, Claude-SearchBot and Claude-User.
    return response(
      "User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\n\nSitemap: " +
        SITE +
        "/sitemap.xml\n",
      "text/plain; charset=utf-8",
      3600
    );
  }
  const entities = await publicEntities(env);
  if (path === "/sitemap.xml") {
    const pages = [
      { url: SITE + "/", image: SITE + "/images/banner.webp", date: "" },
      ...["/about", "/faq", "/contact"].map((p) => ({ url: SITE + p, image: "", date: "" })),
      ...entities.map((entity) => {
        const data = JSON.parse(entity.content_json || "{}") as { banner?: string; image?: string };
        return {
          url: entityUrl(entity),
          image: imageUrl(data.banner || data.image) || "",
          date: entity.updated_at
            ? new Date(entity.updated_at * 1000).toISOString().slice(0, 10)
            : ""
        };
      })
    ];
    const xml =
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ' +
      'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n' +
      pages
        .map(
          (page) =>
            "  <url><loc>" +
            escapeXml(page.url) +
            "</loc>" +
            (page.date ? "<lastmod>" + page.date + "</lastmod>" : "") +
            (page.image
              ? "<image:image><image:loc>" + escapeXml(page.image) + "</image:loc></image:image>"
              : "") +
            "</url>"
        )
        .join("\n") +
      "\n</urlset>";
    return response(xml, "application/xml; charset=utf-8");
  }
  const lines = [
    "# Go Camp International",
    "> International summer camps, educational travel, language learning, sports and leadership experiences.",
    "",
    "Official website: " + SITE,
    "Contact: " + SITE + "/contact",
    "About: " + SITE + "/about",
    "Frequently asked questions: " + SITE + "/faq",
    "",
    "## Destinations and program categories"
  ];
  for (const item of entities) {
    const data = JSON.parse(item.content_json || "{}") as { tagline?: string; intro?: string };
    lines.push(
      "- [" +
        clean(item.name) +
        "](" +
        entityUrl(item) +
        ")" +
        (data.tagline || data.intro ? ": " + clean(data.tagline || data.intro).slice(0, 180) : "")
    );
  }
  lines.push(
    "",
    "## Content policy",
    "Descriptions are provided by Go Camp International. Program availability and dates can change; verify on the official website.",
    "Student photographs and testimonials are contextual, not individual student profiles."
  );
  return response(lines.join("\n") + "\n", "text/plain; charset=utf-8");
}
