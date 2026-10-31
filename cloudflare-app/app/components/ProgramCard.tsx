import type { CatalogRecord } from "../lib/catalog.server";
import { isVisible } from "../lib/visibility";
type Props={program:CatalogRecord;settings:Record<string,unknown>};
export function ProgramCard({program,settings}:Props){
  const age=program.ages && typeof program.ages==="object" ? program.ages as Record<string,unknown> : {};
  const min=Number(age.min||0),max=Number(age.max||0);
  const ageLabel=min>0 ? String(min)+(max>0?"-"+max:"+") : "";
  const highlights=Array.isArray(program.highlights)?program.highlights.filter(x=>typeof x==="string") as string[]:[];
  return <div className="program-card-modern position-relative h-100"><div className="card border-0 shadow-lg h-100 overflow-hidden" style={{borderRadius:20}}>
    {isVisible("program","card_image",program,settings)&&<div className="position-relative overflow-hidden program-card-media" style={{height:280}}>
      <img src={String(program.image||"/images/placeholder.webp")} alt={program.name} className="card-img-top h-100 w-100 object-fit-cover program-card-image" loading="lazy"/>
      <div className="position-absolute bottom-0 start-0 w-100 h-100" style={{background:"linear-gradient(to top,rgba(0,0,0,.8),transparent 60%)"}}/>
      {ageLabel&&<div className="position-absolute bottom-0 start-0 w-100 p-3"><div className="d-flex align-items-center gap-3 text-white"><div className="d-flex align-items-center bg-white bg-opacity-25 rounded-pill px-3 py-2"><i className="bi bi-people-fill me-2"/><span className="fw-bold">{ageLabel} years</span></div></div></div>}
    </div>}
    <div className="card-body p-4 d-flex flex-column">
      <h3 className="card-title fw-bold mb-2 text-brand-dark fs-4">{program.name}</h3>
      {program.tagline&&isVisible("program","card_tagline",program,settings)&&<p className="card-text text-muted mb-3">{String(program.tagline)}</p>}
      {highlights.length>0&&isVisible("program","card_highlights",program,settings)&&<div className="mb-3"><ul className="list-unstyled mb-0">{highlights.map((h,i)=><li className="mb-2 d-flex align-items-start" key={i}><i className="bi bi-check-circle-fill text-brand-primary me-2 mt-1"/><span className="text-dark">{h}</span></li>)}</ul></div>}
    </div>
  </div></div>;
}
