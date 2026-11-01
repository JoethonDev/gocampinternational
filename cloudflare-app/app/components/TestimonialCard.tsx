import { SafeRichText } from "./SafeRichText";
import { FlagIcon } from "./ui/FlagIcon";
import type { TestimonialItem } from "../lib/domain";

export function TestimonialCard({
  item,
  duplicate = false
}: {
  item: TestimonialItem;
  duplicate?: boolean;
}) {
  return (
    <blockquote className="testimonial-card" aria-hidden={duplicate || undefined}>
      <span className="testimonial-mark" aria-hidden="true">
        “
      </span>
      <div className="testimonial-quote">
        <SafeRichText html={item.quote} />
      </div>
      <footer className="testimonial-person">
        <span className="testimonial-name">{item.name}</span>
        {item.flag && <FlagIcon value={item.flag} />}
      </footer>
    </blockquote>
  );
}
