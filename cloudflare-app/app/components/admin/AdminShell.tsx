import { Form, Link, useLocation } from "react-router";
import { ADMIN_NAV } from "../../config/admin";
import { useAdminTheme } from "../../hooks/useAdminTheme";
import "../../admin.css";

function isActivePath(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({
  username,
  csrf,
  children
}: {
  username: string;
  csrf: string;
  children: React.ReactNode;
}) {
  const location = useLocation();
  const { theme, toggleTheme } = useAdminTheme();

  return (
    <div data-bs-theme={theme} className="admin-workspace">
      <header className="admin-toolbar d-flex flex-wrap gap-2 align-items-center justify-content-between px-3 px-md-4 py-3">
        <div>
          <Link to="/admin" className="text-decoration-none h3 fw-bold">
            GoCamp Admin
          </Link>
          <div className="text-secondary small">Cloudflare migration staging</div>
        </div>
        <div className="d-flex align-items-center gap-3">
          <span className="text-secondary small">{username}</span>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            aria-pressed={theme === "dark"}
          >
            <i className={`bi bi-${theme === "dark" ? "sun" : "moon-stars"} me-1`} />
            {theme === "dark" ? "Light" : "Dark"}
          </button>
          <Form method="post" action="/admin/logout">
            <input type="hidden" name="csrf" value={csrf} />
            <button className="btn btn-sm btn-outline-secondary">Log out</button>
          </Form>
        </div>
      </header>
      <nav
        aria-label="Admin navigation"
        className="d-flex flex-wrap gap-2 px-3 px-md-4 py-2 admin-nav"
      >
        {ADMIN_NAV.map((item) => {
          const active = isActivePath(location.pathname, item.href);
          return (
            <Link
              key={item.href}
              aria-current={active ? "page" : undefined}
              className={`btn btn-sm ${active ? "btn-primary" : "btn-outline-primary"}`}
              to={item.href}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <main className="admin-main container py-4">{children}</main>
    </div>
  );
}
