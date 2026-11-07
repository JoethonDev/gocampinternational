import { getCloudflare } from "./lib/cloudflare-context";
import { isProduction } from "./lib/environment.server";
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
import {
  readPublicContent,
  DEFAULT_PUBLIC_CONTENT,
  publicSite,
  publicContentGroupsForPath,
  type PublicContent
} from "./lib/public-content";
import { safeJsonLd } from "./lib/seo";
import { isSeoIndexingAllowed } from "./lib/seo-discovery.server";
import { isAnalyticsCollectionEnabled, webAnalyticsSiteTag } from "./lib/analytics";
import { LeadModal } from "./components/LeadModal";
import { SiteInteractions } from "./components/SiteInteractions";
import { NotFoundPage, ServiceErrorPage } from "./components/ui/ErrorPages";
import "./app.css";
import "./styles/motion.css";

export async function loader({ request, context }: Route.LoaderArgs) {
  const env = getCloudflare(context).env;
  const environment = env.GOCAMP_ENV;
  const requestUrl = new URL(request.url);
  const seoIndexingAllowed = isSeoIndexingAllowed(requestUrl, env);
  const origin = isProduction(env) ? "https://gocampinternational.net" : requestUrl.origin;
  if (new URL(request.url).pathname.startsWith("/admin")) {
    return {
      destinations: [],
      categories: [],
      settings: {},
      environment,
      origin,
      seoIndexingAllowed: false,
      analyticsEnabled: false,
      webAnalyticsSiteTag: undefined,
      publicContent: {}
    };
  }
  const db = getCloudflare(context).env.DB;
  const [destinations, categories, settings] = await Promise.all([
    listDestinations(db),
    listCategories(db),
    loadDocument<SiteSettings>(db, "site_settings")
  ]);
  const savedSettings = settings || {};
  const { public_content: _publicContent, ...pageSettings } = savedSettings;
  return {
    destinations,
    categories,
    settings: pageSettings,
    publicContent: readPublicContent(
      savedSettings.public_content,
      publicContentGroupsForPath(requestUrl.pathname)
    ),
    environment,
    origin,
    seoIndexingAllowed,
    analyticsEnabled: isAnalyticsCollectionEnabled(env, requestUrl),
    webAnalyticsSiteTag: webAnalyticsSiteTag(env, requestUrl)
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
    | {
        destinations: DestinationRecord[];
        categories: CategoryRecord[];
        origin: string;
        publicContent: PublicContent;
        analyticsEnabled?: boolean;
        webAnalyticsSiteTag?: string;
      }
    | undefined;
  const content = data?.publicContent || DEFAULT_PUBLIC_CONTENT;
  const SITE = publicSite(content);
  const location = useLocation();
  const navigation = useNavigation();
  const isAdmin = location.pathname.startsWith("/admin");
  const base = data?.origin || "https://gocampinternational.net";
  return (
    <html lang="en" data-analytics-enabled={data?.analyticsEnabled ? "true" : "false"}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href={SITE.images.favicon} />
        {!isAdmin && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: safeJsonLd({
                "@context": "https://schema.org",
                "@graph": [
                  {
                    "@type": "Organization",
                    "@id": base + "/#organization",
                    name: SITE.name,
                    url: base + "/",
                    logo: new URL(SITE.images.logo, base).href,
                    email: SITE.email || undefined,
                    telephone: SITE.phone || undefined,
                    sameAs: [
                      SITE.social.facebook,
                      SITE.social.instagram,
                      SITE.social.linkedin
                    ].filter(Boolean)
                  },
                  {
                    "@type": "WebSite",
                    "@id": base + "/#website",
                    url: base + "/",
                    name: SITE.name,
                    publisher: { "@id": base + "/#organization" },
                    inLanguage: "en"
                  }
                ]
              })
            }}
          />
        )}
        {!isAdmin && data?.webAnalyticsSiteTag && (
          <script
            type="module"
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={JSON.stringify({ token: data.webAnalyticsSiteTag })}
          />
        )}
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
        {!isAdmin && content.header?.["show-navigation"] !== false && (
          <SiteHeader categories={data?.categories || []} destinations={data?.destinations || []} />
        )}
        <main id="main-content" key={location.key} className="gc-route-view">
          {children}
        </main>
        {!isAdmin && (
          <>
            {content.footer?.["show-footer"] !== false && (
              <SiteFooter
                categories={data?.categories || []}
                destinations={data?.destinations || []}
              />
            )}
            {content.booking?.["show-booking"] !== false && <LeadModal />}
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
