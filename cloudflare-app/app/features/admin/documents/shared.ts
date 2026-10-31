export type DocumentKey = "site_settings" | "faq" | "camp_memories";
export type DocumentItem = Record<string, unknown>;

export const asDocument = (value: unknown): DocumentItem =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as DocumentItem)
    : {};

export const asDocumentArray = (value: unknown): DocumentItem[] =>
  Array.isArray(value) ? (value as DocumentItem[]) : [];

export const asDocumentText = (value: unknown) => (typeof value === "string" ? value : "");

export const asVisibleBoolean = (value: unknown) =>
  value === true || value === 1 || value === "1" || value === "true";
