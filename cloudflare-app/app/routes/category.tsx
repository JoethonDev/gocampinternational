import { useRouteLoaderData } from "react-router";
import type { Route } from "./+types/category";
import { CategoryPage } from "../features/category/CategoryPage";
import { findCategory, listDestinations, listPrograms, loadDocument } from "../lib/catalog.server";
import type { MemoriesDocument, SiteSettings } from "../lib/domain";
import { originFrom, seoMeta } from "../lib/seo";

export async function loader({ request, context }: Route.LoaderArgs) {
  const db = context.cloudflare.env.DB;
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
  const related = programs
    .filter((program) => program.category_slug === category.slug)
    .filter((program) => {
      const linked = destinations.find(
        (destination) =>
          Array.isArray(destination.program_ids) &&
          destination.program_ids.includes(program.id || program.slug)
      );
      return !linked || linked.status !== "trash";
    })
    .sort(
      (a, b) =>
        Number(a.order ?? Number.MAX_SAFE_INTEGER) - Number(b.order ?? Number.MAX_SAFE_INTEGER) ||
        a.name.localeCompare(b.name)
    );
  return { category, related, memories };
}

export function meta({ data, matches, location }: Route.MetaArgs) {
  return seoMeta({
    origin: originFrom(matches),
    path: location.pathname + location.search,
    title: `Go Camp :: ${data?.category.name || "Programs"}`,
    description: String(data?.category.intro || "")
      .replace(/<[^>]*>/g, "")
      .slice(0, 160)
  });
}

export default function Category({ loaderData }: Route.ComponentProps) {
  const root = useRouteLoaderData("root") as { settings: SiteSettings } | undefined;
  return (
    <CategoryPage
      category={loaderData.category}
      programs={loaderData.related}
      settings={root?.settings || {}}
      memories={loaderData.memories}
    />
  );
}
