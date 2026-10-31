import { useEffect } from "react";

export function useLightbox() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const link = target.closest<HTMLAnchorElement>('a[data-toggle="lightbox"]');
      const galleryImage = target.closest<HTMLImageElement>("#destination-gallery img");
      if (!link && !galleryImage) return;
      if (link) event.preventDefault();

      const modal = document.getElementById("imgLightbox");
      const image = document.getElementById("imgLightboxImg") as HTMLImageElement | null;
      const source = link?.getAttribute("href") || galleryImage?.currentSrc || galleryImage?.src;
      if (!image || !modal || !source) return;

      image.src = source;
      image.alt =
        link?.querySelector("img")?.getAttribute("alt") || galleryImage?.alt || "Gallery image";

      const bootstrap = (
        window as Window & {
          bootstrap?: {
            Modal?: { getOrCreateInstance: (element: Element) => { show: () => void } };
          };
        }
      ).bootstrap;
      if (bootstrap?.Modal?.getOrCreateInstance) {
        bootstrap.Modal.getOrCreateInstance(modal).show();
      } else {
        window.open(source, "_blank", "noopener");
      }
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
}
