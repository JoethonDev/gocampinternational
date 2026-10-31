import { Links, Meta, Outlet, Scripts, ScrollRestoration, isRouteErrorResponse } from "react-router";
import type { Route } from "./+types/root";
import "./app.css";
export function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><head><meta charSet="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><Meta /><Links /></head><body><a className="visually-hidden-focusable" href="#main-content">Skip to main content</a>{children}<ScrollRestoration /><Scripts /></body></html>;
}
export default function App() { return <Outlet />; }
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const status = isRouteErrorResponse(error) ? error.status : 500;
  return <main id="main-content" className="migration-message"><h1>{status === 404 ? "Page not found" : "Migration preview unavailable"}</h1><p>This migration preview does not replace the existing GoCamp website.</p></main>;
}
