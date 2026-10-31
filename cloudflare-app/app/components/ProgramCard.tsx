import { SITE } from "../config/site";
import { asNumber, asStringArray, type ProgramRecord, type SiteSettings } from "../lib/domain";
import { isVisible } from "../lib/visibility";

function ageLabel(program: ProgramRecord) {
  const min = asNumber(program.ages?.min) || 0;
  const max = asNumber(program.ages?.max) || 0;
  if (min <= 0) return "";
  return max > 0 ? `${min}-${max}` : `${min}+`;
}

export function ProgramCard({
  program,
  settings
}: {
  program: ProgramRecord;
  settings: SiteSettings;
}) {
  const label = ageLabel(program);
  const highlights = asStringArray(program.highlights);

  return (
    <div className="program-card-modern position-relative h-100">
      <div className="card border-0 shadow-lg h-100 overflow-hidden program-card-shell">
        {isVisible("program", "card_image", program, settings) && (
          <div className="position-relative overflow-hidden program-card-media">
            <img
              src={program.image || SITE.images.placeholder}
              alt={program.name}
              className="card-img-top h-100 w-100 object-fit-cover program-card-image"
              loading="lazy"
            />
            <div className="position-absolute bottom-0 start-0 w-100 h-100 program-card-scrim" />
            {label && (
              <div className="position-absolute bottom-0 start-0 w-100 p-3">
                <div className="d-flex align-items-center gap-3 text-white">
                  <div className="d-flex align-items-center bg-white bg-opacity-25 rounded-pill px-3 py-2">
                    <i className="bi bi-people-fill me-2" />
                    <span className="fw-bold">{label} years</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <div className="card-body p-4 d-flex flex-column">
          <h3 className="card-title fw-bold mb-2 text-brand-dark fs-4">{program.name}</h3>
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
