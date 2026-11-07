type MatchLike = { id?: string; loaderData?: unknown };

const DEFAULT_ORIGIN = "https://gocampinternational.net";
const DEFAULT_IMAGE = "/images/banner.webp";

function safeImageReference(value: unknown) {
  const raw = cleanSeoText(value);
  if (!raw || raw.startsWith("//") || /[\\\\\u0000-\u001f\u007f]/u.test(raw)) return DEFAULT_IMAGE;
  if (raw.startsWith("/")) return raw;
  if (!/^https:\/\//i.test(raw)) return DEFAULT_IMAGE;
  try {
    const image = new URL(raw);
    return image.protocol === "https:" && !image.username && !image.password
      ? image.href
      : DEFAULT_IMAGE;
  } catch {
    return DEFAULT_IMAGE;
  }
}

function safeImageUrl(value: unknown, origin: string) {
  const image = safeImageReference(value);
  const fallback = new URL(DEFAULT_IMAGE, origin).href;
  try {
    const resolved = new URL(image, origin);
    if (image.startsWith("/") && resolved.origin !== new URL(origin).origin) return fallback;
    return resolved.protocol === "https:" ? resolved.href : fallback;
  } catch {
    return fallback;
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function originFrom(matches: readonly (MatchLike | undefined)[] | undefined) {
  const data = matches?.find((match) => match?.id === "root")?.loaderData as
    { origin?: string } | undefined;
  return data?.origin || "";
}

export function indexingAllowedFrom(matches: readonly (MatchLike | undefined)[] | undefined) {
  const data = matches?.find((match) => match?.id === "root")?.loaderData as
    { seoIndexingAllowed?: boolean } | undefined;
  return data?.seoIndexingAllowed === true;
}

export function robotsFromMatches(
  matches: readonly (MatchLike | undefined)[] | undefined,
  forceNoindex = false
) {
  if (!indexingAllowedFrom(matches)) return "noindex,nofollow";
  return forceNoindex ? "noindex,follow" : undefined;
}

export function safeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function cleanSeoText(value: unknown) {
  return String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function truncateSeoDescription(value: unknown, maxLength = 160) {
  const text = cleanSeoText(value);
  if (text.length <= maxLength) return text;
  const prefix = text.slice(0, Math.max(1, maxLength - 1));
  const wordBoundary = prefix.lastIndexOf(" ");
  const readable =
    wordBoundary >= Math.floor(maxLength * 0.65) ? prefix.slice(0, wordBoundary) : prefix;
  return readable.trimEnd() + "…";
}

export type CatalogSeo = {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  noindex: boolean;
  structuredDataEnabled: boolean;
};

export function resolveCatalogSeo(
  kind: "destination" | "category",
  name: unknown,
  fallbackDescription: unknown,
  fallbackImage: unknown,
  value: unknown
): CatalogSeo {
  const seo = asRecord(value);
  const cleanName = cleanSeoText(name) || (kind === "destination" ? "Destination" : "Programs");
  const ogImageId = typeof seo.og_image_id === "string" ? seo.og_image_id : "";
  const image = /^[a-zA-Z0-9_-]{1,160}$/.test(ogImageId)
    ? `/media/${ogImageId}`
    : safeImageReference(fallbackImage);

  return {
    title:
      cleanSeoText(seo.title) ||
      (kind === "destination"
        ? `${cleanName} Camps & Programs | Go Camp International`
        : `${cleanName} | Go Camp International`),
    description: cleanSeoText(seo.description) || cleanSeoText(fallbackDescription),
    image,
    imageAlt: cleanSeoText(seo.og_image_alt) || cleanName,
    noindex: seo.noindex === true,
    structuredDataEnabled: seo.structured_data_enabled !== false
  };
}

export function seoMeta({
  title,
  description,
  path,
  origin,
  image = DEFAULT_IMAGE,
  imageAlt,
  robots,
  siteName = "Go Camp International"
}: {
  title: string;
  description: string;
  path: string;
  origin: string;
  image?: string;
  imageAlt?: string;
  robots?: string;
  siteName?: string;
}) {
  const base = origin || DEFAULT_ORIGIN;
  const canonicalUrl = new URL(path, base);
  const safeCanonical =
    canonicalUrl.origin === new URL(base).origin ? canonicalUrl.href : new URL("/", base).href;
  const imageUrl = safeImageUrl(image, base);
  const safeTitle = cleanSeoText(title) || siteName;
  const summary = truncateSeoDescription(description);
  const safeImageAlt = cleanSeoText(imageAlt) || safeTitle;

  return [
    { title: safeTitle },
    { name: "description", content: summary },
    { tagName: "link", rel: "canonical", href: safeCanonical },
    { property: "og:title", content: safeTitle },
    { property: "og:description", content: summary },
    { property: "og:image", content: imageUrl },
    { property: "og:image:alt", content: safeImageAlt },
    { property: "og:url", content: safeCanonical },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: siteName },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:image", content: imageUrl },
    { name: "twitter:title", content: safeTitle },
    { name: "twitter:description", content: summary },
    ...(robots ? [{ name: "robots", content: robots }] : [])
  ];
}
