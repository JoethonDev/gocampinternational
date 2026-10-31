export type JsonObject = Record<string, unknown>;
export type CatalogKind = "program" | "destination" | "category";
export type CatalogStatus = "active" | "inactive" | "coming-soon" | "trash";
export type VisibilityValue = boolean | "inherit" | "1" | "0";
export type VisibilityMap = Record<string, VisibilityValue>;

export interface CatalogRecord extends JsonObject {
  slug: string;
  name: string;
  status: string;
  id?: string;
  banner?: string;
  image?: string;
  tagline?: string;
  intro?: string;
  intro_image?: string;
  intro_text?: string;
  category_slug?: string;
  color?: string;
  gallery?: string[];
  section_visibility?: VisibilityMap;
  visibility_overrides?: Record<string, boolean>;
}

export interface Ages {
  min?: number | null;
  max?: number | null;
}

export interface ProgramRecord extends CatalogRecord {
  ages?: Ages;
  badges?: string[];
  highlights?: string[];
  includes?: string[];
  excludes?: string[];
  schedule?: Record<string, string> | unknown[];
  duration?: number | null;
  level?: string;
  price?: string | null;
  order?: number | null;
}

export interface DestinationHighlight {
  icon?: string;
  text?: string;
}

export interface DestinationStat {
  number?: string | number;
  suffix?: string;
  label?: string;
  icon?: string;
}

export interface DestinationRecord extends CatalogRecord {
  program_ids?: string[];
  highlights?: DestinationHighlight[];
  stats?: DestinationStat[];
  faq?: FaqItem[];
}

export interface CategorySection {
  title?: string;
  content?: string;
  image?: string;
  is_active?: boolean;
}

export interface CategoryRecord extends CatalogRecord {
  sections?: CategorySection[];
}

export interface FaqItem {
  question?: string;
  answer?: string;
  q?: string;
  a?: string;
}

export const faqQuestion = (item: FaqItem) => item.question || item.q || "No question provided.";

export const faqAnswer = (item: FaqItem) => item.answer || item.a || "No answer provided.";

export interface MemoryItem {
  image: string;
  caption: string;
  country: string;
  is_active: boolean;
  in_slider: boolean;
}

export interface MemoriesDocument {
  title: string;
  show_facebook?: boolean;
  items: MemoryItem[];
}

export interface SiteSettings extends JsonObject {
  section_visibility?: Record<string, boolean | string>;
  global_visibility?: Record<string, Record<string, boolean>>;
}

export interface MediaAsset {
  id: string;
  display_name: string;
  mime_type: string;
  bytes: number;
  is_public: number;
  created_at: number;
}

export interface InquiryRecord {
  id: string;
  kind: "contact" | "lead" | "newsletter";
  name: string;
  email: string;
  phone: string;
  status: string;
  content_json: string;
  created_at: number;
}

export const asRecord = (value: unknown): JsonObject | null =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : null;

export const asArray = <T = unknown>(value: unknown): T[] =>
  Array.isArray(value) ? (value as T[]) : [];

export const asString = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : fallback;

export const asStringArray = (value: unknown): string[] =>
  asArray(value).filter((entry): entry is string => typeof entry === "string");

export const asNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value)))
    return Number(value);
  return null;
};

export const asBoolean = (value: unknown, fallback = false): boolean => {
  if (typeof value === "boolean") return value;
  if (value === 1 || value === "1" || value === "true") return true;
  if (value === 0 || value === "0" || value === "false") return false;
  return fallback;
};
