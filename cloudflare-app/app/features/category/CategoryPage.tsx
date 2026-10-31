import { CampMemories } from "../../components/CampMemories";
import { ProgramCard } from "../../components/ProgramCard";
import { SafeRichText } from "../../components/SafeRichText";
import { Breadcrumbs } from "../../components/ui/Breadcrumbs";
import { SITE } from "../../config/site";
import type {
  CategoryRecord,
  MemoriesDocument,
  ProgramRecord,
  SiteSettings
} from "../../lib/domain";
import { isVisible } from "../../lib/visibility";

function CategoryHero({ category }: { category: CategoryRecord }) {
  return (
    <section
      className="hero-section"
      aria-label={`${category.name} banner`}
      style={{
        backgroundImage: `url(${JSON.stringify(category.banner || SITE.images.placeholder)})`
      }}
    >
      <div className="container position-relative category-hero-caption">
        <h1>{category.name}</h1>
      </div>
    </section>
  );
}

function CategoryIntro({ category }: { category: CategoryRecord }) {
  if (!category.intro) return null;
  return (
    <section className="intro-section">
      <div className="container">
        <div className="row align-items-center g-5">
          <div className="col-lg-6">
            <div className="intro-card">
              <h2 className="mb-4">Discover {category.name}</h2>
              <div className="lead">
                <SafeRichText html={category.intro} />
              </div>
            </div>
          </div>
          {category.intro_image && (
            <div className="col-lg-6">
              <img
                src={category.intro_image}
                alt={`${category.name} Introduction`}
                className="img-fluid intro-image"
                loading="lazy"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function CategorySections({ category }: { category: CategoryRecord }) {
  const sections = (category.sections || []).filter((section) => section.is_active !== false);
  return (
    <>
      {sections.map((section, index) => (
        <section
          key={`${section.title || "section"}-${index}`}
          className="section-content"
          style={{ backgroundColor: index % 2 ? "#f8f9fa" : "#fff" }}
        >
          <div className="container">
            <div className="row align-items-center g-5">
              <div className={"col-lg-6" + (index % 2 ? " order-lg-2" : "")}>
                <div className="content-card">
                  <h2>{section.title || ""}</h2>
                  <div className="text-muted">
                    <SafeRichText html={section.content || ""} />
                  </div>
                </div>
              </div>
              {section.image && (
                <div className={"col-lg-6" + (index % 2 ? " order-lg-1" : "")}>
                  <img
                    src={section.image}
                    alt={section.title || ""}
                    className="img-fluid content-image"
                    loading="lazy"
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      ))}
    </>
  );
}

function CategoryPrograms({
  programs,
  settings
}: {
  programs: ProgramRecord[];
  settings: SiteSettings;
}) {
  if (programs.length === 0) return null;
  return (
    <section className="section-content bg-light" id="category-programs">
      <div className="container">
        <div className="row g-4 justify-content-center">
          {programs.map((program) => (
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch" key={program.slug}>
              <ProgramCard program={program} settings={settings} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CategoryPage({
  category,
  programs,
  settings,
  memories
}: {
  category: CategoryRecord;
  programs: ProgramRecord[];
  settings: SiteSettings;
  memories: MemoriesDocument | null;
}) {
  return (
    <div className="page-content">
      {isVisible("category", "hero", category, settings) && <CategoryHero category={category} />}
      <div className="bg-light border-bottom">
        <div className="container py-2">
          <Breadcrumbs
            items={[{ label: "HOME", to: "/" }, { label: category.name.toUpperCase() }]}
          />
        </div>
      </div>
      {isVisible("category", "intro", category, settings) && <CategoryIntro category={category} />}
      {isVisible("category", "sections", category, settings) && (
        <CategorySections category={category} />
      )}
      {isVisible("category", "programs", category, settings) && (
        <CategoryPrograms programs={programs} settings={settings} />
      )}
      {isVisible("category", "testimonials", category, settings) && (
        <CampMemories data={memories} />
      )}
    </div>
  );
}
