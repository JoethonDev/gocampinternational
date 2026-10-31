import { Link } from "react-router";
import { SITE } from "../../config/site";
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
            <Link className="dropdown-item" to={item.to}>
              {item.label}
            </Link>
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
  return (
    <nav
      className="navbar navbar-expand-xl navbar-dark fixed-top gc-site-navbar"
      aria-label="Main navigation"
    >
      <div className="container">
        <Link className="navbar-brand" to="/">
          <img src={SITE.images.logo} alt={`${SITE.name} logo`} style={{ height: 60 }} />
        </Link>
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
              <Link className="nav-link" to="/">
                Home
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/about">
                About Us
              </Link>
            </li>
            <Dropdown
              id="programsDropdown"
              label="Programs"
              items={categories.map((category) => ({
                label: category.name,
                to: `/program/category?category=${encodeURIComponent(category.slug)}`
              }))}
            />
            <Dropdown
              id="destinationsDropdown"
              label="Destinations"
              items={destinations.map((destination) => ({
                label: destination.name,
                to: `/destinations/${encodeURIComponent(destination.slug)}`
              }))}
            />
            <li className="nav-item">
              <Link className="nav-link" to="/faq">
                FAQ
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/contact">
                Contact
              </Link>
            </li>
          </ul>
          <button
            type="button"
            className="btn btn-warning ms-xl-3"
            data-bs-toggle="modal"
            data-bs-target="#ctaModal"
          >
            Book Now
          </button>
        </div>
      </div>
    </nav>
  );
}
