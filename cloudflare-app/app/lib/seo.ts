type MatchLike = { id?: string; data?: unknown };
export function originFrom(matches: readonly (MatchLike | undefined)[] | undefined) {
  const data = matches?.find((match) => match?.id === "root")?.data as
    { origin?: string } | undefined;
  return data?.origin || "";
}
export function seoMeta({
  title,
  description,
  path,
  origin,
  image = "/images/logo.webp",
  robots
}: {
  title: string;
  description: string;
  path: string;
  origin: string;
  image?: string;
  robots?: string;
}) {
  const canonical = origin + path;
  return [
    { title },
    { name: "description", content: description },
    { tagName: "link", rel: "canonical", href: canonical },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: origin + image },
    { property: "og:url", content: canonical },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: "Go Camp International" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    ...(robots ? [{ name: "robots", content: robots }] : [])
  ];
}
