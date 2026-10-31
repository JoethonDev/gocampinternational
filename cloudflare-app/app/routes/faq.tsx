import type { Route } from "./+types/faq";
import { FaqPage } from "../features/faq/FaqPage";
import { loadDocument } from "../lib/catalog.server";
import type { FaqItem } from "../lib/domain";
import { originFrom, seoMeta } from "../lib/seo";

export async function loader({ context }: Route.LoaderArgs) {
  return {
    items: (await loadDocument<FaqItem[]>(context.cloudflare.env.DB, "faq")) || []
  };
}

export function meta({ matches }: Route.MetaArgs) {
  return seoMeta({
    origin: originFrom(matches),
    path: "/faq",
    title: "Go Camp :: Frequently Asked Questions",
    description:
      "Find answers to common questions about our summer camps, including safety, preparation, and program details."
  });
}

export default function Faq({ loaderData }: Route.ComponentProps) {
  return <FaqPage items={loaderData.items} />;
}
