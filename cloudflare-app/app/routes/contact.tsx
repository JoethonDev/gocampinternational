import type { Route } from "./+types/contact";
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

export default function Contact() {
  return <ContactPage />;
}
