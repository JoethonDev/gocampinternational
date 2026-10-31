import { useMemo, useState } from "react";
import sourceAssets from "../legacy-images.json";
export function MediaSelector({id,label,name,initial,uploaded=[],externalValue,onChange}:{id:string;label:string;name?:string;initial:string;uploaded:string[];externalValue?:string;onChange?:(value:string)=>void}){
  const [local,setLocal]=useState(initial),[open,setOpen]=useState(false),[search,setSearch]=useState("");
  const value=externalValue??local;
  const setValue=(next:string)=>{if(externalValue===undefined)setLocal(next);onChange?.(next);};
  const all=useMemo(()=>[...new Set([...uploaded,...sourceAssets])], [uploaded]);
  const choices=useMemo(()=>all.filter(path=>path.toLowerCase().includes(search.toLowerCase())).slice(0,48),[all,search]);
  return <div><label className="form-label" htmlFor={id}>{label.replaceAll("_"," ")}</label>
    <div className="d-flex gap-2"><input className="form-control" id={id} name={name} value={value} onChange={e=>setValue(e.target.value)} maxLength={2048} placeholder="/images/..." />
      <button type="button" className="btn btn-outline-secondary text-nowrap" onClick={()=>setOpen(true)}>Browse</button></div>
    {value&&<img src={value} alt={"Preview: "+label} className="rounded border mt-2" style={{maxWidth:190,maxHeight:112,objectFit:"contain"}} loading="lazy" />}
    {open&&<div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{zIndex:1060,background:"rgba(15,23,42,.65)",padding:16}} role="presentation">
      <div role="dialog" aria-modal="true" aria-label={"Choose image for "+label} className="card shadow-lg border-0 w-100" style={{maxWidth:1000,maxHeight:"90vh"}}>
        <div className="card-header d-flex justify-content-between align-items-center gap-3"><h3 className="h5 m-0">Choose {label.replaceAll("_"," ")} image</h3><button type="button" className="btn-close" aria-label="Close media selector" onClick={()=>setOpen(false)}/></div>
        <div className="card-body overflow-auto"><p className="text-muted small">Browse committed PR40 images or images uploaded to R2. Search before opening to limit bandwidth.</p>
          <input autoFocus className="form-control mb-3" aria-label="Search image paths" placeholder="Search file names" value={search} onChange={e=>setSearch(e.target.value)}/>
          <div className="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-6 g-2">{choices.map(path=><div className="col" key={path}>
            <button type="button" className="card p-2 text-start w-100 h-100 border" onClick={()=>{setValue(path);setOpen(false);setSearch("");}}>
              <img src={path} alt="" style={{height:85,width:"100%",objectFit:"cover",borderRadius:6}} loading="lazy"/>
              <span className="small text-break" style={{fontSize:11}}>{path.split("/").at(-1)}</span></button>
          </div>)}</div>
          {choices.length===0&&<p className="text-secondary">No matches.</p>}
          {all.length>choices.length&&<p className="small text-secondary mt-3">Displaying up to 48 of {all.length} assets. Search to refine.</p>}
        </div><div className="card-footer d-flex justify-content-between"><a className="btn btn-sm btn-outline-primary" href="/admin/media" target="_blank" rel="noopener noreferrer">Upload a new image</a><button type="button" className="btn btn-sm btn-outline-secondary" onClick={()=>setOpen(false)}>Cancel</button></div>
      </div>
    </div>}
  </div>;
}
