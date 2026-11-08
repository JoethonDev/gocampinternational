type FounderPortraitProps = {
  src: string;
  name: string;
  title: string;
  headingId?: string;
  compact?: boolean;
  dark?: boolean;
};

import "./founder-portrait.css";

/** One accessible, consistently styled founder portrait across About and Contact. */
export function FounderPortrait({
  src,
  name,
  title,
  headingId,
  compact = false,
  dark = false
}: FounderPortraitProps) {
  const classes = [
    "gc-founder-portrait mx-auto mb-0",
    compact ? "gc-founder-portrait--compact" : "",
    dark ? "gc-founder-portrait--dark" : ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <figure className={classes}>
      <img
        src={src}
        alt={name}
        className="gc-founder-portrait__image img-fluid d-block shadow-sm"
        loading="lazy"
        decoding="async"
      />
      <figcaption className="gc-founder-portrait__caption text-center">
        <h3 id={headingId} className="gc-founder-portrait__name h5 fw-bold mb-1">
          {name}
        </h3>
        <p className="gc-founder-portrait__title fw-semibold mb-0">{title}</p>
      </figcaption>
    </figure>
  );
}
