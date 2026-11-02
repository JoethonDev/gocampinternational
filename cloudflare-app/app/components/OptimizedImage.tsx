import type { ImgHTMLAttributes } from "react";
export function OptimizedImage({
  src,
  alt,
  sizes = "100vw",
  priority = false,
  loading,
  decoding = "async",
  ...props
}: Omit<ImgHTMLAttributes<HTMLImageElement>, "srcSet"> & {
  src: string;
  alt: string;
  priority?: boolean;
}) {
  const managed = /^\/(?:images|uploads|media)\//.test(src) && !src.includes("?");
  const srcSet = managed
    ? [480, 960, 1920].map((width) => src + "?w=" + width + " " + width + "w").join(", ")
    : undefined;
  return (
    <img
      {...props}
      src={src}
      alt={alt}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      decoding={decoding}
      loading={loading ?? (priority ? "eager" : "lazy")}
      fetchPriority={priority ? "high" : undefined}
    />
  );
}
