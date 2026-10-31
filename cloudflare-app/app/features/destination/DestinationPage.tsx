import { Link } from "react-router";
import { CampMemories } from "../../components/CampMemories";
import { FaqAccordion } from "../../components/FaqAccordion";
import { ProgramCard } from "../../components/ProgramCard";
import { SafeRichText } from "../../components/SafeRichText";
import { SITE } from "../../config/site";
import type {
  DestinationRecord,
  FaqItem,
  MemoriesDocument,
  ProgramRecord,
  SiteSettings
} from "../../lib/domain";
import { isVisible } from "../../lib/visibility";

function ComingSoon({ destination }: { destination: DestinationRecord }) {
  return (
    <div className="page-content">
      <div className="container text-center py-5 my-5">
        <h1 className="display-3 fw-bold text-brand-primary mb-4">Coming Soon</h1>
        <h2 className="mb-3">{destination.name} is not available yet.</h2>
        <p className="lead text-muted mb-4">
          Please check back later for updates on this destination.
        </p>
        <Link to="/" className="btn btn-primary btn-lg">
          Go to Homepage
        </Link>
      </div>
    </div>
  );
}

function Hero({ destination }: { destination: DestinationRecord }) {
  return (
    <section
      className="destination-hero position-relative overflow-hidden"
      style={{ minHeight: "90vh" }}
      aria-label={`${destination.name} banner`}
    >
      <div className="container position-relative destination-hero-caption">
        <h1>{destination.name}</h1>
      </div>
      <div
        className="hero-background position-absolute top-0 start-0 w-100 h-100"
        style={{
          backgroundImage: `url(${JSON.stringify(destination.banner || SITE.images.placeholder)})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed"
        }}
      />
    </section>
  );
}

function Stats({ destination }: { destination: DestinationRecord }) {
  const stats = destination.stats || [];
  if (stats.length === 0) return null;
  return (
    <section className="section-padding">
      <div className="container">
        <h2 className="section-title text-center">{destination.name} By The Numbers</h2>
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
  if (!destination.intro_text) return null;
  return (
    <section className="section-padding bg-white" id="destination-intro">
      <div className="container">
        <div className="row align-items-center g-4">
          <div className={destination.intro_image ? "col-lg-7" : "col-12"}>
            <h2 className="section-title">Discover {destination.name}</h2>
            <div className="lead">
              <SafeRichText html={destination.intro_text} />
            </div>
          </div>
          {destination.intro_image && (
            <div className="col-lg-5">
              <img
                className="img-fluid rounded-4 shadow-sm w-100"
                src={destination.intro_image}
                alt={destination.name}
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
              No programs are currently available for this destination. Please check back soon!
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
  if (destination.status === "coming-soon") {
    return <ComingSoon destination={destination} />;
  }
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
