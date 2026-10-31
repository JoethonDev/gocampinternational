import {useState} from "react";
const fields:Record<string,string[]>={
  program:["card_image","card_tagline","card_highlights","modal_details","modal_description","modal_highlights","modal_schedule","modal_gallery","modal_includes","modal_excludes"],
  destination:["hero","intro","highlights","stats","programs","gallery","destination_gallery","faq","testimonials"],
  category:["hero","intro","sections","programs","gallery","testimonials"]
};
export function VisibilityOverrides({kind,initial}:{kind:"program"|"destination"|"category";initial:Record<string,unknown>}){
  const [values,setValues]=useState<Record<string,unknown>>(initial);
  return <section className="col-12 border rounded-3 p-3 mt-3">
    <input type="hidden" name="visibility_overrides" value={JSON.stringify(values)}/>
    <h2 className="h6 mb-1">Page visibility overrides</h2>
    <p className="small text-secondary mb-3">Inherit uses the global visibility setting. Use Show or Hide only when this particular item must behave differently.</p>
    <div className="row g-2">
      {fields[kind].map(key=>{
        const policyDisabled=(kind==="destination"||kind==="category")&&key.includes("gallery");
        const current=Object.hasOwn(values,key)?values[key]===true?"show":values[key]===false?"hide":"inherit":"inherit";
        return <div key={key} className="col-sm-6 col-lg-4"><label className="d-block border rounded-3 p-2 h-100">
          <span className="small text-capitalize d-block mb-1">{key.replaceAll("_"," ")}</span>
          <select className="form-select form-select-sm" value={policyDisabled?"hide":current} disabled={policyDisabled} onChange={e=>{
            const v=e.target.value;
            setValues(old=>{const next={...old};if(v==="inherit")delete next[key];else next[key]=v==="show";return next;});
          }}><option value="inherit">Inherit global</option><option value="show">Show</option><option value="hide">Hide</option></select>
          {policyDisabled&&<small className="text-secondary">Disabled by website policy</small>}
        </label></div>;
      })}
    </div>
  </section>;
}
