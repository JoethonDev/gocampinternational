import { getCloudflare } from "../lib/cloudflare-context";
import type { Route } from "./+types/about";
import { AboutPage } from "../features/about/AboutPage";
import { originFrom, seoMeta } from "../lib/seo";
import { loadDocument } from "../lib/catalog.server";
import { ABOUT_PAGE_DEFAULT, type AboutPageContent } from "../config/site";
import type { SiteSettings } from "../lib/domain";
import { publicSeo } from "../lib/public-content";

export function meta({ matches }: Route.MetaArgs) {
  const seo = publicSeo(matches, "about");
  return seoMeta({
    origin: originFrom(matches),
    path: "/about",
    ...seo
  });
}

export async function loader({ context }: Route.LoaderArgs) {
  const settings = await loadDocument<SiteSettings>(getCloudflare(context).env.DB, "site_settings");
  const current = settings?.about_page as AboutPageContent | undefined;
  return {
    about:
      current && Array.isArray(current.sections) && current.profile ? current : ABOUT_PAGE_DEFAULT
  };
}

export default function About({ loaderData }: Route.ComponentProps) {
  return <AboutPage content={loaderData.about} />;
}
