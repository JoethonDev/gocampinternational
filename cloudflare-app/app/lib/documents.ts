export const DOCUMENT_KEYS = ["site_settings", "faq", "camp_memories", "testimonials"] as const;

export type DocumentKey = (typeof DOCUMENT_KEYS)[number];

export function isDocumentKey(value: string): value is DocumentKey {
  return (DOCUMENT_KEYS as readonly string[]).includes(value);
}
