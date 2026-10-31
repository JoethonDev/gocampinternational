import { Form, Link, redirect, useActionData, useNavigation } from "react-router";
import type { Route } from "./+types/admin-login";
import { getAdmin, login } from "../lib/admin.server";
import { useAdminTheme } from "../hooks/useAdminTheme";
import { SITE } from "../config/site";
import "../admin-login.css";

export function meta() {
  return [{ title: "Admin Login | GoCamp" }, { name: "robots", content: "noindex,nofollow" }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  if (await getAdmin(request, context.cloudflare.env.DB)) {
    throw redirect("/admin");
  }
  return null;
}

export async function action({ request, context }: Route.ActionArgs) {
  const form = await request.formData();
  const result = await login(request, context.cloudflare.env.DB, context.cloudflare.env, form);
  if ("cookie" in result && result.cookie) {
    return redirect("/admin", {
      headers: { "Set-Cookie": result.cookie, "Cache-Control": "no-store" }
    });
  }
  return Response.json(
    { error: result.error },
    { status: result.status, headers: { "Cache-Control": "no-store" } }
  );
}

export default function AdminLogin() {
  const data = useActionData<typeof action>() as { error?: string } | undefined;
  const navigation = useNavigation();
  const { theme } = useAdminTheme();

  return (
    <div data-bs-theme={theme} className="gc-admin-login">
      <aside className="gc-admin-login-brand">
        <Link to="/" className="gc-admin-login-logo">
          <img src={SITE.images.logo} alt={SITE.name} />
        </Link>
        <div className="gc-admin-login-brand-copy">
          <p className="gc-admin-login-eyebrow">GoCamp content studio</p>
          <h1>Run your camp website from one calm workspace.</h1>
          <p>
            Manage programs, destinations, media, visibility and inquiries without touching the
            source files.
          </p>
          <ul>
            <li>
              <i className="bi bi-shield-check" /> Staging-only access
            </li>
            <li>
              <i className="bi bi-layers" /> Visual catalog editing
            </li>
            <li>
              <i className="bi bi-chat-square-text" /> Inquiry inbox
            </li>
          </ul>
        </div>
        <Link to="/" className="gc-admin-login-public">
          View public site <i className="bi bi-box-arrow-up-right" />
        </Link>
      </aside>
      <div className="gc-admin-login-panel">
        <section className="gc-admin-login-card" aria-label="Admin sign-in">
          <div className="text-center mb-4">
            <div className="gc-admin-login-mobile-logo">
              <img src={SITE.images.logo} alt={SITE.name} />
            </div>
            <h2 className="h4 mb-2 fw-bold">Welcome back</h2>
            <p className="text-secondary small mb-0">Sign in to continue to the content studio.</p>
          </div>
          {data?.error && (
            <div
              role="alert"
              className="alert alert-danger border-0 shadow-sm d-flex align-items-center"
            >
              <i className="bi bi-exclamation-circle-fill me-2" />
              {data.error}
            </div>
          )}
          <Form method="post">
            <div className="form-floating mb-3">
              <input
                required
                type="text"
                autoComplete="username"
                className="form-control"
                name="username"
                id="username"
                maxLength={100}
                placeholder="Username"
              />
              <label htmlFor="username">
                <i className="bi bi-person me-1" /> Username
              </label>
            </div>
            <div className="form-floating mb-4">
              <input
                required
                type="password"
                autoComplete="current-password"
                className="form-control"
                name="password"
                id="password"
                maxLength={512}
                placeholder="Password"
              />
              <label htmlFor="password">
                <i className="bi bi-lock me-1" /> Password
              </label>
            </div>
            <button
              disabled={navigation.state !== "idle"}
              className="btn btn-lg btn-primary rounded-pill shadow-sm w-100"
              type="submit"
            >
              {navigation.state !== "idle" ? "Signing in..." : "Sign In"}
              <i className="bi bi-arrow-right ms-2" />
            </button>
          </Form>
          <div className="gc-admin-login-footer">
            <span>
              © {new Date().getFullYear()} {SITE.name}
            </span>
            <Link to="/">Back to website</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
