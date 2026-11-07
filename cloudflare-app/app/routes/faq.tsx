import { getCloudflare } from "../lib/cloudflare-context";
import type { Route } from "./+types/faq";
import { FaqPage } from "../features/faq/FaqPage";
import { loadDocument } from "../lib/catalog.server";
import type { FaqItem } from "../lib/domain";
import { originFrom, seoMeta } from "../lib/seo";
import { publicSeo } from "../lib/public-content";

export async function loader({ context }: Route.LoaderArgs) {
  return {
    items: (await loadDocument<FaqItem[]>(getCloudflare(context).env.DB, "faq")) || []
  };
}

export function meta({ matches }: Route.MetaArgs) {
  const seo = publicSeo(matches, "faq");
  return seoMeta({
    origin: originFrom(matches),
    path: "/faq",
    ...seo
  });
}

export default function Faq({ loaderData }: Route.ComponentProps) {
  return <FaqPage items={loaderData.items} />;
}
