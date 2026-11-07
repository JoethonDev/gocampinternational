import { responsiveSrcSet } from "../../lib/responsive-media";
import { SITE, type AboutPageContent, type AboutSection } from "../../config/site";
import { PageBanner } from "../../components/ui/PageBanner";
import { Breadcrumbs } from "../../components/ui/Breadcrumbs";

function AboutSection({
  section,
  isLast,
  index
}: {
  section: AboutSection;
  isLast: boolean;
  index: number;
}) {
  // Long editorial copy should flow around its photo rather than force
  // the photo to match the full height of the text.
  const isIntro = index === 0;
  const paragraphs = section.body.map((paragraph, paragraphIndex) => (
    <p
      key={paragraphIndex}
      className={
        "fs-5 lh-lg text-secondary" +
        (paragraphIndex === section.body.length - 1 ? " mb-0" : "")
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
                alt="Go Camp International students on an educational trip"
                className="img-fluid d-block"
                style={{ width: "auto", height: "auto", maxWidth: "100%", maxHeight: "500px", objectFit: "contain" }}
                loading="lazy"
              />
            </div>
            <div className="col-lg-7">
              <h2 className="card-title mb-3">{section.title}</h2>
              {paragraphs.slice(0, 2)}
            </div>
          </div>
          {paragraphs.length > 2 && (
            <div className="mt-4">{paragraphs.slice(2)}</div>
          )}
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
              <figcaption className="text-secondary small text-center">
                {photo.caption}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}

export function AboutPage({ content }: { content: AboutPageContent }) {
  return (
    <>
      <PageBanner
        image={SITE.images.aboutBanner}
        alt="Students sitting on grass"
        title="About Us"
        hiddenTitle
      />
      <div className="container py-5">
        <Breadcrumbs items={[{ label: "HOME", to: "/" }, { label: "ABOUT US" }]} />
        <div className="row g-5">
          <div className="col-12">
            {content.sections.map((section, index) => (
              <AboutSection
                key={section.title}
                section={section}
                isLast={index === content.sections.length - 1}
                index={index}
              />
            ))}
          </div>
        </div>
        <section className="about-founder mt-5" aria-labelledby="about-founder-title">
          <div className="about-founder-layout">
            <figure className="about-founder-portrait">
              <img
                src={content.profile.image || SITE.images.profile}
                srcSet={responsiveSrcSet(content.profile.image || SITE.images.profile)}
                sizes="(max-width: 767px) calc(100vw - 3rem), 37vw"
                alt={`Portrait of ${content.profile.name}, ${content.profile.title}`}
                loading="lazy"
                decoding="async"
                width={1536}
                height={1404}
              />
              <figcaption className="about-founder-caption">
                <h3 className="about-founder-name">{content.profile.name}</h3>
                <p className="about-founder-role">{content.profile.title}</p>
              </figcaption>
            </figure>
            <div className="about-founder-copy">
              <p className="about-founder-eyebrow">About Us</p>
              <h2 className="about-founder-heading" id="about-founder-title">Our Founder</h2>
              <span className="about-founder-divider" aria-hidden="true" />
              <div className="about-founder-description">
                {content.profile.body.split(/\n\s*\n/).filter(Boolean).map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
