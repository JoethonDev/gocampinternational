import { usePublicContent } from "../../lib/public-content-react";
import { responsiveSrcSet } from "../../lib/responsive-media";
import { Link } from "react-router";
import { CampMemories } from "../../components/CampMemories";
import { FaqAccordion } from "../../components/FaqAccordion";
import { ProgramCard } from "../../components/ProgramCard";
import { SafeRichText } from "../../components/SafeRichText";
import type {
  DestinationRecord,
  FaqItem,
  MemoriesDocument,
  ProgramRecord,
  SiteSettings
} from "../../lib/domain";
import { isVisible } from "../../lib/visibility";

function ComingSoon({ name }: { name: string }) {
  const { text } = usePublicContent("destination");
  return (
    <div className="page-content coming-soon-page">
      <div className="container text-center py-5 my-5">
        <h1 className="display-3 fw-bold text-brand-primary mb-4">{text("coming-soon")}</h1>
        <h2 className="mb-3">
          {name} {text("is-not-available-yet")}
        </h2>
        <p className="lead text-muted mb-4">
          {text("please-check-back-later-for-updates-on-this-destination")}
        </p>
        <Link to={text("to-")} className="btn btn-primary btn-lg">
          {text("go-to-homepage")}
        </Link>
      </div>
    </div>
  );
}

export function ComingSoonDestinationPage({ name }: { name: string }) {
  return <ComingSoon name={name} />;
}

function Hero({ destination }: { destination: DestinationRecord }) {
  const { site: SITE } = usePublicContent("destination");
  return (
    <section
      className="destination-hero position-relative overflow-hidden"
      style={{ minHeight: "90vh" }}
      aria-label={`${destination.name} banner`}
    >
      <div className="container position-relative destination-hero-caption">
        <h1>{destination.name}</h1>
      </div>
      <img
        src={destination.banner || SITE.images.placeholder}
        srcSet={responsiveSrcSet(destination.banner || SITE.images.placeholder)}
        sizes="100vw"
        alt={destination.banner_alt || "Summer camp destination: " + destination.name}
        loading="eager"
        fetchPriority="high"
        decoding="async"
        className="hero-background position-absolute top-0 start-0 w-100 h-100 object-fit-cover"
      />
    </section>
  );
}

function Stats({ destination }: { destination: DestinationRecord }) {
  const { text } = usePublicContent("destination");
  const stats = destination.stats || [];
  if (stats.length === 0) return null;
  return (
    <section className="section-padding">
      <div className="container">
        <h2 className="section-title text-center">
          {destination.name} {text("by-the-numbers")}
        </h2>
        <div className="row g-4 justify-content-center">
          {stats.map((stat, index) => (
            <div key={index} className="col-sm-6 col-lg-3 text-center">
              <div className="fs-2 fw-bold">
                {String(stat.number || "")}
                {String(stat.suffix || "")}
              </div>
              <p>{String(stat.label || "")}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Introduction({ destination }: { destination: DestinationRecord }) {
  const { text } = usePublicContent("destination");
  if (!destination.intro_text) return null;
  return (
    <section className="section-padding bg-white" id="destination-intro">
      <div className="container">
        <div className="row align-items-center g-4">
          <div className={destination.intro_image ? "col-lg-7" : "col-12"}>
            <h2 className="section-title">
              {text("discover")}
              {destination.name}
            </h2>
            <div className="lead">
              <SafeRichText html={destination.intro_text} />
            </div>
          </div>
          {destination.intro_image && (
            <div className="col-lg-5">
              <img
                className="img-fluid rounded-4 shadow-sm w-100"
                src={destination.intro_image}
                srcSet={responsiveSrcSet(destination.intro_image)}
                sizes="(max-width: 992px) 100vw, 42vw"
                alt={
                  destination.intro_image === destination.banner
                    ? destination.banner_alt || destination.name
                    : destination.name
                }
                loading="lazy"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Programs({
  programs,
  hasProgramIds,
  settings
}: {
  programs: ProgramRecord[];
  hasProgramIds: boolean;
  settings: SiteSettings;
}) {
  const { text } = usePublicContent("destination");
  return (
    <section className="section-padding bg-light" id="programs">
      <div className="container">
        <div className="row g-4 justify-content-center">
          {programs.map((program) => (
            <div className="col-lg-4 col-md-6" key={program.slug}>
              <ProgramCard program={program} settings={settings} />
            </div>
          ))}
          {!hasProgramIds && (
            <p className="text-center">
              {text("no-programs-are-currently-available-for-this-destination-please-check-")}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export function DestinationPage({
  destination,
  programs,
  hasProgramIds,
  settings,
  memories
}: {
  destination: DestinationRecord;
  programs: ProgramRecord[];
  hasProgramIds: boolean;
  settings: SiteSettings;
  memories: MemoriesDocument | null;
}) {
  const faq = (destination.faq || []) as FaqItem[];
  return (
    <div className="page-content">
      {isVisible("destination", "hero", destination, settings) && (
        <Hero destination={destination} />
      )}
      {isVisible("destination", "stats", destination, settings) && (
        <Stats destination={destination} />
      )}
      {isVisible("destination", "intro", destination, settings) && (
        <Introduction destination={destination} />
      )}
      {isVisible("destination", "programs", destination, settings) && (
        <Programs programs={programs} hasProgramIds={hasProgramIds} settings={settings} />
      )}
      {isVisible("destination", "faq", destination, settings) && faq.length > 0 && (
        <section className="section-padding">
          <div className="container">
            <FaqAccordion
              title={`Questions About ${destination.name}`}
              items={faq}
              accordionId="destinationFaqAccordion"
            />
          </div>
        </section>
      )}
      {isVisible("destination", "testimonials", destination, settings) && (
        <CampMemories data={memories} />
      )}
    </div>
  );
}
