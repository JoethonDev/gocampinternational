import { useRouteLoaderData } from "react-router";
import type { Route } from "./+types/destination";
import { DestinationPage } from "../features/destination/DestinationPage";
import { findDestination, listPrograms, loadDocument } from "../lib/catalog.server";
import type { MemoriesDocument, ProgramRecord, SiteSettings } from "../lib/domain";
import { originFrom, seoMeta } from "../lib/seo";

export async function loader({ params, context }: Route.LoaderArgs) {
  const db = context.cloudflare.env.DB;
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

export function meta({ data, matches, location }: Route.MetaArgs) {
  const destination = data?.destination;
  const name = destination?.name || "Destination";
  const title =
    destination?.status === "coming-soon" ? `Coming Soon: ${name}` : `Go Camp :: ${name}`;
  return seoMeta({
    origin: originFrom(matches),
    path: location.pathname,
    title,
    description: String(destination?.tagline || "Discover Your Adventure").slice(0, 160)
  });
}

export default function Destination({ loaderData }: Route.ComponentProps) {
  const root = useRouteLoaderData("root") as { settings: SiteSettings } | undefined;
  return (
    <DestinationPage
      destination={loaderData.destination}
      programs={loaderData.related}
      hasProgramIds={loaderData.hasProgramIds}
      settings={root?.settings || {}}
      memories={loaderData.memories}
    />
  );
}
