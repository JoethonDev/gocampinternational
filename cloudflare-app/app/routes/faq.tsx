import { getCloudflare } from "../lib/cloudflare-context";
import type { Route } from "./+types/faq";
import { FaqPage } from "../features/faq/FaqPage";
import { loadPublishedDocument } from "../lib/editorial-publish.server";
import type { FaqItem } from "../lib/domain";
import { cleanSeoText, originFrom, safeJsonLd, seoMeta } from "../lib/seo";
import { publicSeo } from "../lib/public-content";
import { useRouteLoaderData } from "react-router";
import type { PublicContent } from "../lib/public-content";

export async function loader({ context }: Route.LoaderArgs) {
  return {
    items: (await loadPublishedDocument<FaqItem[]>(getCloudflare(context).env, "faq")) || []
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
  const root = useRouteLoaderData("root") as { publicContent?: PublicContent } | undefined;
  const showQuestions = root?.publicContent?.faq?.["show-questions"] !== false;
  const questions = loaderData.items
    .map((item) => ({
      question: cleanSeoText(item.question || item.q),
      answer: cleanSeoText(item.answer || item.a)
    }))
    .filter((item) => item.question && item.answer);

  return (
    <>
      {showQuestions && questions.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: safeJsonLd({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: questions.map(({ question, answer }) => ({
                "@type": "Question",
                name: question,
                acceptedAnswer: { "@type": "Answer", text: answer }
              }))
            })
          }}
        />
      )}
      <FaqPage items={loaderData.items} />
    </>
  );
}
