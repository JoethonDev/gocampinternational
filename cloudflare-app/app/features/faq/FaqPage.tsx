import { usePublicContent } from "../../lib/public-content-react";
import { FaqAccordion } from "../../components/FaqAccordion";
import { PageBanner } from "../../components/ui/PageBanner";
import { Breadcrumbs } from "../../components/ui/Breadcrumbs";
import type { FaqItem } from "../../lib/domain";

export function FaqPage({ items }: { items: FaqItem[] }) {
  const { text, site: SITE, visible } = usePublicContent("faq");
  return (
    <>
      {visible("show-banner") && (
        <PageBanner
          image={SITE.images.faqBanner}
          alt={text("alt-faq-banner")}
          title={text("title-faq")}
        />
      )}
      <div className="container py-5">
        <Breadcrumbs items={[{ label: text("home"), to: "/" }, { label: text("faq") }]} />
        {visible("show-questions") &&
          (items.length > 0 ? (
            <FaqAccordion items={items} title={text("title-frequently-asked-questions")} />
          ) : (
            <p className="alert alert-info">
              {text("no-faqs-available-at-the-moment-please-check-back-later")}
            </p>
          ))}
      </div>
    </>
  );
}
