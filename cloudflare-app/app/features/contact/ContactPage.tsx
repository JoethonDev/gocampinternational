import { useFetcher } from "react-router";
import { PageBanner } from "../../components/ui/PageBanner";
import { Breadcrumbs } from "../../components/ui/Breadcrumbs";
import { SITE } from "../../config/site";

type ContactResult = { success?: boolean; error?: string; message?: string };

function ContactForm() {
  const fetcher = useFetcher<ContactResult>();
  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body p-4 p-md-5">
        <h3 className="card-title mb-4">Send Us a Message</h3>
        <fetcher.Form method="post" action="/api/submit-contact.php" id="contactForm">
          <div className="hp-field" aria-hidden="true">
            <label>
              Leave empty
              <input name="website" type="text" tabIndex={-1} autoComplete="off" />
            </label>
          </div>
          <div className="status-message mb-3" role="status" aria-live="polite">
            {fetcher.data?.success ? (
              <div className="alert alert-success">{fetcher.data.message}</div>
            ) : fetcher.data?.error ? (
              <div className="alert alert-danger">{fetcher.data.error}</div>
            ) : null}
          </div>
          <div className="row g-3">
            <div className="col-md-6">
              <label htmlFor="contact-name" className="form-label">
                Name *
              </label>
              <input
                type="text"
                id="contact-name"
                name="name"
                className="form-control"
                maxLength={100}
                required
              />
            </div>
            <div className="col-md-6">
              <label htmlFor="contact-email" className="form-label">
                Email *
              </label>
              <input
                type="email"
                id="contact-email"
                name="email"
                className="form-control"
                maxLength={254}
                required
              />
            </div>
            <div className="col-md-6">
              <label htmlFor="contact-phone" className="form-label">
                Phone
              </label>
              <input
                type="tel"
                id="contact-phone"
                name="phone"
                className="form-control"
                maxLength={30}
              />
            </div>
            <div className="col-md-6">
              <label htmlFor="contact-country" className="form-label">
                Country
              </label>
              <input
                type="text"
                id="contact-country"
                name="country"
                className="form-control"
                maxLength={100}
              />
            </div>
            <div className="col-12">
              <label htmlFor="contact-subject" className="form-label">
                Subject
              </label>
              <input
                type="text"
                id="contact-subject"
                name="subject"
                className="form-control"
                maxLength={200}
              />
            </div>
            <div className="col-12">
              <label htmlFor="contact-message" className="form-label">
                Message
              </label>
              <textarea
                id="contact-message"
                name="message"
                className="form-control"
                rows={5}
                maxLength={5000}
              />
            </div>
            <div className="col-12 text-end">
              <button
                type="submit"
                disabled={fetcher.state !== "idle"}
                className="btn btn-warning btn-lg"
              >
                {fetcher.state !== "idle" ? "Sending..." : "Send Message"}
              </button>
            </div>
          </div>
        </fetcher.Form>
      </div>
    </div>
  );
}

function ContactCard() {
  return (
    <div className="card border-0 shadow-sm h-100 contact-card">
      <div className="card-body p-4 p-md-5 d-flex flex-column justify-content-center align-items-center text-center">
        <div className="mb-4 position-relative">
          <img
            src={SITE.images.profile}
            alt={SITE.director}
            className="rounded-circle shadow-lg contact-avatar"
          />
        </div>
        <h3 className="fw-bold text-white mb-1">{SITE.director}</h3>
        <p className="text-white-50 fs-5 mb-4 text-uppercase fw-semibold">{SITE.directorTitle}</p>
        <div className="d-flex flex-column gap-3 w-100 px-md-3">
          <a
            href={SITE.phoneHref}
            className="btn btn-outline-light border-0 py-3 px-4 d-flex align-items-center justify-content-start gap-3 rounded-3 contact-action"
          >
            <div className="bg-white text-primary rounded-circle d-flex align-items-center justify-content-center contact-action-icon">
              <i className="bi bi-telephone-fill" />
            </div>
            <span className="fs-5 fw-semibold">{SITE.phone}</span>
          </a>
          <a
            href={SITE.emailHref}
            className="btn btn-outline-light border-0 py-3 px-4 d-flex align-items-center justify-content-start gap-3 rounded-3 contact-action"
          >
            <div className="bg-white text-primary rounded-circle d-flex align-items-center justify-content-center contact-action-icon">
              <i className="bi bi-envelope-fill" />
            </div>
            <span className="fs-5 fw-semibold text-truncate w-100 text-start">{SITE.email}</span>
          </a>
        </div>
      </div>
    </div>
  );
}

export function ContactPage() {
  return (
    <>
      <PageBanner
        image={SITE.images.contactBanner}
        alt="Contact Us Banner"
        title="Contact Us"
        hiddenTitle
      />
      <div className="container py-5">
        <Breadcrumbs items={[{ label: "HOME", to: "/" }, { label: "CONTACT US" }]} />
        <div className="text-center mb-5">
          <h2 className="section-title">Get in touch! We'd love to hear from you.</h2>
        </div>
        <div className="row g-4">
          <div className="col-lg-7">
            <ContactForm />
          </div>
          <div className="col-lg-5">
            <ContactCard />
          </div>
        </div>
      </div>
    </>
  );
}
