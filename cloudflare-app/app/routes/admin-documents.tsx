import { Form, redirect, useNavigation } from "react-router";
import { useState } from "react";
import type {Route} from "./+types/admin-documents";
import {requireAdmin} from "../lib/admin.server";
import {saveDocument} from "../lib/catalog-write.server";
import {AdminShell} from "../components/AdminShell";
import {MediaSelector} from "../components/MediaSelector";
import {RichTextInput} from "../components/RichTextInput";

type Key="site_settings"|"faq"|"camp_memories";
type Item=Record<string,unknown>;
type Memory={image:string;caption:string;country:string;is_active:boolean;in_slider:boolean};
const sections:Record<string,string[]>={
  home:["hero","intro","destinations","featured_categories","testimonials"],
  destination:["hero","intro","highlights","stats","programs","gallery","destination_gallery","faq","testimonials"],
  category:["hero","intro","sections","programs","gallery","testimonials"],
  program:["card_image","card_tagline","card_highlights","modal_details","modal_description","modal_highlights","modal_schedule","modal_gallery","modal_includes","modal_excludes"]
};
const defaults:Record<string,Record<string,boolean>>={
  home:{hero:true,intro:true,destinations:true,featured_categories:true,testimonials:true},
  destination:{hero:true,intro:true,highlights:true,stats:true,programs:true,gallery:false,destination_gallery:false,faq:true,testimonials:true},
  category:{hero:true,intro:false,sections:false,programs:true,gallery:false,testimonials:true},
  program:{card_image:true,card_tagline:true,card_highlights:true,modal_details:true,modal_description:true,modal_highlights:true,modal_schedule:true,modal_gallery:false,modal_includes:false,modal_excludes:false}
};
const parseKey=(value:string):Key=>{
  if(value==="site_settings"||value==="faq"||value==="camp_memories")return value;
  throw new Response("Not Found",{status:404});
};
export function meta(){return [{title:"GoCamp Content Settings"},{name:"robots",content:"noindex,nofollow"}];}
export async function loader({request,context,params}:Route.LoaderArgs){
  const db=context.cloudflare.env.DB,session=await requireAdmin(request,db),key=parseKey(params.key||"");
  const row=await db.prepare("SELECT content_json,revision FROM site_documents WHERE key=?").bind(key).first<{content_json:string;revision:number}>();
  if(!row)throw new Response("Document not found",{status:404});
  const media=key==="camp_memories"?await db.prepare("SELECT id FROM media_assets WHERE is_public=1 ORDER BY created_at DESC LIMIT 300").all<{id:string}>():null;
  return {session,key,content:row.content_json,uploadedMedia:(media?.results||[]).map(x=>"/media/"+x.id),revision:row.revision,saved:new URL(request.url).searchParams.has("saved")};
}
export async function action({request,context,params}:Route.ActionArgs) {
  const key=parseKey(params.key||"");
  await saveDocument(request,context.cloudflare.env.DB,key,await request.formData());
  return redirect("/admin/documents/"+key+"?saved=1");
}
const text=(x:unknown)=>typeof x==="string"?x:"";
const object=(x:unknown):Item=>x&&typeof x==="object"&&!Array.isArray(x)?x as Item:{};
const array=(x:unknown):Item[]=>Array.isArray(x)?x as Item[]:[];
export default function Documents({loaderData}:Route.ComponentProps){
  const {session,key,content,revision,saved,uploadedMedia}=loaderData,nav=useNavigation();
  const [value,setValue]=useState<unknown>(()=>JSON.parse(content) as unknown);
  const [advanced,setAdvanced]=useState(false);
  const [raw,setRaw]=useState(()=>JSON.stringify(JSON.parse(content),null,2));
  const [errors,setErrors]=useState("");
  const title={site_settings:"Site Visibility and Settings",faq:"Global FAQs",camp_memories:"GoCamp Memories"}[key];
  const update=(next:unknown)=>{setValue(next);setRaw(JSON.stringify(next,null,2));setErrors("");};
  const setDoc=(field:string,changed:unknown)=>update({...object(value),[field]:changed});
  const entries=array(value);
  const memories=object(value),items=array(memories.items);
  const field=(name:string,val:unknown,onChange:(next:string)=>void,large=false)=><div className="mb-3"><label className="form-label fw-semibold" htmlFor={name}>{name.replaceAll("_"," ")}</label>
    {large?<textarea id={name} className="form-control" rows={4} value={text(val)} onChange={e=>onChange(e.target.value)}/>:<input id={name} className="form-control" value={text(val)} onChange={e=>onChange(e.target.value)}/>}</div>;
  const editItem=(index:number,patch:Item,source:Item[],setter:(next:Item[])=>void)=>setter(source.map((x,i)=>i===index?{...x,...patch}:x));
  const removeItem=(index:number,source:Item[],setter:(next:Item[])=>void)=>setter(source.filter((_,i)=>i!==index));
  const setItems=(next:Item[])=>setDoc("items",next);
  const setEntries=(next:Item[])=>update(next);
  const globals=object(object(value).global_visibility);
  return <AdminShell username={session.username} csrf={session.csrf}>
    <div className="d-flex flex-wrap justify-content-between gap-2 align-items-center mb-3"><div><h1 className="h3 mb-1">{title}</h1><p className="text-secondary mb-0">Edit content visually. Existing fields, ordering and unpublished records are preserved.</p></div>
      <button type="button" className="btn btn-sm btn-outline-secondary" onClick={()=>{setAdvanced(v=>!v);setErrors("");}}> {advanced?"Visual editor":"Advanced JSON editor"}</button></div>
    {saved&&<p className="alert alert-success" role="status">Changes saved. Your staging site reflects the updated content.</p>}
    {errors&&<p className="alert alert-danger" role="alert">{errors}</p>}
    <Form method="post" className="card border-0 shadow-sm" onSubmit={e=>{
      if(advanced){try{const next=JSON.parse(raw);setValue(next);}catch{e.preventDefault();setErrors("JSON is invalid. Correct it before saving.");}}
    }}>
      <div className="card-body p-3 p-md-4">
        <input type="hidden" name="csrf" value={session.csrf}/>
        <input type="hidden" name="revision" value={revision}/>
        <input type="hidden" name="content" value={advanced?raw:JSON.stringify(value)}/>
        {advanced?<><div className="alert alert-info">Advanced editor preserves all document keys. Use the visual editor for everyday changes.</div><textarea className="form-control font-monospace" rows={24} spellCheck={false} value={raw} onChange={e=>setRaw(e.target.value)} aria-label="Document JSON"/></>:
        key==="site_settings"?<><p className="small text-secondary">Global toggles affect every matching page unless that record has an explicit override. Hidden gallery sections remain disabled by the migration's site policy.</p>
          {sections.home&&Object.entries(sections).map(([entity,keys])=><section className="mb-4" key={entity}><h2 className="h5 text-capitalize border-bottom pb-2">{entity==="home"?"Homepage":entity+" pages"}</h2><div className="row g-2">{keys.map(k=>{
            const current=object(globals[entity]);
            const checked=Object.hasOwn(current,k)?Boolean(current[k]):defaults[entity]?.[k]??true;
            const isGallery=(entity==="destination"||entity==="category")&&k.includes("gallery");
            return <div className="col-sm-6 col-lg-4" key={k}><label className="d-flex align-items-center gap-3 border rounded-3 p-3 h-100" style={{cursor:isGallery?"not-allowed":"pointer",opacity:isGallery?.65:1}}>
              <input type="checkbox" className="form-check-input mt-0" checked={isGallery?false:checked} disabled={isGallery}
                onChange={e=>setDoc("global_visibility",{...globals,[entity]:{...current,[k]:e.target.checked}})}/>
              <span className="text-capitalize">{k.replaceAll("_"," ")}</span></label></div>;
          })}</div></section>)}</>:
        key==="faq"?<><p className="text-secondary small">Questions appear in this order. Answers may contain the source HTML for formatting.</p>
          {entries.map((q,i)=><section className="border rounded-3 p-3 mb-3" key={i}><div className="d-flex justify-content-between align-items-center mb-3"><strong>Question {i+1}</strong><button type="button" className="btn btn-sm btn-outline-danger" onClick={()=>removeItem(i,entries,setEntries)}>Remove</button></div>
            {field("question-"+i,q.question,v=>editItem(i,{question:v},entries,setEntries))}
            <RichTextInput label={"Answer "+(i+1)} initial={text(q.answer)} externalValue={text(q.answer)} onChange={v=>editItem(i,{answer:v},entries,setEntries)}/>
            <div className="d-flex gap-2"><button type="button" className="btn btn-sm btn-outline-secondary" disabled={i===0} onClick={()=>{const next=[...entries];[next[i-1],next[i]]=[next[i],next[i-1]];setEntries(next);}}>Move up</button>
              <button type="button" className="btn btn-sm btn-outline-secondary" disabled={i===entries.length-1} onClick={()=>{const next=[...entries];[next[i+1],next[i]]=[next[i],next[i+1]];setEntries(next);}}>Move down</button></div>
          </section>)}
          <button type="button" className="btn btn-outline-primary" onClick={()=>setEntries([...entries,{question:"",answer:""}])}>+ Add FAQ</button></>:
        <>{field("title",memories.title,v=>setDoc("title",v))}
          <label className="d-flex gap-2 align-items-center mb-4"><input type="checkbox" className="form-check-input" checked={memories.show_facebook!==false} onChange={e=>setDoc("show_facebook",e.target.checked)}/>Display Facebook feed beside memories</label>
          <div className="d-flex justify-content-between align-items-center"><h2 className="h5">Memory photos ({items.length})</h2><button type="button" className="btn btn-outline-primary btn-sm" onClick={()=>setItems([...items,{image:"",caption:"",country:"",is_active:true,in_slider:true}])}>+ Add photo</button></div>
          {items.map((m,i)=><section className="border rounded-3 p-3 mb-3" key={i}><div className="row g-3 align-items-start"><div className="col-md-3">
            {Boolean(m.image)&&<img src={String(m.image).startsWith("/")?String(m.image):"/images/"+String(m.image)} className="img-fluid rounded" alt={text(m.caption)} style={{maxHeight:180,objectFit:"cover"}} loading="lazy"/>}
          </div><div className="col-md-9"><div className="d-flex justify-content-between mb-2"><strong>Photo {i+1}</strong><button type="button" className="btn btn-sm btn-outline-danger" onClick={()=>removeItem(i,items,setItems)}>Remove</button></div>
            <MediaSelector id={"memory-image-"+i} label="Image" initial={text(m.image)} externalValue={text(m.image)} uploaded={uploadedMedia} onChange={v=>editItem(i,{image:v},items,setItems)}/>
            {(["caption","country"] as const).map(k=>field(k+"-"+i,m[k],v=>editItem(i,{[k]:v},items,setItems)))}
            {(["is_active","in_slider"] as const).map(k=><label className="form-check form-check-inline" key={k}><input type="checkbox" className="form-check-input" checked={m[k]!==false} onChange={e=>editItem(i,{[k]:e.target.checked},items,setItems)}/><span className="form-check-label">{k==="is_active"?"Active":"In slider"}</span></label>)}
            <div className="mt-2 d-flex gap-2"><button type="button" className="btn btn-sm btn-outline-secondary" disabled={i===0} onClick={()=>{const next=[...items];[next[i-1],next[i]]=[next[i],next[i-1]];setItems(next);}}>↑ Up</button><button type="button" className="btn btn-sm btn-outline-secondary" disabled={i===items.length-1} onClick={()=>{const next=[...items];[next[i+1],next[i]]=[next[i],next[i+1]];setItems(next);}}>↓ Down</button></div>
          </div></div></section>)}
        </>}
      </div><div className="card-footer bg-white d-flex align-items-center gap-3 px-4 py-3"><button disabled={nav.state!=="idle"} type="submit" className="btn btn-primary px-4">{nav.state!=="idle"?"Saving changes…":"Save changes"}</button><span className="small text-secondary">Revision {revision}; conflicting edits are rejected automatically.</span></div>
    </Form>
  </AdminShell>;
}
