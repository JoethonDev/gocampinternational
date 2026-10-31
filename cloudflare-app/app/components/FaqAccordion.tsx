import { Link } from "react-router";
import { SafeRichText } from "./SafeRichText";
export type FaqItem={question?:string;answer?:string;q?:string;a?:string};
export function FaqAccordion({items,title,accordionId="faqAccordion"}:{items:FaqItem[];title:string;accordionId?:string}) {
  return <div className="row g-5"><div className="col-12"><div className="text-center mb-5"><h2 className="section-title">{title}</h2></div>
    {items.length>0?<div className="accordion" id={accordionId}>
      {items.map((faq,i)=><div key={i} className="accordion-item border-0 mb-3 shadow-sm" style={{borderRadius:12,overflow:"hidden"}}><h3 className="accordion-header"><button className={"accordion-button fw-bold"+(i===0?"":" collapsed")} type="button" data-bs-toggle="collapse" data-bs-target={"#"+accordionId+"-"+i} aria-expanded={i===0}>{faq.question||faq.q||"No question provided."}</button></h3>
        <div className={"accordion-collapse collapse"+(i===0?" show":"")} id={accordionId+"-"+i} data-bs-parent={"#"+accordionId}><div className="accordion-body"><SafeRichText html={faq.answer||faq.a||"No answer provided."}/></div></div></div>)}
      </div>:<p className="text-center">No FAQs to display at this time.</p>}
    <div className="text-center mt-5"><p className="text-muted mb-3">Still have questions?</p><Link to="/contact" className="btn btn-warning btn-lg"><i className="bi bi-envelope-fill me-2"/>Contact Us</Link></div>
  </div></div>;
}
