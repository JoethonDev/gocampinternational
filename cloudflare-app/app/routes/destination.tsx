import { Link, useRouteLoaderData } from "react-router";
import type { Route } from "./+types/destination";
import type { CatalogRecord } from "../lib/catalog.server";
import { findCatalog, listCatalog } from "../lib/catalog.server";
import { isVisible } from "../lib/visibility";
import { ProgramCard } from "../components/ProgramCard";
import { FaqAccordion, type FaqItem } from "../components/FaqAccordion";
export async function loader({params,context}:Route.LoaderArgs){
  const slug=params.slug||"";
  const destination=await findCatalog(context.cloudflare.env.DB,"destination",slug);
  if(!destination||destination.status==="trash")throw new Response("Not found",{status:404});
  const programs=destination.status==="coming-soon"?[]:await listCatalog(context.cloudflare.env.DB,"program");
  const ids=Array.isArray(destination.program_ids)?destination.program_ids:[];
  const byId=new Map(programs.map(x=>[x.id||x.slug,x]));
  return {destination,related:ids.map(id=>byId.get(id)).filter((x):x is CatalogRecord=>Boolean(x))};
}
export function meta({data}:Route.MetaArgs){
  return [{title:"Go Camp :: "+(data?.destination.name||"Destination")},{name:"description",content:String(data?.destination.tagline||"Discover Your Adventure").slice(0,160)}];
}
export default function Destination({loaderData}:Route.ComponentProps){
  const {destination:d,related}=loaderData;
  const root=useRouteLoaderData("root") as {settings:Record<string,unknown>}|undefined, settings=root?.settings||{};
  if(d.status==="coming-soon")return <div className="page-content"><div className="container text-center py-5 my-5"><h1 className="display-3 fw-bold text-brand-primary mb-4">Coming Soon</h1><h2 className="mb-3">{d.name} is not available yet.</h2><p className="lead text-muted mb-4">Please check back later for updates on this destination.</p><Link to="/" className="btn btn-primary btn-lg">Go to Homepage</Link></div></div>;
  const stats=Array.isArray(d.stats)?d.stats as Record<string,unknown>[]:[];
  const faq=Array.isArray(d.faq)?d.faq as FaqItem[]:[];
  const banner=String(d.banner||"/images/hero.webp");
  return <div className="page-content">
    {isVisible("destination","hero",d,settings)&&<section className="destination-hero position-relative overflow-hidden" style={{minHeight:"90vh"}} aria-label={d.name+" banner"}>
      <div className="container position-relative destination-hero-caption"><h1>{d.name}</h1></div>
      <div className="hero-background position-absolute top-0 start-0 w-100 h-100" style={{backgroundImage:"url("+JSON.stringify(banner)+")",backgroundSize:"cover",backgroundPosition:"center",backgroundAttachment:"fixed"}}/>
    </section>}
    {isVisible("destination","stats",d,settings)&&stats.length>0&&<section className="section-padding"><div className="container"><h2 className="section-title text-center">{d.name} By The Numbers</h2><div className="row g-4 justify-content-center">{stats.map((s,i)=><div key={i} className="col-sm-6 col-lg-3 text-center"><div className="fs-2 fw-bold">{String(s.number||"")}{String(s.suffix||"")}</div><p>{String(s.label||"")}</p></div>)}</div></div></section>}
    {isVisible("destination","intro",d,settings)&&Boolean(d.intro_text)&&<section className="section-padding bg-white" id="destination-intro"><div className="container"><div className="row align-items-center g-4">
      <div className={d.intro_image?"col-lg-7":"col-12"}><h2 className="section-title">Discover {d.name}</h2><div className="lead">{String(d.intro_text).replace(/<[^>]*>/g," ")}</div></div>
      {d.intro_image&&<div className="col-lg-5"><img className="img-fluid rounded-4 shadow-sm w-100" src={String(d.intro_image)} alt={d.name} loading="lazy"/></div>}
    </div></div></section>}
    {isVisible("destination","programs",d,settings)&&<section className="section-padding bg-light" id="programs"><div className="container"><div className="row g-4 justify-content-center">{related.map(p=><div className="col-lg-4 col-md-6" key={p.slug}><ProgramCard program={p} settings={settings}/></div>)}
      {(!Array.isArray(d.program_ids)||d.program_ids.length===0)&&<p className="text-center">No programs are currently available for this destination. Please check back soon!</p>}</div></div></section>}
    {isVisible("destination","faq",d,settings)&&faq.length>0&&<section className="section-padding"><div className="container"><FaqAccordion title={"Questions About "+d.name} items={faq} accordionId="destinationFaqAccordion"/></div></section>}
  </div>;
}
