import { Link } from "react-router";

export function NotFoundPage() {
  return (
    <div className="page-content">
      <title>Page Not Found (404)</title>
      <div className="container text-center py-5 my-5">
        <h1 className="display-1 fw-bold text-brand-primary">404</h1>
        <h2 className="mb-4">Page Not Found</h2>
        <p className="lead text-muted mb-4">
          Sorry, the page you are looking for does not exist or has been moved.
        </p>
        <Link to="/" className="btn btn-primary btn-lg">
          <i className="bi bi-house-door-fill me-2" />
          Go to Homepage
        </Link>
      </div>
    </div>
  );
}

export function ServiceErrorPage() {
  return (
    <div className="page-content">
      <title>Page unavailable | GoCamp</title>
      <div className="container text-center py-5 my-5">
        <h1 className="display-4 fw-bold">Page unavailable</h1>
        <p className="lead text-muted mb-4">The page could not be loaded. Please try again.</p>
        <Link to="/" className="btn btn-primary btn-lg">
          Go to Homepage
        </Link>
      </div>
    </div>
  );
}
