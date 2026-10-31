import { useRouteLoaderData } from "react-router";
import type { Route } from "./+types/category";
import { findCatalog, listCatalog, type CatalogRecord } from "../lib/catalog.server";
import { ProgramCard } from "../components/ProgramCard";
import { isVisible } from "../lib/visibility";
export async function loader({request,context}:Route.LoaderArgs){
  const slug=new URL(request.url).searchParams.get("category")||"";
  const db=context.cloudflare.env.DB;
  const cat=await findCatalog(db,"category",slug);
  if(!cat||cat.status!=="active")throw new Response("Not Found",{status:404});
  const [programs,destinations]=await Promise.all([listCatalog(db,"program"),listCatalog(db,"destination",false)]);
  const related=programs.filter(p=>p.category_slug===cat.slug).filter(p=>{
    const linked=destinations.find(d=>Array.isArray(d.program_ids)&&d.program_ids.includes(p.id||p.slug));
    return !linked||linked.status!=="trash";
  }).sort((a,b)=>Number(a.order??Number.MAX_SAFE_INTEGER)-Number(b.order??Number.MAX_SAFE_INTEGER)||a.name.localeCompare(b.name));
  return {category:cat,related};
}
export function meta({data}:Route.MetaArgs){return [{title:"Go Camp :: "+(data?.category.name||"Programs")},{name:"description",content:String(data?.category.intro||"").replace(/<[^>]*>/g,"").slice(0,160)}];}
export default function Category({loaderData}:Route.ComponentProps){
  const {category:c,related}=loaderData;
  const root=useRouteLoaderData("root") as {settings:Record<string,unknown>}|undefined, settings=root?.settings||{};
  const sections=Array.isArray(c.sections)?c.sections as Array<Record<string,unknown>>:[];
  return <div className="page-content">
    {isVisible("category","hero",c,settings)&&<section className="hero-section" aria-label={c.name+" banner"} style={{position:"relative",minHeight:500,backgroundImage:"url("+JSON.stringify(String(c.banner||"/images/hero.webp"))+")",backgroundSize:"cover",backgroundPosition:"center",backgroundAttachment:"fixed",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",textAlign:"center"}}><div className="container position-relative category-hero-caption"><h1>{c.name}</h1></div></section>}
    <div className="bg-light border-bottom"><div className="container py-2"><nav aria-label="breadcrumb"><ol className="breadcrumb mb-0"><li className="breadcrumb-item"><a href="/">HOME</a></li><li className="breadcrumb-item active" aria-current="page">{c.name.toUpperCase()}</li></ol></nav></div></div>
    {isVisible("category","intro",c,settings)&&Boolean(c.intro)&&<section className="intro-section"><div className="container"><div className="row align-items-center g-5"><div className="col-lg-6"><div className="intro-card"><h2 className="mb-4">Discover {c.name}</h2><div className="lead">{String(c.intro).replace(/<[^>]*>/g," ")}</div></div></div>{c.intro_image&&<div className="col-lg-6"><img src={String(c.intro_image)} alt={c.name+" Introduction"} className="img-fluid intro-image" loading="lazy"/></div>}</div></div></section>}
    {isVisible("category","sections",c,settings)&&sections.filter(s=>s.is_active!==false).map((section,i)=><section key={i} className="section-content" style={{backgroundColor:i%2?"#f8f9fa":"#fff"}}><div className="container"><div className="row align-items-center g-5"><div className={"col-lg-6"+(i%2?" order-lg-2":"")}><div className="content-card"><h2>{String(section.title||"")}</h2><div className="text-muted">{String(section.content||"").replace(/<[^>]*>/g," ")}</div></div></div>{Boolean(section.image)&&<div className={"col-lg-6"+(i%2?" order-lg-1":"")}><img src={String(section.image)} alt={String(section.title||"")} className="img-fluid content-image" loading="lazy"/></div>}</div></div></section>)}
    {isVisible("category","programs",c,settings)&&related.length>0&&<section className="section-content bg-light" id="category-programs"><div className="container"><div className="row g-4 justify-content-center">{related.map(p=><div className="col-lg-4 col-md-6 d-flex align-items-stretch" key={p.slug}><ProgramCard program={p} settings={settings}/></div>)}</div></div></section>}
  </div>;
}
