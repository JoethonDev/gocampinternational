import { Link } from "react-router";
import type { Route } from "./+types/faq";
import { loadDocument } from "../lib/catalog.server";
import { FaqAccordion, type FaqItem } from "../components/FaqAccordion";
export async function loader({context}:Route.LoaderArgs){return {items:await loadDocument<FaqItem[]>(context.cloudflare.env.DB,"faq")||[]};}
export function meta({}:Route.MetaArgs){return [{title:"Go Camp :: Frequently Asked Questions"},{name:"description",content:"Find answers to common questions about our summer camps, including safety, preparation, and program details."}];}
export default function Faq({loaderData}:Route.ComponentProps){return <div className="page-content"><div className="container-fluid p-0"><div className="position-relative"><img src="/images/faq_banner.webp" className="img-fluid w-100" style={{height:300,objectFit:"cover"}} alt="FAQ Banner"/><div className="position-absolute top-50 start-50 translate-middle text-center text-white"><h1 className="display-4 fw-bold">FAQ</h1></div></div></div>
  <div className="container py-5"><nav aria-label="breadcrumb"><ol className="breadcrumb"><li className="breadcrumb-item"><Link to="/">HOME</Link></li><li className="breadcrumb-item active" aria-current="page">FAQ</li></ol></nav>
  {loaderData.items.length>0?<FaqAccordion items={loaderData.items} title="Frequently Asked Questions"/>:<p className="alert alert-info">No FAQs available at the moment. Please check back later.</p>}
  </div></div>;}
