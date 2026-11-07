import { usePublicContent } from "../../lib/public-content-react";
import { useFetcher } from "react-router";

const INTERESTS = [
  { value: "Sports", label: "interest-sports", icon: "fa-futbol" },
  { value: "Language", label: "interest-language", icon: "fa-language" },
  { value: "Leadership", label: "interest-leadership", icon: "fa-users" },
  { value: "Academic", label: "interest-academic", icon: "fa-graduation-cap" }
] as const;

function LeadForm() {
  const { text, visible } = usePublicContent("landing");
  const fetcher = useFetcher<{ success?: boolean; error?: string }>();
  return (
    <div className="lead-form-card">
      <div className="form-header">
        <h2 className="form-title">
          <i className="fas fa-gift" /> {text("get-your-free-consultation")}
        </h2>
        <p className="form-subtitle">
          {text("discover-the-perfect-program-for-your-teen-in-60-seconds")}
        </p>
      </div>
      {visible("show-urgency") && (
        <div className="urgency-banner">
          <i className="fas fa-clock" /> <span>{text("limited-spots-for-summer-2025")}</span>
        </div>
      )}
      <div role="status" aria-live="polite">
        {fetcher.data?.success && (
          <div className="alert alert-success">
            {text("your-request-was-saved-our-team-can-review-it-in-the-inquiries-inbox")}
          </div>
        )}
        {fetcher.data?.error && <div className="alert alert-danger">{fetcher.data.error}</div>}
      </div>
      <fetcher.Form id="landingPageForm" method="post" action="/landing">
        <input type="hidden" name="source" value="Landing Page" />
        <div className="hp-field" aria-hidden="true">
          <label>
            Leave empty
            <input type="text" name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="landing-name">
            {text("child-s-full-name")}
            <span className="required">*</span>
          </label>
          <div className="input-icon">
            <i className="fas fa-user" />
            <input
              id="landing-name"
              type="text"
              name="name"
              className="form-control"
              placeholder={text("placeholder-e-g-ahmed-mohamed")}
              required
              maxLength={100}
            />
          </div>
        </div>
        <div className="row">
          <div className="col-md-6">
            <div className="form-group">
              <label htmlFor="landing-age" className="form-label">
                {text("child-s-age")}
                <span className="required">*</span>
              </label>
              <select id="landing-age" name="age" className="form-select" defaultValue="" required>
                <option value="">{text("select-age")}</option>
                {Array.from({ length: 12 }, (_, index) => index + 7).map((age) => (
                  <option key={age} value={age}>
                    {age} {text("years-old")}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="col-md-6">
            <div className="form-group">
              <label htmlFor="landing-gender" className="form-label">
                {text("gender")}
                <span className="required">*</span>
              </label>
              <select
                id="landing-gender"
                name="gender"
                className="form-select"
                defaultValue=""
                required
              >
                <option value="">{text("select-gender")}</option>
                <option value="Male">{text("male")}</option>
                <option value="Female">{text("female")}</option>
              </select>
            </div>
          </div>
        </div>
        <div className="form-group">
          <p className="form-label">
            {text("what-interests-your-child")}
            <small>{text("select-all-that-apply")}</small>
          </p>
          <div className="interest-grid">
            {INTERESTS.map((interest) => (
              <div className="interest-option" key={interest.value}>
                <input
                  type="checkbox"
                  id={`landing-${interest.value.toLowerCase()}`}
                  name="interests[]"
                  value={interest.value}
                />
                <label
                  className="interest-label"
                  htmlFor={`landing-${interest.value.toLowerCase()}`}
                >
                  <i className={`fas ${interest.icon}`} />
                  <span>{text(interest.label)}</span>
                </label>
              </div>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="landing-email" className="form-label">
            {text("parent-s-email")}
            <span className="required">*</span>
          </label>
          <div className="input-icon">
            <i className="fas fa-envelope" />
            <input
              id="landing-email"
              type="email"
              name="email"
              className="form-control"
              placeholder={text("placeholder-parent-example-com")}
              required
              maxLength={254}
            />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="landing-phone" className="form-label">
            {text("parent-s-phone-whatsapp")}
            <span className="required">*</span>
          </label>
          <div className="input-icon">
            <i className="fab fa-whatsapp" />
            <input
              id="landing-phone"
              type="tel"
              name="phone"
              className="form-control"
              placeholder={text("placeholder-20-123-456-7890")}
              required
              maxLength={30}
            />
          </div>
        </div>
        <div className="form-group">
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              id="landing-consent"
              name="privacyConsent"
              required
            />
            <label className="form-check-label" htmlFor="landing-consent">
              {text("i-agree-to-receive-personalized-program-recommendations")}
            </label>
          </div>
        </div>
        <div className="d-grid">
          <button
            type="submit"
            disabled={fetcher.state !== "idle"}
            className="btn btn-warning btn-lg btn-submit-landing"
          >
            <i className="fas fa-rocket" />{" "}
            {fetcher.state !== "idle" ? text("submitting") : text("get-my-free-consultation")}
          </button>
        </div>
      </fetcher.Form>
      <div className="form-trust">
        <div className="trust-item">
          <i className="fas fa-shield-alt" />
          <span>{text("100-secure")}</span>
        </div>
        <div className="trust-item">
          <i className="fas fa-clock" />
          <span>{text("reply-in-2-hours")}</span>
        </div>
      </div>
    </div>
  );
}

export function LandingPage() {
  const { text, visible } = usePublicContent("landing");
  const BENEFITS = [
    {
      icon: "fa-shield-alt",
      title: text("benefits.safety-you-can-trust"),
      description: text("benefits.safety-description")
    },
    {
      icon: "fa-chart-line",
      title: text("benefits.proven-academic-results"),
      description: text("benefits.results-description")
    },
    {
      icon: "fa-globe-americas",
      title: text("benefits.global-network"),
      description: text("benefits.network-description")
    }
  ];
  const STATS = [
    [text("stats.20"), text("stats.years-experience")],
    [text("stats.25"), text("stats.countries")],
    [text("stats.98"), text("stats.satisfaction")]
  ];
  const USPS = [
    [text("usps.safe-supervised"), text("usps.24-7-care-with-certified-staff")],
    [text("usps.proven-results"), text("usps.95-boost-in-confidence-language-skills")],
    [text("usps.premium-experience"), text("usps.top-facilities-across-25-countries")]
  ];
  return (
    <div className="page-content landing-page">
      {visible("show-hero") && (
        <section className="hero-landing">
          <div className="container">
            <div className="row align-items-center">
              <div
                className={visible("show-form") ? "col-lg-6 mb-5 mb-lg-0" : "col-12 mb-5 mb-lg-0"}
              >
                <h1 className="hero-headline">
                  {text("transform-your-teen-s-future-with")}{" "}
                  <span className="highlight">{text("global-adventures")}</span>
                </h1>
                <p className="hero-subheadline">
                  {text("elite-international-programs-combining-language-mastery-leadership-ski")}
                </p>
                <ul className="hero-usp-list">
                  {USPS.map(([title, description]) => (
                    <li key={title}>
                      <i className="fas fa-check-circle" />
                      <strong>{title}</strong>
                      {description}
                    </li>
                  ))}
                </ul>
                {visible("show-stats") && (
                  <div className="hero-stats">
                    <div className="row">
                      {STATS.map(([number, label]) => (
                        <div className="col-4 stat-item" key={label}>
                          <span className="stat-number">{number}</span>
                          <span className="stat-label">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {visible("show-form") && (
                <div className="col-lg-6 form-container">
                  <LeadForm />
                </div>
              )}
            </div>
          </div>
        </section>
      )}
      <section hidden={!visible("show-benefits")} className="why-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">{text("why-10-000-parents-trust-us")}</h2>
            <p className="section-subtitle">
              {text("more-than-just-a-summer-camp-it-s-a-life-changing-experience")}
            </p>
          </div>
          <div className="row g-4">
            {BENEFITS.map((benefit) => (
              <div className="col-lg-4 col-md-6" key={benefit.title}>
                <div className="benefit-card">
                  <div className="benefit-icon">
                    <i className={`fas ${benefit.icon}`} />
                  </div>
                  <h3 className="benefit-title">{benefit.title}</h3>
                  <p className="benefit-text">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section hidden={!visible("show-guarantee")} className="guarantee-section">
        <div className="container">
          <div className="guarantee-badge">
            <i className="fas fa-award" />
          </div>
          <h2 className="guarantee-title">{text("our-100-satisfaction-guarantee")}</h2>
          <p className="guarantee-text">
            {text("your-satisfaction-and-your-child-s-safety-are-our-top-priorities-we-st")}
          </p>
        </div>
      </section>
    </div>
  );
}
