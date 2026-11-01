/**
 * Generate srcset URLs for permanent R2 variants. The Worker serves these
 * using a stable variant query parameter and falls back to the original
 * until the staging optimizer has completed that image.
 */
export function responsiveUrl(source: string, preset: "mobile" | "tablet" | "desktop"): string {
  return source + (source.includes("?") ? "&" : "?") + "variant=" + preset;
}

export function responsiveSrcSet(source: string | null | undefined): string | undefined {
  if (!source || !/^(?:\\/(?:images|uploads)\\/|\\/media\\/[a-f0-9-]{36}(?:\\?|$))/i.test(source)) {
    return undefined;
  }
  return [
    `${responsiveUrl(source, "mobile")} 480w`,
    `${responsiveUrl(source, "tablet")} 960w`,
    `${responsiveUrl(source, "desktop")} 1600w`
  ].join(", ");
}

/** Used for CSS-background hero banners where srcset is not available. */
export function responsiveBackground(source: string): string {
  if (!responsiveSrcSet(source)) return `url(${JSON.stringify(source)})`;
  return `image-set(url(${JSON.stringify(responsiveUrl(source, "mobile"))}) 1x, url(${JSON.stringify(responsiveUrl(source, "desktop"))}) 2x)`;
}
