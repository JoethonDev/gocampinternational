import test from "node:test";
import assert from "node:assert/strict";
import { loadTypeScript } from "./load-typescript.mjs";
import { SqliteD1, entity } from "./sqlite-d1.mjs";

const { resolveCatalogSeo, robotsFromMatches, safeJsonLd, seoMeta, truncateSeoDescription } =
  await loadTypeScript("../app/lib/seo.ts");
const { discoveryResponse, isSeoIndexingAllowed } = await loadTypeScript(
  "../app/lib/seo-discovery.server.ts"
);

test("SEO defaults, overrides, text cleanup, and safe canonical/image URLs", () => {
  const catalog = resolveCatalogSeo(
    "destination",
    "Italy <script>alert(1)</script>",
    "  Camp <b>description</b>  ",
    "javascript:alert(1)",
    { title: "  Italy camps  ", og_image_id: "bad id", noindex: true }
  );
  assert.equal(catalog.title, "Italy camps");
  assert.equal(catalog.description, "Camp description");
  assert.equal(catalog.image, "/images/banner.webp");
  assert.equal(catalog.noindex, true);

  const meta = seoMeta({
    title: "  Safe <b>Title</b> ",
    description: "Useful description",
    path: "https://attacker.example/path",
    origin: "https://gocampinternational.net",
    image: "javascript:alert(1)"
  });
  const byName = new Map(meta.filter((item) => item.name).map((item) => [item.name, item.content]));
  const byProperty = new Map(
    meta.filter((item) => item.property).map((item) => [item.property, item.content])
  );
  assert.equal(meta[0].title, "Safe Title");
  assert.equal(
    meta.find((item) => item.rel === "canonical").href,
    "https://gocampinternational.net/"
  );
  assert.equal(byProperty.get("og:image"), "https://gocampinternational.net/images/banner.webp");
  assert.equal(byName.get("description"), "Useful description");
  assert.equal(truncateSeoDescription("A ".repeat(100)).at(-1), "…");
  assert.match(safeJsonLd({ value: "</script>" }), /\\u003c\/script>/);
});

test("robots metadata only permits indexing on the explicitly enabled canonical host", () => {
  const env = { GOCAMP_ENV: "production", SEO_INDEXING_ENABLED: "true" };
  assert.equal(isSeoIndexingAllowed(new URL("https://gocampinternational.net/"), env), true);
  assert.equal(isSeoIndexingAllowed(new URL("http://gocampinternational.net/"), env), false);
  assert.equal(isSeoIndexingAllowed(new URL("https://gocampinternational.net:444/"), env), false);
  assert.equal(isSeoIndexingAllowed(new URL("https://new.gocampinternational.net/"), env), false);
  assert.equal(isSeoIndexingAllowed(new URL("https://app.workers.dev/"), env), false);
  assert.equal(
    isSeoIndexingAllowed(new URL("https://gocampinternational.net/"), {
      GOCAMP_ENV: "staging",
      SEO_INDEXING_ENABLED: "true"
    }),
    false
  );
  assert.equal(
    robotsFromMatches([{ id: "root", loaderData: { seoIndexingAllowed: false } }]),
    "noindex,nofollow"
  );
  assert.equal(
    robotsFromMatches([{ id: "root", loaderData: { seoIndexingAllowed: true } }], true),
    "noindex,follow"
  );
});

test("sitemap includes only active indexed content and public, resolvable media", async () => {
  const db = new SqliteD1();
  const publicId = "22222222-2222-4222-8222-222222222222";
  db.sql
    .prepare(
      "INSERT INTO media_assets(id,object_key,display_name,mime_type,sha256,is_public) VALUES(?, 'images/public.webp','Public','image/webp','public',1)"
    )
    .run(publicId);
  entity(db, "category", "kids-camps", {
    name: "Kids Camps",
    banner: `/media/${publicId}`,
    seo: { og_image_id: publicId }
  });
  entity(db, "destination", "hidden-place", {
    name: "Hidden place",
    seo: { noindex: true }
  });
  entity(db, "destination", "broken-image", {
    name: "Broken image",
    banner: "/media/33333333-3333-4333-8333-333333333333"
  });
  entity(db, "category", "inactive", { name: "Inactive", status: "inactive" });

  const env = { DB: db, GOCAMP_ENV: "production", SEO_INDEXING_ENABLED: "true" };
  const response = await discoveryResponse(
    new URL("https://gocampinternational.net/sitemap.xml"),
    env
  );
  const xml = await response.text();
  assert.equal(response.status, 200);
  assert.match(xml, /https:\/\/gocampinternational\.net\/program\/category\?category=kids-camps/);
  assert.match(xml, new RegExp(`https://gocampinternational\\.net/media/${publicId}`));
  assert.match(xml, /<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/);
  assert.doesNotMatch(xml, /hidden-place|33333333|\/programs\//);
  assert.doesNotMatch(xml, /<image:loc>[^<]*33333333/);
});

test("discovery endpoints remain closed unless production indexing is explicitly enabled", async () => {
  const db = new SqliteD1();
  for (const [host, env] of [
    ["https://gocampinternational.net", { GOCAMP_ENV: "production" }],
    ["https://gocampinternational.net", { GOCAMP_ENV: "staging", SEO_INDEXING_ENABLED: "true" }],
    ["https://app.workers.dev", { GOCAMP_ENV: "production", SEO_INDEXING_ENABLED: "true" }]
  ]) {
    const robots = await discoveryResponse(new URL(`${host}/robots.txt`), { DB: db, ...env });
    const sitemap = await discoveryResponse(new URL(`${host}/sitemap.xml`), { DB: db, ...env });
    assert.match(await robots.text(), /Disallow: \/\n/);
    assert.equal(sitemap.status, 404);
    assert.equal(sitemap.headers.get("x-robots-tag"), "noindex, nofollow");
  }
});
