type MatchLike = { id?: string; data?: unknown };
export function originFrom(matches: readonly (MatchLike | undefined)[] | undefined) {
  const data = matches?.find((match) => match?.id === "root")?.data as
    { origin?: string } | undefined;
  return data?.origin || "";
}
export function safeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
export function seoMeta({
  title, description, path, origin, image = "/images/banner.webp", robots
}: {
  title: string; description: string; path: string; origin: string;
  image?: string; robots?: string;
}) {
  const canonical = new URL(path, origin || "https://gocampinternational.net").href;
  const imageUrl = new URL(image, origin || "https://gocampinternational.net").href;
  const summary = description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160);
  return [
    { title },
    { name: "description", content: summary },
    { tagName: "link", rel: "canonical", href: canonical },
    { property: "og:title", content: title },
    { property: "og:description", content: summary },
    { property: "og:image", content: imageUrl },
    { property: "og:image:alt", content: title },
    { property: "og:url", content: canonical },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: "Go Camp International" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:image", content: imageUrl },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: summary },
    ...(robots ? [{ name: "robots", content: robots }] : [])
  ];
}
