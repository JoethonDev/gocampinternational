import { usePublicContent } from "../../lib/public-content-react";
import { responsiveSrcSet } from "../../lib/responsive-media";
import { type AboutPageContent, type AboutSection } from "../../config/site";
import { PageBanner } from "../../components/ui/PageBanner";
import { Breadcrumbs } from "../../components/ui/Breadcrumbs";
import { FounderPortrait } from "../../components/site/FounderPortrait";

function AboutSection({
  section,
  isLast,
  index
}: {
  section: AboutSection;
  isLast: boolean;
  index: number;
}) {
  const { text } = usePublicContent("about");
  // Long editorial copy should flow around its photo rather than force
  // the photo to match the full height of the text.
  const isIntro = index === 0;
  const paragraphs = section.body.map((paragraph, paragraphIndex) => (
    <p
      key={paragraphIndex}
      className={
        "fs-5 lh-lg text-secondary" + (paragraphIndex === section.body.length - 1 ? " mb-0" : "")
      }
    >
      {paragraph.split("\\n\\n").map((segment, segmentIndex) => (
        <span key={segmentIndex}>
          {segmentIndex > 0 && (
            <>
              <br />
              <br />
            </>
          )}
          {segment}
        </span>
      ))}
    </p>
  ));

  return (
    <div className={"card shadow-sm border-0 overflow-hidden" + (isLast ? "" : " mb-5")}>
      {isIntro ? (
        <div className="card-body p-4 p-lg-5">
          <div className="row g-4 align-items-start">
            <div className="col-lg-5 d-flex justify-content-center">
              <img
                src={section.image}
                alt={text("alt-go-camp-international-students-on-an-educational-trip")}
                className="img-fluid d-block"
                style={{
                  width: "auto",
                  height: "auto",
                  maxWidth: "100%",
                  maxHeight: "500px",
                  objectFit: "contain"
                }}
                loading="lazy"
              />
            </div>
            <div className="col-lg-7">
              <h2 className="card-title mb-3">{section.title}</h2>
              {paragraphs.slice(0, 2)}
            </div>
          </div>
          {paragraphs.length > 2 && <div className="mt-4">{paragraphs.slice(2)}</div>}
        </div>
      ) : (
        <div className={"row g-0" + (section.reverse ? " flex-row-reverse" : "")}>
          <div className="col-lg-5 align-self-start">
            <div className="d-flex justify-content-center align-items-start p-3 p-lg-4">
              <img
                src={section.image}
                srcSet={responsiveSrcSet(section.image)}
                sizes="(max-width: 992px) 100vw, 42vw"
                alt={section.title}
                className="img-fluid d-block"
                style={{ width: "auto", height: "auto", maxWidth: "100%", maxHeight: "620px" }}
                loading="lazy"
              />
            </div>
          </div>
          <div className="col-lg-7 d-flex align-items-center">
            <div className="card-body p-4 p-lg-5">
              <h2 className="card-title mb-3">{section.title}</h2>
              {paragraphs}
            </div>
          </div>
        </div>
      )}
      {section.gallery && section.gallery.length > 0 && (
        <div className="about-section-gallery">
          {section.gallery.map((photo) => (
            <figure className="about-section-gallery-item" key={photo.image}>
              <img
                src={photo.image}
                srcSet={responsiveSrcSet(photo.image)}
                sizes="(max-width: 575px) calc(100vw - 4rem), (max-width: 991px) 45vw, 29vw"
                alt={photo.alt}
                loading="lazy"
                decoding="async"
              />
              <figcaption className="text-secondary small text-center">{photo.caption}</figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}

export function AboutPage({ content }: { content: AboutPageContent }) {
  const { text, site: SITE, visible } = usePublicContent("about");
  const sections = content.sections
    .map((section, index) => ({ section, index }))
    .filter(({ section }) => section.visible !== false);
  return (
    <>
      {visible("show-banner") && (
        <PageBanner
          image={SITE.images.aboutBanner}
          alt={text("alt-students-sitting-on-grass")}
          title={text("title-about-us")}
          hiddenTitle
        />
      )}
      <div className="container py-5">
        <Breadcrumbs items={[{ label: text("home"), to: "/" }, { label: text("about-us") }]} />
        {visible("show-content") && sections.length > 0 && (
          <div className="row g-5">
            <div className="col-12">
              {sections.map(({ section, index }, visibleIndex) => (
                <AboutSection
                  key={`${section.title}-${index}`}
                  section={section}
                  isLast={visibleIndex === sections.length - 1}
                  index={index}
                />
              ))}
            </div>
          </div>
        )}
        {visible("show-founder") && (
          <section className="mt-5" aria-labelledby="about-founder-title">
            <h2 id="about-founder-title" className="h3 mb-4">
              {text("meet-our-founder")}
            </h2>
            <section className="card shadow-sm border-0" aria-labelledby="about-director-title">
              <div className="card-body p-4 p-lg-5">
                <div className="row g-4 align-items-start">
                  <div className="col-md-4 col-lg-3">
                    <FounderPortrait
                      src={SITE.images.profile}
                      name={content.profile.name}
                      title={content.profile.title}
                      headingId="about-director-title"
                    />
                  </div>
                  <div className="col-md-8 col-lg-9">
                    {content.profile.body.split(/\n\s*\n/).map((paragraph, index) => (
                      <p className="fs-5 lh-lg text-secondary" key={index}>
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </section>
        )}
      </div>
    </>
  );
}
