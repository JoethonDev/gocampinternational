import { responsiveSrcSet } from "../lib/responsive-media";
import { SITE } from "../config/site";
import { asNumber, asStringArray, type ProgramRecord, type SiteSettings } from "../lib/domain";
import { isVisible } from "../lib/visibility";

export function ProgramCard({
  program,
  settings
}: {
  program: ProgramRecord;
  settings: SiteSettings;
}) {
  const highlights = asStringArray(program.highlights);
  const minAge = asNumber(program.ages?.min);
  const maxAge = asNumber(program.ages?.max);
  const hasValidAgeRange = minAge !== null && minAge > 0 && maxAge !== null && maxAge >= minAge;

  return (
    <div className="program-card-modern position-relative h-100">
      <div className="card border-0 shadow-lg h-100 overflow-hidden program-card-shell">
        {isVisible("program", "card_image", program, settings) && (
          <div className="position-relative overflow-hidden program-card-media">
            <img
              src={program.image || SITE.images.placeholder}
              srcSet={responsiveSrcSet(program.image || SITE.images.placeholder)}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              alt={program.name}
              className="card-img-top h-100 w-100 object-fit-cover program-card-image"
              loading="lazy"
            />
            <div className="position-absolute bottom-0 start-0 w-100 h-100 program-card-scrim" />
          </div>
        )}
        <div className="card-body p-4 d-flex flex-column">
          <h3 className="card-title fw-bold mb-2 text-brand-dark fs-4">{program.name}</h3>
          {hasValidAgeRange && (
            <p className="small fw-semibold text-brand-primary mb-2">
              Ages {minAge === maxAge ? minAge : `${minAge}–${maxAge}`}
            </p>
          )}
          {program.tagline && isVisible("program", "card_tagline", program, settings) && (
            <p className="card-text text-muted mb-3">{program.tagline}</p>
          )}
          {highlights.length > 0 && isVisible("program", "card_highlights", program, settings) && (
            <div className="mb-3">
              <ul className="list-unstyled mb-0">
                {highlights.map((highlight) => (
                  <li className="mb-2 d-flex align-items-start" key={highlight}>
                    <i className="bi bi-check-circle-fill text-brand-primary me-2 mt-1" />
                    <span className="text-dark">{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
