import type { DocumentItem } from "./shared";
import { asDocument, asVisibleBoolean } from "./shared";

const SECTIONS: Record<string, string[]> = {
  home: ["hero", "intro", "destinations", "featured_categories", "testimonials"],
  destination: [
    "hero",
    "intro",
    "highlights",
    "stats",
    "programs",
    "gallery",
    "destination_gallery",
    "faq",
    "testimonials"
  ],
  category: ["hero", "intro", "sections", "programs", "gallery", "testimonials"],
  program: [
    "card_image",
    "card_tagline",
    "card_highlights",
    "modal_details",
    "modal_description",
    "modal_highlights",
    "modal_schedule",
    "modal_gallery",
    "modal_includes",
    "modal_excludes"
  ]
};

const DEFAULTS: Record<string, Record<string, boolean>> = {
  home: {
    hero: true,
    intro: true,
    destinations: true,
    featured_categories: true,
    testimonials: true
  },
  destination: {
    hero: true,
    intro: true,
    highlights: true,
    stats: true,
    programs: true,
    gallery: false,
    destination_gallery: false,
    faq: true,
    testimonials: true
  },
  category: {
    hero: true,
    intro: false,
    sections: false,
    programs: true,
    gallery: false,
    testimonials: true
  },
  program: {
    card_image: true,
    card_tagline: true,
    card_highlights: true,
    modal_details: true,
    modal_description: true,
    modal_highlights: true,
    modal_schedule: true,
    modal_gallery: false,
    modal_includes: false,
    modal_excludes: false
  }
};

export function SiteSettingsEditor({
  value,
  onChange
}: {
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  const document = asDocument(value);
  const globals = asDocument(document.global_visibility);
  const homeVisibility = asDocument(document.section_visibility);

  const toggle = (entity: string, key: string, checked: boolean) => {
    const current = entity === "home" ? homeVisibility : asDocument(globals[entity]);
    const next: DocumentItem = {
      ...document,
      [entity === "home" ? "section_visibility" : "global_visibility"]:
        entity === "home"
          ? { ...homeVisibility, [key]: checked }
          : { ...globals, [entity]: { ...current, [key]: checked } }
    };
    if (entity === "home") {
      next.global_visibility = {
        ...globals,
        home: { ...current, [key]: checked }
      };
    }
    onChange(next);
  };

  return (
    <>
      <p className="small text-secondary">
        Global toggles affect every matching page unless that record has an explicit override.
        Hidden gallery sections remain disabled by the migration's site policy.
      </p>
      {Object.entries(SECTIONS).map(([entity, keys]) => (
        <section className="mb-4" key={entity}>
          <h2 className="h5 text-capitalize border-bottom pb-2">
            {entity === "home" ? "Homepage" : `${entity} pages`}
          </h2>
          <div className="row g-2">
            {keys.map((key) => {
              const current = entity === "home" ? homeVisibility : asDocument(globals[entity]);
              const checked = Object.hasOwn(current, key)
                ? asVisibleBoolean(current[key])
                : (DEFAULTS[entity]?.[key] ?? true);
              const galleryDisabled =
                (entity === "destination" || entity === "category") && key.includes("gallery");
              return (
                <div className="col-sm-6 col-lg-4" key={key}>
                  <label
                    className="d-flex align-items-center gap-3 border rounded-3 p-3 h-100"
                    style={{
                      cursor: galleryDisabled ? "not-allowed" : "pointer",
                      opacity: galleryDisabled ? 0.65 : 1
                    }}
                  >
                    <input
                      type="checkbox"
                      className="form-check-input mt-0"
                      checked={galleryDisabled ? false : checked}
                      disabled={galleryDisabled}
                      onChange={(event) => toggle(entity, key, event.target.checked)}
                    />
                    <span className="text-capitalize">{key.replaceAll("_", " ")}</span>
                  </label>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}
