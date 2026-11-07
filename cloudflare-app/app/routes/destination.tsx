import { getCloudflare } from "../lib/cloudflare-context";
import { useRouteLoaderData } from "react-router";
import type { Route } from "./+types/destination";
import { DestinationPage } from "../features/destination/DestinationPage";
import { findDestination, listPrograms, loadDocument } from "../lib/catalog.server";
import type { MemoriesDocument, ProgramRecord, SiteSettings } from "../lib/domain";
import {
  cleanSeoText,
  originFrom,
  resolveCatalogSeo,
  robotsFromMatches,
  safeJsonLd,
  seoMeta,
  truncateSeoDescription
} from "../lib/seo";

export async function loader({ params, context }: Route.LoaderArgs) {
  const db = getCloudflare(context).env.DB;
  const slug = params.slug || "";
  const [destination, memories] = await Promise.all([
    findDestination(db, slug),
    loadDocument<MemoriesDocument>(db, "camp_memories")
  ]);
  if (!destination || destination.status === "trash") {
    throw new Response("Not found", { status: 404 });
  }
  const programIds = destination.program_ids || [];
  const programs = destination.status === "coming-soon" ? [] : await listPrograms(db);
  const byId = new Map(programs.map((program) => [program.id || program.slug, program]));
  const related = programIds
    .map((id) => byId.get(id))
    .filter((program): program is ProgramRecord => Boolean(program));
  return { destination, related, hasProgramIds: programIds.length > 0, memories };
}

export function meta({ loaderData, matches, location }: Route.MetaArgs) {
  const destination = loaderData?.destination;
  const seo = resolveCatalogSeo(
    "destination",
    destination?.name,
    destination?.tagline || destination?.intro_text,
    destination?.banner || destination?.image,
    destination?.seo
  );
  return seoMeta({
    origin: originFrom(matches),
    path: location.pathname,
    ...seo,
    robots: robotsFromMatches(matches, seo.noindex || destination?.status !== "active")
  });
}

export default function Destination({ loaderData }: Route.ComponentProps) {
  const root = useRouteLoaderData("root") as { settings: SiteSettings } | undefined;
  const base =
    (root as { origin?: string } | undefined)?.origin || "https://gocampinternational.net";
  const destination = loaderData.destination;
  const seo = resolveCatalogSeo(
    "destination",
    destination.name,
    destination.tagline || destination.intro_text,
    destination.banner || destination.image,
    destination.seo
  );
  const canonical = new URL(`/destinations/${encodeURIComponent(destination.slug)}`, base).href;
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
                  name: destination.name,
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
                      name: cleanSeoText(destination.name),
                      item: canonical
                    }
                  ]
                }
              ]
            })
          }}
        />
      )}
      <DestinationPage
        destination={loaderData.destination}
        programs={loaderData.related}
        hasProgramIds={loaderData.hasProgramIds}
        settings={root?.settings || {}}
        memories={loaderData.memories}
      />
    </>
  );
}
