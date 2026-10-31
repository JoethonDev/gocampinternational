import { Link } from "react-router";
import { CampMemories } from "../../components/CampMemories";
import { HOME_COPY, HOME_HERO_SLIDES, SITE } from "../../config/site";
import type {
  CategoryRecord,
  DestinationRecord,
  MemoriesDocument,
  SiteSettings
} from "../../lib/domain";
import { isVisible } from "../../lib/visibility";

function HeroCarousel() {
  return (
    <header id="home-hero-slider" className="carousel slide" data-bs-ride="carousel">
      <div className="carousel-inner">
        {HOME_HERO_SLIDES.map((slide, index) => (
          <div className={"carousel-item" + (index === 0 ? " active" : "")} key={slide.image}>
            <div
              className="hero-section d-flex align-items-center justify-content-center text-center"
              style={{
                backgroundImage: `url('${slide.image}')`,
                backgroundSize: "cover",
                backgroundPosition: "center"
              }}
            >
              <div className="hero-overlay" />
              <div className="container position-relative home-hero-caption d-flex flex-column align-items-center justify-content-end text-center">
                {index === 0 ? (
                  <h1 className="display-3 fw-bold mb-3 text-white">{slide.title}</h1>
                ) : (
                  <h2 className="display-3 fw-bold mb-3 text-white">{slide.title}</h2>
                )}
                <p className="lead mb-0 text-white">
                  International camps are a life-changing opportunity to learn, grow, and make
                  global friends.
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </header>
  );
}

function IntroSection() {
  return (
    <section className="section-padding">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8 text-center">
            <h2 className="section-title">{HOME_COPY.eyebrow}</h2>
            <p className="lead">{HOME_COPY.intro}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function DestinationsSection({ destinations }: { destinations: DestinationRecord[] }) {
  return (
    <section id="destinations" className="section-padding bg-light">
      <div className="container">
        <h2 className="section-title text-center mb-5">{HOME_COPY.destinationsTitle}</h2>
        <div className="row g-4 justify-content-center">
          {destinations.map((destination) => (
            <div className="col-sm-6 col-lg-4" key={destination.slug}>
              <Link
                to={`/destinations/${destination.slug}`}
                className="card text-white border-0 shadow-sm program-card-home"
              >
                <img
                  src={destination.banner || SITE.images.placeholder}
                  className="card-img"
                  alt={destination.name}
                  loading="lazy"
                />
                <div className="card-img-overlay d-flex align-items-end p-0">
                  <div className="w-100 text-start p-3 destination-card-caption">
                    <h5 className="card-title fw-bold m-0">{destination.name}</h5>
                  </div>
                </div>
              </Link>
            </div>
          ))}
          {destinations.length === 0 && (
            <p className="text-center">Destinations will be listed here soon!</p>
          )}
        </div>
      </div>
    </section>
  );
}

function categoryIntro(value: unknown) {
  const plain = String(value || "Discover amazing programs in this category.").replace(
    /<[^>]+>/g,
    ""
  );
  return plain.length > 120 ? `${plain.slice(0, 120)}...` : plain;
}

function FeaturedCategories({ categories }: { categories: CategoryRecord[] }) {
  return (
    <section className="section-padding bg-light">
      <div className="container">
        <div className="text-center mb-5">
          <h2 className="section-title">{HOME_COPY.categoriesTitle}</h2>
          <p className="lead text-muted">{HOME_COPY.categoriesIntro}</p>
        </div>
        <div className="row g-4 justify-content-center">
          {categories.map((category) => (
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch" key={category.slug}>
              <div className="category-card-modern position-relative h-100">
                <div className="card border-0 shadow-lg h-100 overflow-hidden category-card-shell">
                  <div className="position-relative overflow-hidden category-card-media">
                    <img
                      src={category.banner || SITE.images.placeholder}
                      alt={category.name}
                      className="card-img-top h-100 w-100 object-fit-cover category-card-image"
                      loading="lazy"
                    />
                    <div className="category-card-scrim" />
                    <div className="position-absolute bottom-0 start-0 w-100 p-4">
                      <h3 className="text-white fw-bold mb-2 fs-3">{category.name}</h3>
                      <div className="d-flex align-items-center text-white-50">
                        <i className="bi bi-geo-alt-fill me-2" />
                        <span className="fw-medium">Multiple Destinations</span>
                      </div>
                    </div>
                  </div>
                  <div className="card-body p-4 d-flex flex-column">
                    <p className="card-text text-muted mb-4 flex-grow-1 lh-lg">
                      {categoryIntro(category.intro)}
                    </p>
                    <div className="mt-auto">
                      <Link
                        to={`/program/category?category=${encodeURIComponent(category.slug)}`}
                        className="stretched-link"
                        aria-label={`Browse ${category.name}`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomePage({
  destinations,
  categories,
  eligible,
  settings,
  memories
}: {
  destinations: DestinationRecord[];
  categories: CategoryRecord[];
  eligible: string[];
  settings: SiteSettings;
  memories: MemoriesDocument | null;
}) {
  const featuredCategories = categories
    .filter((category) => eligible.includes(category.slug))
    .slice(0, 3);
  return (
    <div className="page-content">
      {isVisible("home", "hero", settings, settings) && <HeroCarousel />}
      {isVisible("home", "intro", settings, settings) && <IntroSection />}
      {isVisible("home", "destinations", settings, settings) && (
        <DestinationsSection destinations={destinations} />
      )}
      {isVisible("home", "featured_categories", settings, settings) && (
        <FeaturedCategories categories={featuredCategories} />
      )}
      {isVisible("home", "testimonials", settings, settings) && <CampMemories data={memories} />}
    </div>
  );
}
