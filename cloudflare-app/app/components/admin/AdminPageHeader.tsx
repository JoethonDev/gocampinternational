import { Link } from "react-router";

export function AdminPageHeader({
  title,
  description,
  aside,
  backLink
}: {
  title: string;
  description?: string;
  aside?: React.ReactNode;
  backLink?: { to: string; label: string };
}) {
  return (
    <header className="admin-page-header">
      <div className="admin-page-heading">
        {backLink && (
          <Link to={backLink.to} className="admin-back-link">
            <i className="bi bi-arrow-left" aria-hidden="true" /> {backLink.label}
          </Link>
        )}
        <h1 className="admin-page-title">{title}</h1>
        {description && <p className="admin-page-description">{description}</p>}
      </div>
      {aside && <div className="admin-page-actions">{aside}</div>}
    </header>
  );
}
