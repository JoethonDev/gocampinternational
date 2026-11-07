import { Link } from "react-router";
import { usePublicContent } from "../../lib/public-content-react";

export function NotFoundPage() {
  const { text } = usePublicContent("errors");
  return (
    <div className="page-content">
      <title>{text("not-found-title")}</title>
      <div className="container text-center py-5 my-5">
        <h1 className="display-1 fw-bold text-brand-primary">404</h1>
        <h2 className="mb-4">{text("page-not-found")}</h2>
        <p className="lead text-muted mb-4">{text("not-found-description")}</p>
        <Link to="/" className="btn btn-primary btn-lg">
          <i className="bi bi-house-door-fill me-2" />
          {text("go-to-homepage")}
        </Link>
      </div>
    </div>
  );
}

export function ServiceErrorPage() {
  const { text } = usePublicContent("errors");
  return (
    <div className="page-content">
      <title>{text("service-error-title")}</title>
      <div className="container text-center py-5 my-5">
        <h1 className="display-4 fw-bold">{text("page-unavailable")}</h1>
        <p className="lead text-muted mb-4">{text("service-error-description")}</p>
        <Link to="/" className="btn btn-primary btn-lg">
          {text("go-to-homepage")}
        </Link>
      </div>
    </div>
  );
}
