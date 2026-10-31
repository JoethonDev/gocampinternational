import { useEffect, useRef, useState } from "react";
import { SITE } from "../config/site";
import type { MemoriesDocument, MemoryItem } from "../lib/domain";

function memoryUrl(path: string) {
  if (path.startsWith("/media/")) return path;
  if (path.startsWith("/images/")) return path;
  if (path.startsWith("/media.php?")) return path;
  return `/images/${encodeURIComponent(path)}`;
}

function MemoryCard({ item }: { item: MemoryItem }) {
  return (
    <figure className="camp-memory card border-0 shadow-sm mb-0">
      <a
        href={memoryUrl(item.image)}
        data-toggle="lightbox"
        aria-label={`View photo: ${item.caption}`}
      >
        <img
          src={memoryUrl(item.image)}
          alt={item.caption}
          loading="lazy"
          decoding="async"
          width={640}
          height={480}
        />
      </a>
      <figcaption className="p-3 text-center">{item.caption}</figcaption>
    </figure>
  );
}

function FacebookPanel() {
  return (
    <div className="col-lg-4">
      <div className="card shadow-lg">
        <div className="card-body p-2">
          <div
            className="fb-page"
            data-href={SITE.social.facebook}
            data-tabs="timeline"
            data-width="500"
            data-height="450"
            data-small-header="false"
            data-adapt-container-width="true"
            data-hide-cover="false"
            data-show-facepile="true"
            data-lazy="true"
          >
            <blockquote cite={SITE.social.facebook} className="fb-xfbml-parse-ignore">
              <a href={SITE.social.facebook}>{SITE.name}</a>
            </blockquote>
          </div>
          <div className="text-center mt-2">
            <a
              href={SITE.social.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-outline-primary"
            >
              View on Facebook
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CampMemories({ data }: { data: MemoriesDocument | null | undefined }) {
  const track = useRef<HTMLDivElement>(null);
  const [controls, setControls] = useState({ visible: false, prev: false, next: false });
  const items = (data?.items || []).filter(
    (item) => item?.is_active !== false && item?.in_slider !== false && Boolean(item?.image)
  );

  useEffect(() => {
    const element = track.current;
    if (!element || items.length === 0) return;

    const update = () => {
      const visible = element.scrollWidth > element.clientWidth + 2;
      const next = {
        visible,
        prev: element.scrollLeft > 2,
        next: element.scrollLeft + element.clientWidth < element.scrollWidth - 2
      };
      setControls((last) =>
        last.visible === next.visible && last.prev === next.prev && last.next === next.next
          ? last
          : next
      );
    };

    element.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    observer?.observe(element);
    update();

    return () => {
      element.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      observer?.disconnect();
    };
  }, [items.length]);

  useEffect(() => {
    if (!data?.show_facebook || items.length === 0) return;
    const facebook = (
      window as Window & {
        FB?: { XFBML?: { parse: (element?: Element | null) => void } };
      }
    ).FB;
    if (facebook?.XFBML) {
      facebook.XFBML.parse(document.querySelector(".camp-memories") || undefined);
      return;
    }
    if (!document.querySelector('script[data-gocamp-facebook="1"]')) {
      const script = document.createElement("script");
      script.dataset.gocampFacebook = "1";
      script.async = true;
      script.defer = true;
      script.crossOrigin = "anonymous";
      script.src = "https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v19.0";
      document.body.appendChild(script);
    }
  }, [data?.show_facebook, items.length]);

  if (!items.length) return null;

  const scroll = (direction: number) => {
    const element = track.current;
    if (!element) return;
    const card = element.querySelector<HTMLElement>(".camp-memory");
    const gap = parseFloat(getComputedStyle(element).gap) || 0;
    const distance = (card?.getBoundingClientRect().width || element.clientWidth) + gap;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    element.scrollBy({
      left: direction * distance,
      behavior: reduceMotion ? "instant" : "smooth"
    });
  };

  const showFacebook = data?.show_facebook !== false;

  return (
    <section className="section-padding camp-memories" aria-labelledby="camp-memories-title">
      <div className="container">
        <h2 id="camp-memories-title" className="section-title text-center text-lg-start mb-5">
          {data?.title || "Go Campers Memories"}
        </h2>
        <div className="row gx-lg-5 align-items-start">
          <div className={(showFacebook ? "col-lg-8" : "col-12") + " mb-5 mb-lg-0"}>
            <div className="camp-memories-slider">
              <button
                type="button"
                className="btn btn-outline-primary camp-memories-arrow"
                aria-label="Previous memories"
                aria-controls="camp-memories-track"
                hidden={!controls.visible}
                disabled={!controls.prev}
                onClick={() => scroll(-1)}
              >
                ←
              </button>
              <div
                id="camp-memories-track"
                className="camp-memories-track"
                ref={track}
                tabIndex={0}
                role="region"
                aria-label="Camper photo memories"
              >
                {items.map((item, index) => (
                  <MemoryCard key={`${item.image}-${index}`} item={item} />
                ))}
              </div>
              <button
                type="button"
                className="btn btn-outline-primary camp-memories-arrow"
                aria-label="Next memories"
                aria-controls="camp-memories-track"
                hidden={!controls.visible}
                disabled={!controls.next}
                onClick={() => scroll(1)}
              >
                →
              </button>
            </div>
          </div>
          {showFacebook && <FacebookPanel />}
        </div>
      </div>
    </section>
  );
}
