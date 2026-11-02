import type { Route } from "./+types/faq";
import { FaqPage } from "../features/faq/FaqPage";
import { loadDocument } from "../lib/catalog.server";
import type { FaqItem } from "../lib/domain";
import { originFrom, seoMeta, safeJsonLd } from "../lib/seo";

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
  const questions = Array.isArray(loaderData.items) ? loaderData.items : [];
  const entities = questions
    .map((item) => ({
      "@type": "Question",
      name: String(item.question || item.q || "")
        .replace(/<[^>]*>/g, "")
        .trim(),
      acceptedAnswer: {
        "@type": "Answer",
        text: String(item.answer || item.a || "")
          .replace(/<[^>]*>/g, " ")
          .trim()
      }
    }))
    .filter((item) => item.name && item.acceptedAnswer.text);
  return (
    <>
      {entities.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: safeJsonLd({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: entities
            })
          }}
        />
      )}
      <FaqPage items={loaderData.items} />
    </>
  );
}
