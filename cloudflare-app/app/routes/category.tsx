import { getCloudflare } from "../lib/cloudflare-context";
import { useRouteLoaderData } from "react-router";
import type { Route } from "./+types/category";
import { CategoryPage } from "../features/category/CategoryPage";
import { findCategory, listDestinations, listPrograms, loadDocument } from "../lib/catalog.server";
import type { MemoriesDocument, SiteSettings } from "../lib/domain";
import {
  cleanSeoText,
  originFrom,
  resolveCatalogSeo,
  robotsFromMatches,
  safeJsonLd,
  seoMeta,
  truncateSeoDescription
} from "../lib/seo";

export async function loader({ request, context }: Route.LoaderArgs) {
  const db = getCloudflare(context).env.DB;
  const slug = new URL(request.url).searchParams.get("category") || "";
  const [category, memories] = await Promise.all([
    findCategory(db, slug),
    loadDocument<MemoriesDocument>(db, "camp_memories")
  ]);
  if (!category || category.status !== "active") {
    throw new Response("Not Found", { status: 404 });
  }
  const [programs, destinations] = await Promise.all([
    listPrograms(db),
    listDestinations(db, false)
  ]);
  const destinationByProgram = new Map<string, (typeof destinations)[number]>();
  for (const destination of destinations) {
    if (!Array.isArray(destination.program_ids)) continue;
    for (const id of destination.program_ids) {
      if (!destinationByProgram.has(id)) destinationByProgram.set(id, destination);
    }
  }
  const related = programs
    .filter((program) => program.category_slug === category.slug)
    .filter((program) => {
      const linked = destinationByProgram.get(program.id || program.slug);
      return !linked || linked.status !== "trash";
    })
    .sort(
      (a, b) =>
        Number(a.order ?? Number.MAX_SAFE_INTEGER) - Number(b.order ?? Number.MAX_SAFE_INTEGER) ||
        a.name.localeCompare(b.name)
    );
  return { category, related, memories };
}

export function meta({ loaderData, matches }: Route.MetaArgs) {
  const category = loaderData?.category;
  const seo = resolveCatalogSeo(
    "category",
    category?.name,
    category?.intro,
    category?.banner || category?.image,
    category?.seo
  );
  return seoMeta({
    origin: originFrom(matches),
    path: "/program/category?category=" + encodeURIComponent(category?.slug || ""),
    ...seo,
    robots: robotsFromMatches(matches, seo.noindex || category?.status !== "active")
  });
}

export default function Category({ loaderData }: Route.ComponentProps) {
  const root = useRouteLoaderData("root") as { settings: SiteSettings } | undefined;
  const base =
    (root as { origin?: string } | undefined)?.origin || "https://gocampinternational.net";
  const category = loaderData.category;
  const seo = resolveCatalogSeo(
    "category",
    category.name,
    category.intro,
    category.banner || category.image,
    category.seo
  );
  const canonical = base + "/program/category?category=" + encodeURIComponent(category.slug);
  return (
    <>
      {seo.structuredDataEnabled && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: safeJsonLd({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "CollectionPage",
                  name: category.name,
                  url: canonical,
                  description: truncateSeoDescription(seo.description, 300),
                  primaryImageOfPage: new URL(seo.image, base).href,
                  isPartOf: { "@id": base + "/#website" }
                },
                {
                  "@type": "BreadcrumbList",
                  itemListElement: [
                    { "@type": "ListItem", position: 1, name: "Home", item: base + "/" },
                    {
                      "@type": "ListItem",
                      position: 2,
                      name: cleanSeoText(category.name),
                      item: canonical
                    }
                  ]
                }
              ]
            })
          }}
        />
      )}
      <CategoryPage
        category={loaderData.category}
        programs={loaderData.related}
        settings={root?.settings || {}}
        memories={loaderData.memories}
      />
    </>
  );
}
