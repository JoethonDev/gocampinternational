import type { CSSProperties } from "react";
/**
 * Responsive URLs point only to permanent R2 variants.
 * Original image URLs remain the fallback when a variant is not yet generated.
 */
export type ImagePreset = "mobile" | "tablet" | "desktop";

export function responsiveUrl(source: string, preset: ImagePreset): string {
  const suffix = preset === "desktop" ? "&v=ai4k-20261101" : "";
  return source + (source.includes("?") ? "&" : "?") + "variant=" + preset + suffix;
}

function supportsVariants(source: string): boolean {
  return source.startsWith("/images/") ||
    source.startsWith("/uploads/") ||
    /^\/media\/[a-f0-9-]{36}(?:\?|$)/i.test(source);
}

export function responsiveSrcSet(source: string | null | undefined): string | undefined {
  if (!source || !supportsVariants(source)) return undefined;
  return [
    `${responsiveUrl(source, "mobile")} 480w`,
    `${responsiveUrl(source, "tablet")} 960w`,
    `${responsiveUrl(source, "desktop")} 1600w`
  ].join(", ");
}

/** Exposes CSS variables for real viewport-based hero media selection. */
export function heroImageStyles(source: string): CSSProperties {
  if (!supportsVariants(source)) {
    const fallback = `url(${JSON.stringify(source)})`;
    return {
      "--gc-image-mobile": fallback,
      "--gc-image-tablet": fallback,
      "--gc-image-desktop": fallback,
      backgroundImage: fallback
    } as CSSProperties;
  }
  return {
    "--gc-image-mobile": `url(${JSON.stringify(responsiveUrl(source, "mobile"))})`,
    "--gc-image-tablet": `url(${JSON.stringify(responsiveUrl(source, "tablet"))})`,
    "--gc-image-desktop": `url(${JSON.stringify(responsiveUrl(source, "desktop"))})`,
    backgroundImage: `url(${JSON.stringify(source)})`
  } as CSSProperties;
}
