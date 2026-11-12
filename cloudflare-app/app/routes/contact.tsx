import type { Route } from "./+types/contact";
import { getCloudflare } from "../lib/cloudflare-context";
import { loadPublishedDocument } from "../lib/editorial-publish.server";
import { ABOUT_PAGE_DEFAULT, SITE, type AboutPageContent } from "../config/site";
import type { SiteSettings } from "../lib/domain";
import { ContactPage } from "../features/contact/ContactPage";
import { originFrom, seoMeta } from "../lib/seo";
import { publicSeo } from "../lib/public-content";

export function meta({ matches }: Route.MetaArgs) {
  const seo = publicSeo(matches, "contact");
  return seoMeta({
    origin: originFrom(matches),
    path: "/contact",
    ...seo
  });
}

export async function loader({ context }: Route.LoaderArgs) {
  const settings = await loadPublishedDocument<SiteSettings>(
    getCloudflare(context).env,
    "site_settings"
  );
  const profile = (settings?.about_page as AboutPageContent | undefined)?.profile;
  return {
    profile: {
      name: profile?.name?.trim() || ABOUT_PAGE_DEFAULT.profile.name,
      title: profile?.title?.trim() || ABOUT_PAGE_DEFAULT.profile.title,
      image: profile?.image?.trim() || SITE.images.profile
    }
  };
}

export default function Contact({ loaderData }: Route.ComponentProps) {
  return <ContactPage profile={loaderData.profile} />;
}
