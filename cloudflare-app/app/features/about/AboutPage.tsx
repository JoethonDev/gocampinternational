import { OptimizedImage } from "../../components/OptimizedImage";
import { ABOUT_SECTIONS, SITE } from "../../config/site";
import { PageBanner } from "../../components/ui/PageBanner";
import { Breadcrumbs } from "../../components/ui/Breadcrumbs";

function AboutSection({
  section,
  isLast,
  index
}: {
  section: (typeof ABOUT_SECTIONS)[number];
  isLast: boolean;
  index: number;
}) {
  return (
    <div className={"card shadow-sm border-0 overflow-hidden" + (isLast ? "" : " mb-5")}>
      <div className={"row g-0" + (section.reverse ? " flex-row-reverse" : "")}>
        <div className="col-lg-5">
          <OptimizedImage
            src={section.image}
            alt={section.title}
            className="img-fluid h-100"
            style={{ objectFit: "cover", width: "100%" }}
            loading="lazy"
          />
        </div>
        <div className="col-lg-7 d-flex align-items-center">
          <div className="card-body p-5">
            <h2 className="card-title mb-3">{section.title}</h2>
            {section.body.map((paragraph, paragraphIndex) => (
              <p
                key={paragraphIndex}
                className={
                  "fs-5 lh-lg text-secondary" +
                  (paragraphIndex === section.body.length - 1 && (index === 1 || index === 2)
                    ? " mb-0"
                    : "")
                }
              >
                {paragraph.split("\n\n").map((segment, segmentIndex) => (
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
            ))}
          </div>
        </div>
      </div>
      {section.gallery && section.gallery.length > 0 && (
        <div className="row g-3 px-3 pb-4">
          {section.gallery.map((photo) => (
            <div className="col-md-4" key={photo.image}>
              <figure className="h-100 mb-0">
                <OptimizedImage
                  src={photo.image}
                  alt={photo.alt}
                  className="w-100 rounded-3"
                  style={{ height: 190, objectFit: "cover" }}
                  loading="lazy"
                  decoding="async"
                />
                <figcaption className="text-secondary small mt-2 text-center">
                  {photo.caption}
                </figcaption>
              </figure>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function AboutPage() {
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
            {ABOUT_SECTIONS.map((section, index) => (
              <AboutSection
                key={section.title}
                section={section}
                isLast={index === ABOUT_SECTIONS.length - 1}
                index={index}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
