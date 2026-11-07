import { usePublicContent } from "../lib/public-content-react";
import { useEffect, useRef, useState } from "react";
import type { MemoriesDocument, MemoryItem } from "../lib/domain";
import { responsiveSrcSet } from "../lib/responsive-media";
import "./social-feeds.css";

// The live Meta embeds cannot guarantee that posts are public or available in
// visitors' browsers. Our own published camp photos provide a reliable preview.
function photoUrl(path: string) {
  if (path.startsWith("/") || /^https?:\/\//i.test(path)) return path;
  return `/images/${encodeURIComponent(path)}`;
}

function SocialLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="social-feed-link">
      {children} <span aria-hidden="true">↗</span>
    </a>
  );
}

function CampPhotoPreview({
  photos,
  platform
}: {
  photos: MemoryItem[];
  platform: "Facebook" | "Instagram";
}) {
  const { text } = usePublicContent("social");
  return (
    <div className="social-feed-preview">
      {photos.length > 0 ? (
        <div className="social-feed-photo-grid" aria-label="Photos from our camp gallery">
          {photos.map((photo) => {
            const url = photoUrl(photo.image);
            return (
              <a
                key={photo.image}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`View camp photo: ${photo.caption || photo.country || text("go-camp")}`}
              >
                <img
                  src={url}
                  srcSet={responsiveSrcSet(url)}
                  sizes="(max-width: 600px) 45vw, 230px"
                  loading="lazy"
                  decoding="async"
                  alt={photo.caption || photo.country || text("go-camp-camp-memory")}
                />
              </a>
            );
          })}
        </div>
      ) : (
        <div className="social-feed-no-photos">
          <i
            className={platform === "Facebook" ? "bi bi-facebook" : "bi bi-instagram"}
            aria-hidden="true"
          />
          <p>
            {text("see-our-latest-camp-adventures-on")} {platform}.
          </p>
        </div>
      )}
    </div>
  );
}

function FacebookPage({ photos }: { photos: MemoryItem[] }) {
  const { text, site: SITE } = usePublicContent("social");
  const containerRef = useRef<HTMLDivElement>(null);
  const widthRef = useRef(340);
  const [width, setWidth] = useState(340);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const measure = () => {
      const nextWidth = Math.max(180, Math.min(500, Math.floor(element.clientWidth)));
      if (widthRef.current !== nextWidth) {
        widthRef.current = nextWidth;
        setReady(false);
        setFailed(false);
        setWidth(nextWidth);
      }
    };
    measure();
    if (!("ResizeObserver" in window)) return;
    const resize = new ResizeObserver(measure);
    resize.observe(element);
    return () => resize.disconnect();
  }, []);

  const facebookIframeUrl = `https://www.facebook.com/plugins/page.php?${new URLSearchParams({
    href: SITE.social.facebook,
    tabs: "timeline",
    width: String(width),
    height: "450",
    small_header: "false",
    adapt_container_width: "true",
    hide_cover: "false",
    show_facepile: "true"
  }).toString()}`;

  return (
    <article className="social-feed-card">
      <div className="social-feed-heading">
        <span className="social-feed-icon facebook" aria-hidden="true">
          <i className="bi bi-facebook" />
        </span>
        <div>
          <h3>{text("facebook")}</h3>
          <p>{text("news-and-updates-from-go-camp")}</p>
        </div>
      </div>
      <div
        ref={containerRef}
        className="social-feed-content social-feed-facebook-content"
        aria-label="Go Camp Facebook page"
      >
        {(!ready || failed) && <CampPhotoPreview photos={photos} platform="Facebook" />}
        {!failed && (
          <iframe
            key={width}
            title={text("title-go-camp-international-facebook-timeline")}
            src={facebookIframeUrl}
            width={width}
            height={450}
            loading="lazy"
            scrolling="no"
            allow="encrypted-media"
            referrerPolicy="strict-origin-when-cross-origin"
            className={ready ? "social-feed-facebook-frame is-ready" : "social-feed-facebook-frame"}
            tabIndex={ready ? 0 : -1}
            aria-hidden={!ready}
            onLoad={() => setReady(true)}
            onError={() => setFailed(true)}
          />
        )}
      </div>
      <SocialLink href={SITE.social.facebook}>{text("visit-our-facebook-page")}</SocialLink>
    </article>
  );
}

function InstagramProfile({ photos }: { photos: MemoryItem[] }) {
  const { text, site: SITE } = usePublicContent("social");
  return (
    <article className="social-feed-card">
      <div className="social-feed-heading">
        <span className="social-feed-icon instagram" aria-hidden="true">
          <i className="bi bi-instagram" />
        </span>
        <div>
          <h3>{text("instagram")}</h3>
          <p>{text("photos-and-moments-from-our-adventures")}</p>
        </div>
      </div>
      <div className="social-feed-content">
        <CampPhotoPreview photos={photos} platform="Instagram" />
      </div>
      <SocialLink href={SITE.social.instagram}>{text("see-the-latest-posts-gocampgo")}</SocialLink>
    </article>
  );
}

export function SocialFeeds({ memories }: { memories: MemoriesDocument | null }) {
  const { text, visible, site: SITE } = usePublicContent("social");
  const seen = new Set<string>();
  const photos = (memories?.items || [])
    .filter((item) => {
      if (!item?.image || item.is_active === false || item.in_slider === false) return false;
      if (seen.has(item.image)) return false;
      seen.add(item.image);
      return true;
    })
    .slice(0, 6);
  const facebookPhotos = photos.slice(0, 3);
  const instagramPhotos = photos.length > 3 ? photos.slice(3, 6) : facebookPhotos;

  return (
    <section
      hidden={!visible("show-social-feed")}
      className="section-padding social-feeds-section"
      aria-labelledby="social-feeds-title"
    >
      <div className="container">
        <div className="text-center mb-4">
          <h2 id="social-feeds-title" className="section-title">
            {text("follow-our-adventures")}
          </h2>
          <p className="lead text-muted">
            {text("explore-our-camp-highlights-and-follow-go-camp-international-for-new-p")}
          </p>
        </div>
        <div className="row g-4 justify-content-center">
          {visible("show-facebook") && SITE.social.facebook && (
            <div className="col-12 col-lg-6 d-flex">
              <FacebookPage photos={facebookPhotos} />
            </div>
          )}
          {visible("show-instagram") && SITE.social.instagram && (
            <div className="col-12 col-lg-6 d-flex">
              <InstagramProfile photos={instagramPhotos} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
