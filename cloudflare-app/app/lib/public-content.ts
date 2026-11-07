import { PUBLIC_CONTENT_FIELDS } from "../config/public-content-fields";
import { SITE, HOME_COPY, HOME_HERO_SLIDES } from "../config/site";
import { robotsFromMatches } from "./seo";

export type PublicContent = Record<string, Record<string, string | boolean>>;
export type PublicSite = {
  [K in keyof typeof SITE]: (typeof SITE)[K] extends string
    ? string
    : { [P in keyof (typeof SITE)[K]]: string };
};

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function isContentUrl(value: string, image = false, externalOnly = false): boolean {
  if (!value || value !== value.trim() || /[\s\\\u0000-\u001f\u007f]/u.test(value)) return false;
  if (externalOnly) return validHttpsUrl(value);
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  if (!image && /^#[a-zA-Z][\w-]*$/.test(value)) return true;
  if (/^https:/i.test(value)) return validHttpsUrl(value);
  try {
    const url = new URL(value);
    return !image && /^(mailto:|tel:)/.test(value) && !!url.pathname;
  } catch {
    return false;
  }
}

function validHttpsUrl(value: string) {
  if (!/^https:\/\/[^/\\?#@]/i.test(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !!url.hostname && !url.username && !url.password;
  } catch {
    return false;
  }
}

function valid(
  value: unknown,
  field: { kind: string; value: string | boolean },
  group?: string,
  key?: string
): boolean {
  if (field.kind === "visibility") return typeof value === "boolean";
  if (typeof value !== "string" || value.length > 5000) return false;
  if (group === "seo" && field.kind === "text") {
    const limit = key?.endsWith("-title") ? 160 : 320;
    if (value.length > limit || /[<>]/.test(value)) return false;
  }
  if (!value) return field.kind !== "image";
  return (
    field.kind === "text" || isContentUrl(value, field.kind === "image", field.kind === "external")
  );
}

// Normalizing on the server also protects rendering from older/manual D1 edits.
export function readPublicContent(value: unknown): PublicContent {
  const input = record(value);
  return Object.fromEntries(
    Object.entries(PUBLIC_CONTENT_FIELDS).map(([group, fields]) => {
      const overrides = record(input[group]);
      return [
        group,
        Object.fromEntries(
          Object.entries(fields).map(([key, field]) => [
            key,
            valid(overrides[key], field, group, key) ? overrides[key] : field.value
          ])
        )
      ];
    })
  ) as PublicContent;
}

export function validatePublicContent(value: unknown): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "Invalid public content";
  for (const [group, entries] of Object.entries(record(value))) {
    const fields = PUBLIC_CONTENT_FIELDS[group];
    if (
      !Object.hasOwn(PUBLIC_CONTENT_FIELDS, group) ||
      !fields ||
      !entries ||
      typeof entries !== "object" ||
      Array.isArray(entries)
    ) {
      return `Invalid content group: ${group}`;
    }
    for (const [key, entry] of Object.entries(record(entries))) {
      if (!Object.hasOwn(fields, key) || !valid(entry, fields[key], group, key))
        return `Invalid content field: ${group}.${key}`;
    }
  }
  return null;
}

export const DEFAULT_PUBLIC_CONTENT = readPublicContent(undefined);

export function contentText(content: PublicContent, group: string, key: string): string {
  const value = content[group]?.[key];
  return typeof value === "string"
    ? value
    : String(PUBLIC_CONTENT_FIELDS[group]?.[key]?.value ?? "");
}

export function publicSite(content: PublicContent): PublicSite {
  const text = (key: string) => contentText(content, "site", key);
  return Object.fromEntries(
    Object.entries(SITE).map(([key, value]) => [
      key,
      typeof value === "string"
        ? text(key)
        : Object.fromEntries(Object.keys(value).map((k) => [k, text(`${key}.${k}`)]))
    ])
  ) as PublicSite;
}

export function publicHome(content: PublicContent) {
  return Object.fromEntries(
    Object.keys(HOME_COPY).map((key) => [key, contentText(content, "home", key)])
  ) as Record<keyof typeof HOME_COPY, string>;
}

export function publicSlides(content: PublicContent) {
  return HOME_HERO_SLIDES.map((_, index) => ({
    title: contentText(content, "home", `slides.${index}.title`),
    image: contentText(content, "home", `slides.${index}.image`)
  }));
}

export function publicContentFromMatches(
  matches: readonly ({ id?: string; loaderData?: unknown } | undefined)[] | undefined
): PublicContent {
  const root = record(matches?.find((match) => match?.id === "root")?.loaderData);
  return (root.publicContent as PublicContent | undefined) || DEFAULT_PUBLIC_CONTENT;
}

export function publicSeo(
  matches: readonly ({ id?: string; loaderData?: unknown } | undefined)[] | undefined,
  page: string
) {
  const content = publicContentFromMatches(matches);
  const titleKey = `${page}-title`;
  const descriptionKey = `${page}-description`;
  const imageKey = `${page}-image`;
  const defaults = PUBLIC_CONTENT_FIELDS.seo;
  const title = contentText(content, "seo", titleKey).trim();
  const description = contentText(content, "seo", descriptionKey).trim();
  const image = contentText(content, "seo", imageKey).trim();
  return {
    title: title || String(defaults?.[titleKey]?.value || "Go Camp International"),
    description: description || String(defaults?.[descriptionKey]?.value || ""),
    image: image || String(defaults?.[imageKey]?.value || "/images/banner.webp"),
    siteName: publicSite(content).name,
    robots: robotsFromMatches(matches)
  };
}
