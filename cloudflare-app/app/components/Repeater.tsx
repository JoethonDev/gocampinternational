import { useState } from "react";
export type RepeaterField={key:string;label:string;kind?:"text"|"long"|"flag"};
export function Repeater({name,title,initial,fields}:{name:string;title:string;initial:Record<string,unknown>[];fields:RepeaterField[]}){
  const [rows,setRows]=useState<Record<string,unknown>[]>(initial);
  const edit=(idx:number,k:string,value:unknown)=>setRows(old=>old.map((v,i)=>i===idx?{...v,[k]:value}:v));
  return <section className="col-12 border rounded-3 p-3 mt-3" aria-label={title}>
    <input type="hidden" name={"json_"+name} value={JSON.stringify(rows)}/>
    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3"><h2 className="h6 mb-0">{title} <span className="text-secondary">({rows.length})</span></h2>
      <button type="button" className="btn btn-sm btn-outline-primary" onClick={()=>setRows(x=>[...x,Object.fromEntries(fields.map(f=>[f.key,f.kind==="flag"?true:""]))])}>+ Add</button></div>
    {rows.map((row,i)=><div className="card border mb-2 shadow-sm" key={i}><div className="card-body p-3">
      <div className="d-flex align-items-center justify-content-between mb-2"><strong className="small text-secondary">{title} #{i+1}</strong><button type="button" className="btn btn-sm btn-outline-danger" onClick={()=>setRows(old=>old.filter((_,j)=>j!==i))}>Remove</button></div>
      <div className="row g-2">{fields.map(f=><div className={f.kind==="long"?"col-12":"col-sm-6"} key={f.key}>
        {f.kind==="flag"?<label className="form-check mt-3"><input className="form-check-input" type="checkbox" checked={row[f.key]!==false} onChange={e=>edit(i,f.key,e.target.checked)}/><span className="form-check-label">{f.label}</span></label>:
        <><label className="form-label small" htmlFor={name+"-"+i+"-"+f.key}>{f.label}</label>
        {f.kind==="long"?<textarea className="form-control" id={name+"-"+i+"-"+f.key} rows={3} value={String(row[f.key]??"")} onChange={e=>edit(i,f.key,e.target.value)}/>:
        <input className="form-control" id={name+"-"+i+"-"+f.key} value={String(row[f.key]??"")} onChange={e=>edit(i,f.key,e.target.value)}/>}</>}
      </div>)}</div>
      <div className="d-flex gap-2 mt-2">{[[-1,"Move up"],[1,"Move down"]].map(([step,label])=><button key={String(step)} type="button" disabled={i+Number(step)<0||i+Number(step)>=rows.length} className="btn btn-sm btn-outline-secondary" onClick={()=>setRows(old=>{const result=[...old],other=i+Number(step);[result[i],result[other]]=[result[other],result[i]];return result;})}>{label}</button>)}</div>
    </div></div>)}
    {rows.length===0&&<p className="small text-secondary mb-0">No entries. Use Add to create the first one.</p>}
  </section>;
}
