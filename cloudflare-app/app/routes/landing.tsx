import type { Route } from "./+types/landing";
import { submitInquiry } from "../lib/inquiries.server";
import { originFrom, seoMeta } from "../lib/seo";
import { LandingPage } from "../features/landing/LandingPage";
import "../landing.css";

export function meta({ matches }: Route.MetaArgs) {
  return seoMeta({
    origin: originFrom(matches),
    path: "/landing",
    robots: "noindex,nofollow",
    title: "Transform Your Teen's Future - International Summer Programs | Go Camp",
    description:
      "Elite international summer camps for ambitious teens. Sports academies, language immersion, leadership programs."
  });
}

export const links: Route.LinksFunction = () => [
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&family=Inter:wght@300;400;500;600&display=swap"
  }
];

export function action({ request, context }: Route.ActionArgs) {
  return submitInquiry(request, context.cloudflare.env.DB, "lead", true);
}

export default function Landing() {
  return <LandingPage />;
}
