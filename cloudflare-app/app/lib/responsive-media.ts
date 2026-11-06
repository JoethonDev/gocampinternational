/**
 * Responsive URLs point only to permanent R2 variants.
 * Original image URLs remain the fallback when a variant is not yet generated.
 */
export const IMAGE_PRESETS = ["mobile", "tablet", "desktop"] as const;
export type ImagePreset = (typeof IMAGE_PRESETS)[number];
export const isImagePreset = (value: string | null): value is ImagePreset =>
  IMAGE_PRESETS.some((preset) => preset === value);

export function responsiveUrl(source: string, preset: ImagePreset): string {
  const suffix = preset === "desktop" ? "&v=ai4k-20261101" : "";
  return source + (source.includes("?") ? "&" : "?") + "variant=" + preset + suffix;
}

function supportsVariants(source: string): boolean {
  return (
    source.startsWith("/images/") ||
    source.startsWith("/uploads/") ||
    /^\/media\/[a-f0-9-]{36}(?:\?|$)/i.test(source)
  );
}

export function responsiveSrcSet(source: string | null | undefined): string | undefined {
  if (!source || !supportsVariants(source)) return undefined;
  return [
    `${responsiveUrl(source, "mobile")} 480w`,
    `${responsiveUrl(source, "tablet")} 960w`,
    `${responsiveUrl(source, "desktop")} 1600w`
  ].join(", ");
}
