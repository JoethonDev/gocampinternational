import { Form, Link, useLocation } from "react-router";
import { useEffect, useState } from "react";
import { ADMIN_NAV, ADMIN_NAV_GROUPS } from "../../config/admin";
import { useAdminTheme } from "../../hooks/useAdminTheme";
import "../../admin.css";

function isActivePath(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function currentSection(pathname: string) {
  return [...ADMIN_NAV]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => isActivePath(pathname, item.href));
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const section = currentSection(location.pathname);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div data-bs-theme={theme} className="admin-workspace">
      <button
        type="button"
        className={"admin-sidebar-backdrop" + (mobileOpen ? " show" : "")}
        aria-label="Close navigation"
        onClick={() => setMobileOpen(false)}
      />
      <aside id="admin-sidebar" className={"admin-sidebar" + (mobileOpen ? " open" : "")}>
        <div className="admin-brand">
          <Link to="/admin" className="admin-brand-mark">
            <i className="bi bi-compass" />
          </Link>
          <div>
            <Link to="/admin" className="admin-brand-name">
              GoCamp
            </Link>
            <div className="admin-brand-subtitle">Content studio</div>
          </div>
        </div>
        <nav className="admin-sidebar-nav" aria-label="Admin navigation">
          {ADMIN_NAV_GROUPS.map((group) => (
            <div className="admin-nav-group" key={group.label}>
              <div className="admin-nav-label">{group.label}</div>
              {group.items.map((item) => {
                const active = isActivePath(location.pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    aria-current={active ? "page" : undefined}
                    className={"admin-nav-link" + (active ? " active" : "")}
                  >
                    <i className={`bi ${item.icon}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <div className="admin-user-chip">
            <span className="admin-avatar">{username.slice(0, 1).toUpperCase()}</span>
            <div>
              <strong>{username}</strong>
              <span className="admin-env-badge">staging</span>
            </div>
          </div>
          <Form method="post" action="/admin/logout">
            <input type="hidden" name="csrf" value={csrf} />
            <button className="btn btn-sm btn-outline-secondary w-100">
              <i className="bi bi-box-arrow-right me-1" /> Log out
            </button>
          </Form>
        </div>
      </aside>
      <div className="admin-shell-main">
        <header className="admin-topbar">
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary admin-menu-toggle"
              aria-label="Open navigation"
              aria-controls="admin-sidebar"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((open) => !open)}
            >
              <i className="bi bi-list" />
            </button>
            <div>
              <div className="admin-breadcrumb">Admin / {section?.label || "Dashboard"}</div>
              <div className="admin-topbar-title">{section?.label || "Dashboard"}</div>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <Link
              to="/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-outline-secondary admin-topbar-action"
            >
              <i className="bi bi-box-arrow-up-right me-1" /> View site
            </Link>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              aria-pressed={theme === "dark"}
            >
              <i className={`bi bi-${theme === "dark" ? "sun" : "moon-stars"}`} />
            </button>
          </div>
        </header>
        <div className="admin-main">{children}</div>
      </div>
    </div>
  );
}
