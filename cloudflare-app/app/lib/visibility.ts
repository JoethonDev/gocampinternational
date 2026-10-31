import { asBoolean, asRecord, type SiteSettings } from "./domain";

type Entity = "home" | "destination" | "category" | "program";

const DEFAULTS: Record<Entity, Record<string, boolean>> = {
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

const policyHidesGallery = (entity: Entity, key: string) =>
  (entity === "destination" && (key === "gallery" || key === "destination_gallery")) ||
  (entity === "category" && key === "gallery");

const policyHidesProgramGallery = (item: Record<string, unknown>, key: string) => {
  if (key !== "modal_gallery") return false;
  return (
    item.id !== "uk-soccer-club-experience" ||
    !Array.isArray(item.gallery) ||
    item.gallery.length === 0
  );
};

export function isVisible(
  entity: Entity,
  key: string,
  item: Record<string, unknown>,
  settings: SiteSettings = {}
): boolean {
  if (policyHidesGallery(entity, key)) return false;
  if (entity === "program" && policyHidesProgramGallery(item, key)) return false;

  const fallback = DEFAULTS[entity][key] ?? true;

  // PHP stores homepage switches under site_settings.section_visibility; the
  // newer admin panel also mirrors them into global_visibility.home.
  if (entity === "home") {
    const home = asRecord(settings.section_visibility);
    if (home && Object.hasOwn(home, key)) return asBoolean(home[key], fallback);
  }

  const global = asRecord(asRecord(settings.global_visibility)?.[entity]);
  const globalValue =
    global && Object.hasOwn(global, key) ? asBoolean(global[key], fallback) : fallback;

  const overrides = asRecord(item.visibility_overrides);
  if (overrides && Object.hasOwn(overrides, key)) {
    return asBoolean(overrides[key], globalValue);
  }

  const legacy = asRecord(item.section_visibility);
  if (legacy && Object.hasOwn(legacy, key)) {
    return asBoolean(legacy[key], fallback);
  }

  return globalValue;
}
