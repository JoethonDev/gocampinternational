import { useRouteLoaderData } from "react-router";
import type { Route } from "./+types/home";
import { HomePage } from "../features/home/HomePage";
import { loadDocument } from "../lib/catalog.server";
import type {
  CategoryRecord,
  DestinationRecord,
  MemoriesDocument,
  SiteSettings
} from "../lib/domain";
import { originFrom, seoMeta } from "../lib/seo";

export function meta({ matches }: Route.MetaArgs) {
  return seoMeta({
    origin: originFrom(matches),
    path: "/",
    title: "Go Camp International | Unforgettable Summer Experiences",
    description:
      "Discover life-changing international summer camps for teens. We offer language, arts, sports, and leadership programs in premier destinations."
  });
}

export async function loader({ context }: Route.LoaderArgs) {
  const db = context.cloudflare.env.DB;
  const [memories, rows] = await Promise.all([
    loadDocument<MemoriesDocument>(db, "camp_memories"),
    db
      .prepare(
        `
      SELECT p.category_slug,
        (SELECT d.status
         FROM destination_programs dp
         JOIN catalog_entities d ON d.slug = dp.destination_slug AND d.kind = 'destination'
         WHERE dp.program_slug = p.slug
         ORDER BY d.sort_order
         LIMIT 1) AS destination_status
      FROM catalog_entities p
      WHERE p.kind = 'program' AND p.status = 'active'
    `
      )
      .all<{ category_slug: string; destination_status: string | null }>()
  ]);
  const eligible = [
    ...new Set(
      (rows.results || [])
        .filter((row) => row.destination_status === null || row.destination_status === "active")
        .map((row) => row.category_slug)
    )
  ];
  return { eligible, memories };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const root = useRouteLoaderData("root") as
    | {
        destinations: DestinationRecord[];
        categories: CategoryRecord[];
        settings: SiteSettings;
      }
    | undefined;
  return (
    <HomePage
      destinations={root?.destinations || []}
      categories={root?.categories || []}
      eligible={loaderData.eligible}
      settings={root?.settings || {}}
      memories={loaderData.memories}
    />
  );
}
