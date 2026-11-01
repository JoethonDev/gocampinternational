import { TestimonialCard } from "../../components/TestimonialCard";
import type { TestimonialsDocument } from "../../lib/domain";
import "./testimonials.css";

export function TestimonialsSection({ data }: { data: TestimonialsDocument | null | undefined }) {
  const items = (data?.items || []).filter(
    (item) => item?.is_active !== false && item?.name && item?.quote
  );
  if (!items.length) return null;
  return (
    <section className="section-padding testimonials-section" aria-labelledby="testimonials-title">
      <div className="container-fluid testimonials-heading-wrap">
        <div className="testimonials-heading">
          <h2 id="testimonials-title" className="section-title mb-2">
            {data?.title || "What Families Say"}
          </h2>
          <span className="testimonials-kicker">Families who travelled with us</span>
          {data?.intro && <p className="testimonials-intro">{data.intro}</p>}
        </div>
      </div>
      <div
        className="testimonials-marquee"
        aria-label="Family testimonials"
        aria-live="off"
        role="region"
      >
        <div className="testimonials-track">
          <div className="testimonials-set">
            {items.map((item, index) => (
              <TestimonialCard key={`${item.name}-${index}`} item={item} />
            ))}
          </div>
          <div className="testimonials-set" aria-hidden="true">
            {items.map((item, index) => (
              <TestimonialCard key={`duplicate-${item.name}-${index}`} item={item} duplicate />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
