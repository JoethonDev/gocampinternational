import { FaqAccordion } from "../../components/FaqAccordion";
import { PageBanner } from "../../components/ui/PageBanner";
import { Breadcrumbs } from "../../components/ui/Breadcrumbs";
import { SITE } from "../../config/site";
import type { FaqItem } from "../../lib/domain";

export function FaqPage({ items }: { items: FaqItem[] }) {
  return (
    <>
      <PageBanner image={SITE.images.faqBanner} alt="FAQ Banner" title="FAQ" />
      <div className="container py-5">
        <Breadcrumbs items={[{ label: "HOME", to: "/" }, { label: "FAQ" }]} />
        {items.length > 0 ? (
          <FaqAccordion items={items} title="Frequently Asked Questions" />
        ) : (
          <p className="alert alert-info">
            No FAQs available at the moment. Please check back later.
          </p>
        )}
      </div>
    </>
  );
}
