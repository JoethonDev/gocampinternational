import { usePublicContent } from "../../lib/public-content-react";
import { SiteLink } from "./SiteLink";
import type { CategoryRecord, DestinationRecord } from "../../lib/domain";

function Dropdown({
  id,
  label,
  items
}: {
  id: string;
  label: string;
  items: Array<{ label: string; to: string }>;
}) {
  return (
    <li className="nav-item dropdown">
      <a
        className="nav-link dropdown-toggle"
        href="#"
        id={id}
        role="button"
        aria-expanded="false"
        aria-haspopup="true"
      >
        {label}
      </a>
      <ul className="dropdown-menu" aria-labelledby={id}>
        {items.map((item) => (
          <li key={item.to}>
            <SiteLink className="dropdown-item" to={item.to}>
              {item.label}
            </SiteLink>
          </li>
        ))}
      </ul>
    </li>
  );
}

export function SiteHeader({
  categories,
  destinations
}: {
  categories: CategoryRecord[];
  destinations: DestinationRecord[];
}) {
  const { text, site: SITE, visible } = usePublicContent("header");
  const booking = usePublicContent("booking");
  return (
    <nav
      hidden={!visible("show-navigation")}
      className="navbar navbar-expand-xl navbar-dark fixed-top gc-site-navbar"
      aria-label="Main navigation"
    >
      <div className="container">
        <SiteLink className="navbar-brand" to={text("to-")}>
          <img src={SITE.images.logo} alt={`${SITE.name} logo`} />
        </SiteLink>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNavbar"
          aria-controls="mainNavbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse" id="mainNavbar">
          <ul className="navbar-nav ms-auto mb-2 mb-xl-0 align-items-xl-center">
            <li className="nav-item">
              <SiteLink className="nav-link" to={text("to-")}>
                {text("home")}
              </SiteLink>
            </li>
            <li className="nav-item">
              <SiteLink className="nav-link" to={text("to-about")}>
                {text("about-us")}
              </SiteLink>
            </li>
            <Dropdown
              id="programsDropdown"
              label={text("label-programs")}
              items={categories.map((category) => ({
                label: category.name,
                to: `/program/category?category=${encodeURIComponent(category.slug)}`
              }))}
            />
            <Dropdown
              id="destinationsDropdown"
              label={text("label-destinations")}
              items={destinations.map((destination) => ({
                label: destination.name,
                to: `/destinations/${encodeURIComponent(destination.slug)}`
              }))}
            />
            <li className="nav-item">
              <SiteLink className="nav-link" to={text("to-faq")}>
                {text("faq")}
              </SiteLink>
            </li>
            <li className="nav-item">
              <SiteLink className="nav-link" to={text("to-contact")}>
                {text("contact")}
              </SiteLink>
            </li>
          </ul>
          {booking.visible("show-booking") && (
            <button
              type="button"
              className="btn btn-warning ms-xl-3"
              data-bs-toggle="modal"
              data-bs-target="#ctaModal"
            >
              {text("book-now")}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
