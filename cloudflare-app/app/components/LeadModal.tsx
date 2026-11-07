import { usePublicContent } from "../lib/public-content-react";
import { useFetcher } from "react-router";
import { trackBusinessEvent } from "../lib/analytics.client";

const PROGRAM_TYPES = [
  { value: "Language & Activity Camps", label: "program-language-camps" },
  { value: "Adult Academic Programs", label: "program-adult-academic" },
  { value: "Young Leader Programs", label: "program-young-leader" },
  { value: "Soccer Camps", label: "program-soccer" },
  { value: "Special Interests Camps", label: "program-special-interests" }
] as const;

type LeadResult = { success?: boolean; error?: string; message?: string };

function LeadForm() {
  const { text } = usePublicContent("booking");
  const fetcher = useFetcher<LeadResult>();
  return (
    <>
      <div className="status-message mb-3" role="status">
        {fetcher.data?.success ? (
          <div className="alert alert-success">{fetcher.data.message}</div>
        ) : fetcher.data?.error ? (
          <div className="alert alert-danger">{fetcher.data.error}</div>
        ) : null}
      </div>
      <fetcher.Form method="post" action="/api/submit-lead.php" id="leadForm">
        <input type="hidden" name="source" value="Modal CTA" />
        <div className="hp-field" aria-hidden="true">
          <label>
            Leave empty
            <input type="text" name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <div className="mb-3">
          <label htmlFor="nameInput" className="form-label">
            {text("full-name")}
          </label>
          <input
            className="form-control"
            name="name"
            id="nameInput"
            placeholder={text("placeholder-e-g-ahmed-hassan")}
            required
            maxLength={100}
          />
        </div>
        <div className="mb-3">
          <label htmlFor="emailInput" className="form-label">
            {text("email-address")}
          </label>
          <input
            className="form-control"
            type="email"
            name="email"
            id="emailInput"
            placeholder={text("placeholder-you-example-com")}
            required
            maxLength={254}
          />
        </div>
        <div className="mb-3">
          <label htmlFor="phoneInput" className="form-label">
            {text("phone-number")}
          </label>
          <input
            className="form-control"
            name="phone"
            id="phoneInput"
            placeholder={text("placeholder-20-123-456-7890")}
            required
            maxLength={30}
          />
        </div>
        <div className="mb-3">
          <label htmlFor="interestSelect" className="form-label">
            {text("i-m-interested-in")}
          </label>
          <select
            className="form-select"
            name="interest"
            id="interestSelect"
            required
            defaultValue=""
          >
            <option value="" disabled>
              {text("choose-a-program-type")}
            </option>
            {PROGRAM_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {text(type.label)}
              </option>
            ))}
          </select>
        </div>
        <div className="d-grid mt-4">
          <button
            disabled={fetcher.state !== "idle"}
            type="submit"
            className="btn btn-warning btn-lg fw-bold"
          >
            {fetcher.state !== "idle" ? text("sending") : text("book-a-free-call")}
          </button>
        </div>
      </fetcher.Form>
    </>
  );
}

export function LeadModal() {
  const { text, site: SITE } = usePublicContent("booking");
  return (
    <>
      <div
        className="modal fade"
        id="ctaModal"
        tabIndex={-1}
        aria-labelledby="ctaModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title fw-bold" id="ctaModalLabel">
                {text("ready-for-an-adventure")}
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              />
            </div>
            <div className="modal-body">
              <p className="text-muted mb-4">
                {text("leave-your-details-below-and-one-of-our-camp-experts-will-contact-you-")}
              </p>
              <LeadForm />
            </div>
          </div>
        </div>
      </div>
      <div id="mobileCtaBar" className="d-lg-none">
        <a
          href={SITE.phoneHref}
          className="btn btn-outline-light flex-fill fw-bold"
          onClick={() => trackBusinessEvent("contact_cta_click", "mobile_phone", SITE.phoneHref)}
        >
          {text("call")}
        </a>
        <button
          type="button"
          className="btn btn-warning flex-fill fw-bold"
          data-bs-toggle="modal"
          data-bs-target="#ctaModal"
          onClick={() => trackBusinessEvent("lead_form_open", "mobile_book_now")}
        >
          {text("book-a-free-call")}
        </button>
      </div>
    </>
  );
}
