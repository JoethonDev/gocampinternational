import { usePublicContent } from "../../lib/public-content-react";
import { SiteLink } from "./SiteLink";

import type { CategoryRecord, DestinationRecord } from "../../lib/domain";

function FooterLinks({
  title,
  links
}: {
  title: string;
  links: ReadonlyArray<{ label: string; to: string }>;
}) {
  return (
    <div className="col-lg col-md-6">
      <h5 className="fw-bold text-uppercase mb-3">{title}</h5>
      <ul className="list-unstyled">
        {links.map((link) => (
          <li className="mb-2" key={link.to}>
            <SiteLink to={link.to}>{link.label}</SiteLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter({
  categories,
  destinations
}: {
  categories: CategoryRecord[];
  destinations: DestinationRecord[];
}) {
  const { text, site: SITE, visible } = usePublicContent("footer");
  const SOCIAL_LINKS = [
    { href: SITE.social.facebook, image: SITE.images.facebookIcon, label: "Facebook" },
    { href: SITE.social.instagram, image: SITE.images.instagramIcon, label: "Instagram" },
    { href: SITE.social.linkedin, image: SITE.images.linkedinIcon, label: "LinkedIn" }
  ] as const;
  const programLinks = categories.map((category) => ({
    label: category.name,
    to: `/program/category?category=${encodeURIComponent(category.slug)}`
  }));
  const destinationLinks = destinations.map((destination) => ({
    label: destination.name,
    to: `/destinations/${encodeURIComponent(destination.slug)}`
  }));
  return (
    <footer hidden={!visible("show-footer")} className="footer text-white pt-5 pb-4">
      <div className="container">
        <div className="row gy-4">
          <FooterLinks
            title={text("title-about")}
            links={[
              { label: text("about.0.label"), to: text("about.0.to") },
              { label: text("about.1.label"), to: text("about.1.to") },
              { label: text("about.2.label"), to: text("about.2.to") },
              { label: text("about.3.label"), to: text("about.3.to") }
            ]}
          />
          <FooterLinks title={text("title-programs")} links={programLinks} />
          <FooterLinks title={text("title-destinations")} links={destinationLinks} />
          <div className="col-lg-3 col-md-6">
            <h5 className="fw-bold text-uppercase mb-3">{text("get-in-touch")}</h5>
            <p className="mb-2">
              <strong>{SITE.director}</strong>
              <br />
              <small>{SITE.directorTitle}</small>
            </p>
            <p className="mb-2">
              <i className="bi bi-telephone-fill me-2" />
              {SITE.phone}
            </p>
            {SITE.emailHref && (
              <p>
                <a href={SITE.emailHref}>
                  <i className="bi bi-envelope-fill me-2" />
                  {text("email-us")}
                </a>
              </p>
            )}
          </div>
          <div className="col-lg col-md-6 text-center text-md-start">
            <h5 className="fw-bold text-uppercase mb-3">{text("follow-us")}</h5>
            <div className="social-icons mb-4">
              {SOCIAL_LINKS.filter((link) => Boolean(link.href)).map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="me-2"
                >
                  <img src={link.image} alt={link.label} />
                </a>
              ))}
            </div>
            <img
              src={SITE.images.icef}
              alt={text("alt-icef-accredited")}
              className="footer-icef-logo"
            />
          </div>
        </div>
        <hr className="my-4" />
        <div className="row">
          <div className="col-md-6 text-center text-md-start">
            <small>
              © {new Date().getFullYear()} {text("go-camp-international-all-rights-reserved")}
            </small>
          </div>
          <div className="col-md-6 text-center text-md-end">
            <small>{text("powered-by-joethondev")}</small>
          </div>
        </div>
      </div>
    </footer>
  );
}
