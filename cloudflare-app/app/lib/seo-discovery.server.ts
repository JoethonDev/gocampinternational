import { isProduction } from "./environment.server";
import { cleanSeoText } from "./seo";

/** Canonical origin used only when production indexing has been explicitly enabled. */
const SITE = "https://gocampinternational.net";
const CANONICAL_HOST = "gocampinternational.net";

type Entity = {
  kind: "destination" | "category" | "program";
  slug: string;
  name: string;
  content_json: string;
  updated_at: number;
};

type EntityContent = {
  banner?: unknown;
  image?: unknown;
  tagline?: unknown;
  intro?: unknown;
  intro_text?: unknown;
  description?: unknown;
  seo?: { noindex?: unknown; og_image_id?: unknown };
};

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function parseContent(value: string): EntityContent | null {
  try {
    const parsed: unknown = JSON.parse(value || "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as EntityContent;
  } catch {
    return null;
  }
}

function isPublicEntity(entity: Entity) {
  const content = parseContent(entity.content_json);
  return (
    content !== null &&
    /^[a-z0-9][a-z0-9_-]{0,159}$/i.test(entity.slug) &&
    cleanSeoText(entity.name).length > 0 &&
    (entity.kind !== "program" ||
      cleanSeoText(content.description || content.tagline).length > 0) &&
    content.seo?.noindex !== true
  );
}

function imageUrl(value: unknown, publicMediaIds: Set<string>, publicLegacyPaths: Set<string>) {
  const path = String(value ?? "");
  const mediaId = path.match(/^\/media\/([a-zA-Z0-9_-]{1,160})$/)?.[1];
  if (mediaId && publicMediaIds.has(mediaId)) return SITE + path;
  if (publicLegacyPaths.has(path)) return SITE + path;
  return "";
}

async function publicEntities(env: Env): Promise<Entity[]> {
  const result = await env.DB.prepare(
    "SELECT kind,slug,name,content_json,updated_at FROM catalog_entities WHERE status='active' AND kind IN ('destination','category','program') ORDER BY kind,sort_order,slug"
  ).all<Entity>();
  return (result.results || []).filter(isPublicEntity);
}

async function publicMedia(env: Env) {
  const result = await env.DB.prepare(
    "SELECT id,legacy_path FROM media_assets WHERE is_public=1"
  ).all<{ id: string; legacy_path: string | null }>();
  const rows = result.results || [];
  return {
    ids: new Set(rows.map((row) => row.id)),
    legacyPaths: new Set(
      rows.map((row) => row.legacy_path).filter((path): path is string => !!path)
    )
  };
}

function entityUrl(entry: Entity) {
  if (entry.kind === "destination") return SITE + "/destinations/" + encodeURIComponent(entry.slug);
  if (entry.kind === "program") return SITE + "/programs/" + encodeURIComponent(entry.slug);
  return SITE + "/program/category?category=" + encodeURIComponent(entry.slug);
}

function response(body: string, type: string, ttl = 300) {
  return new Response(body, {
    headers: {
      "content-type": type,
      "cache-control": `public, max-age=${ttl}`,
      "x-content-type-options": "nosniff"
    }
  });
}

export function isSeoIndexingAllowed(
  url: URL,
  env: { GOCAMP_ENV: string; SEO_INDEXING_ENABLED?: string }
) {
  return (
    isProduction(env) &&
    env.SEO_INDEXING_ENABLED === "true" &&
    url.protocol === "https:" &&
    !url.port &&
    url.hostname.toLowerCase() === CANONICAL_HOST
  );
}

function unavailableResponse(path: string) {
  if (path === "/robots.txt") {
    return response("User-agent: *\nDisallow: /\n", "text/plain; charset=utf-8", 300);
  }
  return new Response("Not found", {
    status: 404,
    headers: { "x-robots-tag": "noindex, nofollow", "cache-control": "no-store" }
  });
}

export async function discoveryResponse(url: URL, env: Env): Promise<Response | null> {
  const path = url.pathname;
  if (!["/robots.txt", "/sitemap.xml", "/llms.txt"].includes(path)) return null;
  if (!isSeoIndexingAllowed(url, env)) return unavailableResponse(path);

  if (path === "/robots.txt") {
    return response(
      "User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: " +
        SITE +
        "/sitemap.xml\n",
      "text/plain; charset=utf-8",
      3600
    );
  }

  const entities = await publicEntities(env);
  if (path === "/sitemap.xml") {
    const media = await publicMedia(env);
    const pages = [
      { url: SITE + "/", image: "", date: "" },
      ...["/about", "/faq", "/contact"].map((page) => ({ url: SITE + page, image: "", date: "" })),
      ...entities.map((entity) => {
        const data = parseContent(entity.content_json) || {};
        const seoImageId = typeof data.seo?.og_image_id === "string" ? data.seo.og_image_id : "";
        const seoImage = seoImageId ? `/media/${seoImageId}` : "";
        return {
          url: entityUrl(entity),
          image: imageUrl(seoImage || data.banner || data.image, media.ids, media.legacyPaths),
          date:
            Number.isSafeInteger(entity.updated_at) && entity.updated_at > 0
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
    "> Short-term international camps and student experiences in sports, culture, languages, adventure and academic exploration.",
    "",
    "Official website: " + SITE,
    "Contact: " + SITE + "/contact",
    "About: " + SITE + "/about",
    "Frequently asked questions: " + SITE + "/faq",
    "",
    "## Destinations, program categories and short-term programs"
  ];
  for (const item of entities) {
    const data = parseContent(item.content_json) || {};
    const summary = cleanSeoText(data.tagline || data.intro_text || data.intro || data.description);
    lines.push(
      "- [" +
        cleanSeoText(item.name) +
        "](" +
        entityUrl(item) +
        ")" +
        (summary ? ": " + summary.slice(0, 180) : "")
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
