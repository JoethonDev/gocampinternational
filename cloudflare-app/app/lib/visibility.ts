/** Direct port of includes/section-visibility.php from PR40. */
type Entity = "home" | "destination" | "category" | "program";
const DEFAULTS: Record<Entity, Record<string, boolean>> = {
  home: {hero:true,intro:true,destinations:true,featured_categories:true,testimonials:true},
  destination: {hero:true,intro:true,highlights:true,stats:true,programs:true,gallery:false,destination_gallery:false,faq:true,testimonials:true},
  category: {hero:true,intro:false,sections:false,programs:true,gallery:false,testimonials:true},
  program: {card_image:true,card_tagline:true,card_highlights:true,modal_details:true,modal_description:true,modal_highlights:true,modal_schedule:true,modal_gallery:false,modal_includes:false,modal_excludes:false}
};
const record = (value: unknown): Record<string,unknown> | null =>
  value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string,unknown> : null;
const toBool = (v: unknown) => v === true || v === 1 || (typeof v === "string" && ["1","true","yes","on"].includes(v.toLowerCase()));
export function isVisible(entity: Entity, key: string, item: Record<string,unknown>, settings: Record<string,unknown> = {}): boolean {
  if ((entity === "destination" && (key === "gallery" || key === "destination_gallery")) ||
      (entity === "category" && key === "gallery")) return false;
  if (entity === "program" && key === "modal_gallery") {
    if (item.id !== "uk-soccer-club-experience" || !Array.isArray(item.gallery) || item.gallery.length === 0) return false;
  }
  const fallback = DEFAULTS[entity][key] ?? true;
  const global = record(record(settings.global_visibility)?.[entity]);
  const globalValue = global && Object.hasOwn(global,key) ? toBool(global[key]) : fallback;
  if (Object.hasOwn(item,"visibility_overrides")) {
    const overrides = record(item.visibility_overrides);
    return overrides && Object.hasOwn(overrides,key) ? toBool(overrides[key]) : globalValue;
  }
  const legacy = record(item.section_visibility);
  if (legacy && Object.hasOwn(legacy,key)) {
    const explicit = toBool(legacy[key]);
    if (explicit !== fallback) return explicit;
  }
  return globalValue;
}
