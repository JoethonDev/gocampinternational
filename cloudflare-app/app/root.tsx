import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration, useRouteLoaderData, useLocation } from "react-router";
import type { Route } from "./+types/root";
import { listCatalog, loadDocument } from "./lib/catalog.server";
import type { CatalogRecord } from "./lib/catalog.server";
import { SiteHeader, SiteFooter } from "./components/SiteShell";
import { LeadModal } from "./components/LeadModal";
import { SiteInteractions } from "./components/SiteInteractions";
import "./app.css";
export async function loader({request,context}:Route.LoaderArgs) {
  if(new URL(request.url).pathname.startsWith('/admin'))return {destinations:[],categories:[],settings:{},environment:context.cloudflare.env.GOCAMP_ENV};
  const db = context.cloudflare.env.DB;
  const [destinations,categories,settings] = await Promise.all([
    listCatalog(db,"destination"), listCatalog(db,"category"), loadDocument<Record<string,unknown>>(db,"site_settings")
  ]);
  return {destinations,categories,settings:settings || {},environment:context.cloudflare.env.GOCAMP_ENV};
}
export const links: Route.LinksFunction = () => [
  {rel:"preconnect",href:"https://fonts.googleapis.com"},
  {rel:"preconnect",href:"https://fonts.gstatic.com",crossOrigin:"anonymous"},
  {rel:"stylesheet",href:"https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700&family=Open+Sans:wght@400;600&display=swap"},
  {rel:"stylesheet",href:"https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"},
  {rel:"stylesheet",href:"https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"},
  {rel:"stylesheet",href:"https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/css/all.min.css"},
  {rel:"stylesheet",href:"/css/style.css"},
  {rel:"stylesheet",href:"/css/programs-theme.css"},
  {rel:"stylesheet",href:"/css/ux-enhancements.css"},
  {rel:"stylesheet",href:"/css/design-system.css"}
];
export function Layout({children}:{children:React.ReactNode}) {
  const data=useRouteLoaderData("root") as {destinations:CatalogRecord[];categories:CatalogRecord[]} | undefined;
  const isAdmin=useLocation().pathname.startsWith("/admin");
  return <html lang="en"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="icon" href="/images/favi.png"/><Meta/><Links/></head>
    <body><a className="visually-hidden-focusable" href="#main-content">Skip to main content</a>
      {!isAdmin&&<SiteHeader categories={data?.categories || []} destinations={data?.destinations || []}/>}<main id="main-content">{children}</main>{!isAdmin&&<><SiteFooter/><LeadModal/><SiteInteractions/></>}
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" defer/>
      <ScrollRestoration/><Scripts/></body></html>;
}
export default function App(){return <Outlet/>;}
export function ErrorBoundary({error}:Route.ErrorBoundaryProps){
  const status=isRouteErrorResponse(error)?error.status:500;
  return <div className="page-content container py-5 my-5"><h1>{status===404?"Page not found":"Page unavailable"}</h1><p>{status===404?"The requested page does not exist.":"The migration preview could not load this page."}</p></div>;
}
