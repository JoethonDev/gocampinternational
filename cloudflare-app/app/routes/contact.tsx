import type { Route } from "./+types/contact";
import { ContactPage } from "../features/contact/ContactPage";
import { originFrom, seoMeta } from "../lib/seo";

export function meta({ matches }: Route.MetaArgs) {
  return seoMeta({
    origin: originFrom(matches),
    path: "/contact",
    title: "Go Camp :: Contact Us",
    description:
      "Get in touch with Go Camp. Contact us via phone, email, or our online form for any inquiries about our programs."
  });
}

export default function Contact() {
  return <ContactPage />;
}
