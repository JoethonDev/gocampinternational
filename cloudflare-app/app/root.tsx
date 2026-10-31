import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
  useNavigation,
  useRouteLoaderData
} from "react-router";
import type { Route } from "./+types/root";
import { listCategories, listDestinations, loadDocument } from "./lib/catalog.server";
import type { CategoryRecord, DestinationRecord, SiteSettings } from "./lib/domain";
import { SiteHeader } from "./components/site/SiteHeader";
import { SiteFooter } from "./components/site/SiteFooter";
import { SITE } from "./config/site";
import { LeadModal } from "./components/LeadModal";
import { SiteInteractions } from "./components/SiteInteractions";
import { NotFoundPage, ServiceErrorPage } from "./components/ui/ErrorPages";
import "./app.css";
import "./styles/motion.css";

export async function loader({ request, context }: Route.LoaderArgs) {
  const environment = context.cloudflare.env.GOCAMP_ENV;
  const origin = new URL(request.url).origin;
  if (new URL(request.url).pathname.startsWith("/admin")) {
    return { destinations: [], categories: [], settings: {}, environment, origin };
  }
  const db = context.cloudflare.env.DB;
  const [destinations, categories, settings] = await Promise.all([
    listDestinations(db),
    listCategories(db),
    loadDocument<SiteSettings>(db, "site_settings")
  ]);
  return {
    destinations,
    categories,
    settings: settings || {},
    environment,
    origin
  };
}

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700&family=Open+Sans:wght@400;600&display=swap"
  },
  {
    rel: "stylesheet",
    href: "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
  },
  {
    rel: "stylesheet",
    href: "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"
  },
  {
    rel: "stylesheet",
    href: "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/css/all.min.css"
  },
  { rel: "stylesheet", href: "/css/style.css" },
  { rel: "stylesheet", href: "/css/programs-theme.css" },
  { rel: "stylesheet", href: "/css/ux-enhancements.css" },
  { rel: "stylesheet", href: "/css/design-system.css" }
];

export function Layout({ children }: { children: React.ReactNode }) {
  const data = useRouteLoaderData("root") as
    { destinations: DestinationRecord[]; categories: CategoryRecord[] } | undefined;
  const location = useLocation();
  const navigation = useNavigation();
  const isAdmin = location.pathname.startsWith("/admin");
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href={SITE.images.favicon} />
        <Meta />
        <Links />
      </head>
      <body className={isAdmin ? "gc-admin-route" : undefined}>
        <div
          className={"gc-route-progress" + (navigation.state !== "idle" ? " is-active" : "")}
          aria-hidden="true"
        />
        <a className="visually-hidden-focusable" href="#main-content">
          Skip to main content
        </a>
        {!isAdmin && (
          <SiteHeader categories={data?.categories || []} destinations={data?.destinations || []} />
        )}
        <main id="main-content">
          <div className="gc-route-view" key={location.key}>
            {children}
          </div>
        </main>
        {!isAdmin && (
          <>
            <SiteFooter />
            <LeadModal />
            <SiteInteractions />
          </>
        )}
        <script
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
          defer
        />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const status = isRouteErrorResponse(error) ? error.status : 500;
  return status === 404 ? <NotFoundPage /> : <ServiceErrorPage />;
}
