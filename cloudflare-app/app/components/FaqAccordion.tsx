import { Link } from "react-router";
import { SafeRichText } from "./SafeRichText";
import { faqAnswer, faqQuestion, type FaqItem } from "../lib/domain";

export function FaqAccordion({
  items,
  title,
  accordionId = "faqAccordion"
}: {
  items: FaqItem[];
  title: string;
  accordionId?: string;
}) {
  return (
    <div className="row g-5">
      <div className="col-12">
        <div className="text-center mb-5">
          <h2 className="section-title">{title}</h2>
        </div>
        {items.length > 0 ? (
          <div className="accordion" id={accordionId}>
            {items.map((item, index) => {
              const itemId = `${accordionId}-${index}`;
              return (
                <div key={itemId} className="accordion-item border-0 mb-3 shadow-sm">
                  <h3 className="accordion-header">
                    <button
                      className={"accordion-button fw-bold" + (index === 0 ? "" : " collapsed")}
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target={`#${itemId}`}
                      aria-expanded={index === 0}
                    >
                      {faqQuestion(item)}
                    </button>
                  </h3>
                  <div
                    className={"accordion-collapse collapse" + (index === 0 ? " show" : "")}
                    id={itemId}
                    data-bs-parent={`#${accordionId}`}
                  >
                    <div className="accordion-body">
                      <SafeRichText html={faqAnswer(item)} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center">No FAQs to display at this time.</p>
        )}
        <div className="text-center mt-5">
          <p className="text-muted mb-3">Still have questions?</p>
          <Link to="/contact" className="btn btn-warning btn-lg">
            <i className="bi bi-envelope-fill me-2" />
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}
