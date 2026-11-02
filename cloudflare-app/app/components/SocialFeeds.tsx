import { useEffect, useRef, useState } from "react";
import { SITE } from "../config/site";
import "./social-feeds.css";

type MetaWindow = Window & {
  FB?: { XFBML?: { parse: (root?: HTMLElement) => void } };
  instgrm?: { Embeds?: { process: () => void } };
};

// Meta does not publish a dedicated React SDK for these plugins. Load its
// official browser scripts once, after the widgets approach the viewport.
const scriptLoads = new Map<string, Promise<void>>();

function loadMetaScript(id: string, src: string): Promise<void> {
  const cached = scriptLoads.get(id);
  if (cached) return cached;

  const task = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(id) as HTMLScriptElement | null;
    if (existing?.dataset.loaded === "true") {
      resolve();
      return;
    }

    const script = existing || document.createElement("script");
    script.addEventListener(
      "load",
      () => {
        script.dataset.loaded = "true";
        resolve();
      },
      { once: true }
    );
    script.addEventListener("error", () => reject(new Error("Social embed unavailable")), {
      once: true
    });
    if (!existing) {
      script.id = id;
      script.src = src;
      script.async = true;
      script.crossOrigin = "anonymous";
      document.body.appendChild(script);
    }
  }).catch((error) => {
    scriptLoads.delete(id);
    document.getElementById(id)?.remove();
    throw error;
  });
  scriptLoads.set(id, task);
  return task;
}

function useNearViewport(ref: React.RefObject<HTMLDivElement | null>) {
  const [near, setNear] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (!("IntersectionObserver" in window)) {
      setNear(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: "400px 0px" }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return near;
}

function SocialLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="social-feed-link">
      {children} <span aria-hidden="true">↗</span>
    </a>
  );
}

function FacebookPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const near = useNearViewport(containerRef);
  const [width, setWidth] = useState(340);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const measure = () => setWidth(Math.max(180, Math.min(500, Math.floor(element.clientWidth))));
    measure();
    if (!("ResizeObserver" in window)) return;
    const resize = new ResizeObserver(measure);
    resize.observe(element);
    return () => resize.disconnect();
  }, []);

  useEffect(() => {
    if (!near || failed) return;
    let alive = true;
    loadMetaScript(
      "gocamp-facebook-sdk",
      "https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v25.0"
    )
      .then(() => {
        if (!alive) return;
        (window as MetaWindow).FB?.XFBML?.parse(widgetRef.current || undefined);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [near, width, failed]);

  return (
    <article className="social-feed-card">
      <div className="social-feed-heading">
        <span className="social-feed-icon facebook" aria-hidden="true">
          <i className="bi bi-facebook" />
        </span>
        <div>
          <h3>Facebook</h3>
          <p>News and updates from Go Camp</p>
        </div>
      </div>
      <div ref={containerRef} className="social-feed-embed" aria-label="Go Camp Facebook page">
        {failed ? (
          <p className="social-feed-fallback">
            Facebook updates are not available to embed in this browser.
          </p>
        ) : near ? (
          <div
            key={width}
            ref={widgetRef}
            className="fb-page"
            data-href={SITE.social.facebook}
            data-tabs="timeline"
            data-width={width}
            data-height="450"
            data-small-header="false"
            data-adapt-container-width="true"
            data-hide-cover="false"
            data-show-facepile="true"
            data-lazy="true"
          >
            <blockquote cite={SITE.social.facebook} className="fb-xfbml-parse-ignore">
              <a href={SITE.social.facebook}>Go Camp International on Facebook</a>
            </blockquote>
          </div>
        ) : (
          <div className="social-feed-placeholder" aria-hidden="true" />
        )}
      </div>
      <SocialLink href={SITE.social.facebook}>Visit our Facebook page</SocialLink>
    </article>
  );
}

function InstagramProfile() {
  const containerRef = useRef<HTMLDivElement>(null);
  const near = useNearViewport(containerRef);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!near) return;
    let alive = true;
    loadMetaScript("gocamp-instagram-embed", "https://www.instagram.com/embed.js")
      .then(() => {
        if (alive) (window as MetaWindow).instgrm?.Embeds?.process();
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [near]);

  return (
    <article className="social-feed-card">
      <div className="social-feed-heading">
        <span className="social-feed-icon instagram" aria-hidden="true">
          <i className="bi bi-instagram" />
        </span>
        <div>
          <h3>Instagram</h3>
          <p>Photos and moments from our adventures</p>
        </div>
      </div>
      <div ref={containerRef} className="social-feed-embed" aria-label="Go Camp Instagram profile">
        {near && !failed ? (
          <blockquote
            className="instagram-media"
            data-instgrm-permalink={SITE.social.instagram}
            data-instgrm-version="14"
            style={{ width: "100%", maxWidth: 500, margin: "0 auto" }}
          >
            <a href={SITE.social.instagram}>View @gocampgo on Instagram</a>
          </blockquote>
        ) : (
          <div className="social-feed-profile-fallback">
            <i className="bi bi-instagram" aria-hidden="true" />
            <p>Explore our camp photos and experiences on Instagram.</p>
          </div>
        )}
      </div>
      <SocialLink href={SITE.social.instagram}>Follow @gocampgo</SocialLink>
    </article>
  );
}

export function SocialFeeds() {
  return (
    <section className="section-padding social-feeds-section" aria-labelledby="social-feeds-title">
      <div className="container">
        <div className="text-center mb-4">
          <h2 id="social-feeds-title" className="section-title">
            Follow Our Adventures
          </h2>
          <p className="lead text-muted">
            Get a glimpse of camp life and stay connected with Go Camp International.
          </p>
        </div>
        <div className="row g-4 justify-content-center">
          <div className="col-12 col-lg-6 d-flex">
            <FacebookPage />
          </div>
          <div className="col-12 col-lg-6 d-flex">
            <InstagramProfile />
          </div>
        </div>
      </div>
    </section>
  );
}
