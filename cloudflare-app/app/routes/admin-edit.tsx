import { Form, Link, redirect, useNavigation } from "react-router";
import type {Route} from "./+types/admin-edit";
import { requireAdmin } from "../lib/admin.server";
import { saveEntity,ensureKind } from "../lib/catalog-write.server";
import { AdminShell } from "../components/AdminShell";
import { listCatalog } from "../lib/catalog.server";
import { Repeater } from "../components/Repeater";
export function meta(){return [{title:"Edit GoCamp Content"},{name:"robots",content:"noindex,nofollow"}];}
export async function loader({request,context,params}:Route.LoaderArgs){
  const db=context.cloudflare.env.DB,session=await requireAdmin(request,db),kind=ensureKind(params.kind||"");
  const slug=params.slug||"",isNew=slug==="new";
  if(!isNew&&!/^[a-z0-9][a-z0-9_-]{0,159}$/.test(slug))throw new Response("Invalid ID",{status:404});
  const row=isNew?null:await db.prepare("SELECT content_json,revision FROM catalog_entities WHERE kind=? AND slug=?").bind(kind,slug).first<{content_json:string;revision:number}>();
  if(!isNew&&!row)throw new Response("Not found",{status:404});
  const categories=kind==="program"?await listCatalog(db,"category",false):[];
  return {session,kind,slug,isNew,item:row?JSON.parse(row.content_json) as Record<string,unknown>:{},revision:row?.revision||0,categories,saved:new URL(request.url).searchParams.has("saved")};
}
export async function action({request,context,params}:Route.ActionArgs){
  const kind=ensureKind(params.kind||""),slug=params.slug||"";
  const value=await saveEntity(request,context.cloudflare.env.DB,kind,await request.formData(),slug==="new"?undefined:slug);
  return redirect("/admin/catalog/"+kind+"/"+value+"?saved=1");
}
const v=(o:Record<string,unknown>,k:string)=>typeof o[k]==="string"?o[k] as string:"";
const lines=(v:unknown)=>Array.isArray(v)?v.join("\n"):"";
export default function Edit({loaderData}:Route.ComponentProps){
  const {session,kind,slug,isNew,item,revision,categories,saved}=loaderData;
  const navigation=useNavigation();
  const overrides=item.visibility_overrides?JSON.stringify(item.visibility_overrides,null,2):"";
  return <AdminShell username={session.username} csrf={session.csrf}>
    <div className="d-flex align-items-center gap-3 mb-4"><Link to={"/admin/catalog/"+kind}>← Back</Link><h1 className="h3 mb-0">{isNew?"Create":"Edit"} {kind}</h1></div>
    {saved&&<div className="alert alert-success" role="status">Saved successfully.</div>}
    <Form method="post" className="card shadow-sm"><div className="card-body row g-3">
      <input type="hidden" name="csrf" value={session.csrf}/><input type="hidden" name="revision" value={revision}/>
      <div className="col-md-6"><label className="form-label" htmlFor="entitySlug">ID / Slug</label><input className="form-control" id="entitySlug" name="slug" required maxLength={160} pattern="[a-z0-9][a-z0-9_-]*" defaultValue={isNew?"":slug} readOnly={!isNew}/></div>
      <div className="col-md-6"><label className="form-label" htmlFor="entityName">Name</label><input required className="form-control" id="entityName" name="name" maxLength={160} defaultValue={v(item,"name")}/></div>
      <div className="col-md-6"><label className="form-label" htmlFor="entityStatus">Status</label><select className="form-select" id="entityStatus" name="status" defaultValue={v(item,"status")||"active"}>{(kind==="destination"?["active","inactive","coming-soon","trash"]:["active","inactive","trash"]).map(s=><option value={s} key={s}>{s}</option>)}</select></div>
      {kind==="program"&&<><div className="col-md-6"><label className="form-label">Category</label><select className="form-select" name="category_slug" defaultValue={v(item,"category_slug")}><option value="">Uncategorized</option>{categories.map(c=><option value={c.slug} key={c.slug}>{c.name}</option>)}</select></div>
        {(["image","tagline","price","level","color","duration","order"] as const).map(k=><div className="col-md-6" key={k}><label className="form-label" htmlFor={k}>{k}</label><input className="form-control" id={k} name={k} defaultValue={item[k]==null?"":String(item[k])}/></div>)}
        {(["min","max"] as const).map(k=><div className="col-md-6" key={k}><label className="form-label" htmlFor={"age-"+k}>Age {k}</label><input type="number" min="0" max="120" className="form-control" id={"age-"+k} name={"ages_"+k} defaultValue={String((item.ages as Record<string,unknown>|undefined)?.[k]??(k==="min"?0:99))}/></div>)}
        <div className="col-12"><label className="form-label" htmlFor="description">Description (HTML source preserved)</label><textarea className="form-control" rows={6} name="description" id="description" defaultValue={v(item,"description")}/></div>
        {(["highlights","includes","excludes","badges","gallery"] as const).map(k=><div className="col-md-6" key={k}><label className="form-label" htmlFor={k}>{k} (one per line)</label><textarea className="form-control" id={k} name={k} rows={4} defaultValue={lines(item[k])}/></div>)}
        <Repeater name="schedule" title="Daily schedule" initial={Object.entries((item.schedule as Record<string,unknown>)||{}).map(([time,description])=>({time,description}))} fields={[{key:"time",label:"Time"},{key:"description",label:"Activity / description",kind:"long"}]}/>
      </>}
      {kind==="destination"&&<>{(["banner","tagline","intro_image"] as const).map(k=><div className="col-md-6" key={k}><label className="form-label" htmlFor={k}>{k}</label><input className="form-control" id={k} name={k} defaultValue={v(item,k)}/></div>)}
        <div className="col-12"><label className="form-label" htmlFor="intro_text">Introduction</label><textarea className="form-control" rows={5} id="intro_text" name="intro_text" defaultValue={v(item,"intro_text")}/></div>
        <div className="col-12"><label className="form-label" htmlFor="program_ids">Associated program IDs (one per line)</label><textarea className="form-control" id="program_ids" name="program_ids" rows={6} defaultValue={lines(item.program_ids)}/></div>
        <Repeater name="highlights" title="Destination highlights" initial={Array.isArray(item.highlights)?item.highlights as Record<string,unknown>[]:[]} fields={[{key:"icon",label:"Icon"},{key:"text",label:"Highlight text"}]}/>
        <Repeater name="stats" title="Destination statistics" initial={Array.isArray(item.stats)?item.stats as Record<string,unknown>[]:[]} fields={[{key:"number",label:"Number"},{key:"suffix",label:"Suffix"},{key:"label",label:"Label"},{key:"icon",label:"Icon"}]}/>
        <Repeater name="faq" title="Destination FAQs" initial={Array.isArray(item.faq)?item.faq as Record<string,unknown>[]:[]} fields={[{key:"q",label:"Question"},{key:"a",label:"Answer",kind:"long"}]}/>
      </>}
      {kind==="category"&&<>{(["banner","intro_image","color"] as const).map(k=><div className="col-md-6" key={k}><label className="form-label" htmlFor={k}>{k}</label><input className="form-control" id={k} name={k} defaultValue={v(item,k)}/></div>)}
        <div className="col-12"><label className="form-label" htmlFor="intro">Introduction</label><textarea className="form-control" name="intro" id="intro" rows={5} defaultValue={v(item,"intro")}/></div>
        <Repeater name="sections" title="Category content sections" initial={Array.isArray(item.sections)?item.sections as Record<string,unknown>[]:[]} fields={[{key:"title",label:"Section title"},{key:"image",label:"Image path"},{key:"content",label:"Content (HTML allowed)",kind:"long"},{key:"is_active",label:"Visible",kind:"flag"}]}/>
        <div className="col-12"><label htmlFor="category_gallery" className="form-label">Category gallery images (one path per line)</label><textarea id="category_gallery" name="gallery" className="form-control" rows={3} defaultValue={lines(item.gallery)}/></div>
      </>}
      <div className="col-12"><label className="form-label" htmlFor="visibility_overrides">Visibility overrides (JSON object)</label><textarea className="form-control font-monospace" id="visibility_overrides" name="visibility_overrides" rows={5} defaultValue={overrides}/><p className="small text-muted mt-2">Empty = keep existing overrides. Global visibility is under Settings.</p></div>
      <div className="col-12"><button disabled={navigation.state!=="idle"} className="btn btn-primary px-4">{navigation.state!=="idle"?"Saving...":"Save changes"}</button></div>
    </div></Form>
  </AdminShell>;
}
