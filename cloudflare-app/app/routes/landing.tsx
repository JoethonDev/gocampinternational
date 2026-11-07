import { getCloudflare } from "../lib/cloudflare-context";
import type { Route } from "./+types/landing";
import { submitInquiry } from "../lib/inquiries.server";
import { originFrom, seoMeta } from "../lib/seo";
import { LandingPage } from "../features/landing/LandingPage";
import "../landing.css";
import { publicSeo } from "../lib/public-content";

export function meta({ matches }: Route.MetaArgs) {
  const seo = publicSeo(matches, "landing");
  return seoMeta({
    origin: originFrom(matches),
    path: "/landing",
    ...seo,
    robots: "noindex,nofollow"
  });
}

export const links: Route.LinksFunction = () => [
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&family=Inter:wght@300;400;500;600&display=swap"
  }
];

export function action({ request, context }: Route.ActionArgs) {
  return submitInquiry(request, getCloudflare(context).env.DB, "lead", true);
}

export default function Landing() {
  return <LandingPage />;
}
