import { Link } from "react-router";
import { FOOTER_LINKS, SITE } from "../../config/site";

function FooterLinks({
  title,
  links
}: {
  title: string;
  links: ReadonlyArray<{ label: string; to: string }>;
}) {
  return (
    <div className="col-lg-3 col-md-6">
      <h5 className="fw-bold text-uppercase mb-3">{title}</h5>
      <ul className="list-unstyled">
        {links.map((link) => (
          <li className="mb-2" key={link.to}>
            <Link to={link.to}>{link.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

const SOCIAL_LINKS = [
  { href: SITE.social.facebook, image: SITE.images.facebookIcon, label: "Facebook" },
  { href: SITE.social.instagram, image: SITE.images.instagramIcon, label: "Instagram" },
  { href: SITE.social.linkedin, image: SITE.images.linkedinIcon, label: "LinkedIn" }
] as const;

export function SiteFooter() {
  return (
    <footer className="footer text-white pt-5 pb-4">
      <div className="container">
        <div className="row gy-4">
          <FooterLinks title="About" links={FOOTER_LINKS.about} />
          <FooterLinks title="Programs" links={FOOTER_LINKS.programs} />
          <div className="col-lg-3 col-md-6">
            <h5 className="fw-bold text-uppercase mb-3">Get in Touch</h5>
            <p className="mb-2">
              <strong>{SITE.director}</strong>
              <br />
              <small>{SITE.directorTitle}</small>
            </p>
            <p className="mb-2">
              <i className="bi bi-telephone-fill me-2" />
              {SITE.phone}
            </p>
            <p>
              <a href={SITE.emailHref}>
                <i className="bi bi-envelope-fill me-2" />
                Email Us
              </a>
            </p>
          </div>
          <div className="col-lg-3 col-md-6 text-center text-md-start">
            <h5 className="fw-bold text-uppercase mb-3">Follow Us</h5>
            <div className="social-icons mb-4">
              {SOCIAL_LINKS.map((link) => (
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
            <img src={SITE.images.icef} alt="ICEF Accredited" className="footer-icef-logo" />
          </div>
        </div>
        <hr className="my-4" />
        <div className="row">
          <div className="col-md-6 text-center text-md-start">
            <small>© {new Date().getFullYear()} GO CAMP International. All Rights Reserved.</small>
          </div>
          <div className="col-md-6 text-center text-md-end">
            <small>Powered by Graphicano</small>
          </div>
        </div>
      </div>
    </footer>
  );
}
