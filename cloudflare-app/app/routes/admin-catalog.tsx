import { Form, Link, redirect, useNavigation } from "react-router";
import { useMemo, useState } from "react";
import type {Route} from "./+types/admin-catalog";
import { requireAdmin } from "../lib/admin.server";
import { changeBulkStatus,ensureKind } from "../lib/catalog-write.server";
import { listCatalog } from "../lib/catalog.server";
import { AdminShell } from "../components/AdminShell";
export function meta() {return [{title:"GoCamp Content Management"},{name:"robots",content:"noindex,nofollow"}];}
export async function loader({request,context,params}:Route.LoaderArgs) {
  const db=context.cloudflare.env.DB,session=await requireAdmin(request,db),kind=ensureKind(params.kind||"");
  const [records,allCategories,allDestinations]=await Promise.all([
    listCatalog(db,kind,false),
    kind==="program"?listCatalog(db,"category",false):Promise.resolve([]),
    kind==="program"?listCatalog(db,"destination",false):Promise.resolve([])
  ]);
  return {session,kind,records,allCategories,allDestinations,updated:new URL(request.url).searchParams.get("updated")};
}
export async function action({request,context,params}:Route.ActionArgs){
  const kind=ensureKind(params.kind||"");
  const n=await changeBulkStatus(request,context.cloudflare.env.DB,kind,await request.formData());
  return redirect("/admin/catalog/"+kind+"?updated="+n);
}
export default function Catalog({loaderData}:Route.ComponentProps) {
  const {session,kind,records,allCategories,allDestinations,updated}=loaderData;
  const [search,setSearch]=useState(""),[statusFilter,setStatusFilter]=useState(""),[categoryFilter,setCategoryFilter]=useState(""),[destinationFilter,setDestinationFilter]=useState("");
  const [selected,setSelected]=useState<string[]>([]);
  const visible=useMemo(()=>records.filter(item=>{
    if(search&&!((item.name+" "+item.slug+" "+String(item.category_slug||"")).toLowerCase().includes(search.toLowerCase())))return false;
    if(statusFilter&&item.status!==statusFilter)return false;
    if(kind==="program"&&categoryFilter&&item.category_slug!==categoryFilter)return false;
    if(kind==="program"&&destinationFilter&&!allDestinations.some(d=>d.slug===destinationFilter&&Array.isArray(d.program_ids)&&d.program_ids.includes(item.id||item.slug)))return false;
    return true;
  }),[records,kind,search,statusFilter,categoryFilter,destinationFilter,allDestinations]);
  const select=(slug:string,checked:boolean)=>setSelected(prev=>checked?[...new Set([...prev,slug])]:prev.filter(x=>x!==slug));
  const navigation=useNavigation();
  const title={program:"Programs",destination:"Destinations",category:"Program Categories"}[kind];
  const options=kind==="destination"?["active","inactive","coming-soon","trash"]:["active","inactive","trash"];
  return <AdminShell username={session.username} csrf={session.csrf}>
    <div className="d-flex justify-content-between align-items-center mb-4 gap-2"><h1 className="h3 mb-0">{title}</h1><Link className="btn btn-primary" to={"/admin/catalog/"+kind+"/new"}>+ Create</Link></div>
    {updated&&<div className="alert alert-success" role="status">{updated} item(s) updated.</div>}
    <div className="row g-2 mb-3 align-items-end">
      <div className="col-md-4"><label htmlFor="catalog-search" className="form-label small fw-semibold">Search</label><input id="catalog-search" className="form-control" placeholder="Name, ID or category" value={search} onChange={e=>setSearch(e.target.value)}/></div>
      <div className="col-6 col-md-2"><label className="form-label small fw-semibold">Status</label><select aria-label="Filter by status" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="form-select"><option value="">All statuses</option>{options.map(v=><option value={v} key={v}>{v}</option>)}</select></div>
      {kind==="program"&&<><div className="col-6 col-md-3"><label className="form-label small fw-semibold">Category</label><select aria-label="Filter by category" className="form-select" value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)}><option value="">All categories</option>{allCategories.map(v=><option value={v.slug} key={v.slug}>{v.name}</option>)}</select></div>
      <div className="col-12 col-md-3"><label className="form-label small fw-semibold">Destination</label><select aria-label="Filter by destination" className="form-select" value={destinationFilter} onChange={e=>setDestinationFilter(e.target.value)}><option value="">All destinations</option>{allDestinations.map(v=><option value={v.slug} key={v.slug}>{v.name}</option>)}</select></div></>}
    </div>
    <Form method="post" className="card shadow-sm"><input type="hidden" name="csrf" value={session.csrf}/><div className="card-body">
      <div className="d-flex flex-wrap gap-2 align-items-center mb-3"><label htmlFor="bulk-status" className="form-label mb-0">Bulk action</label>
        <select id="bulk-status" className="form-select" style={{maxWidth:220}} name="status" required defaultValue=""><option value="" disabled>Select status</option>{options.map(v=><option key={v} value={v}>{v}</option>)}</select>
        <button disabled={navigation.state!=="idle"||selected.length===0} className="btn btn-outline-primary">Apply to {selected.length} selected</button><span className="small text-secondary">{visible.length} of {records.length} records</span>
      </div>
      <div className="table-responsive"><table className="table table-hover align-middle"><thead><tr><th scope="col"><input type="checkbox" className="form-check-input" aria-label="Select all visible" checked={visible.length>0&&visible.every(x=>selected.includes(x.slug))} onChange={e=>setSelected(prev=>e.target.checked?[...new Set([...prev,...visible.map(x=>x.slug)])]:prev.filter(id=>!visible.some(x=>x.slug===id)))}/></th><th scope="col">Name</th><th scope="col">ID</th><th scope="col">Status</th><th scope="col">Edit</th></tr></thead><tbody>
        {visible.map(item=><tr key={item.slug}><td><input type="checkbox" name="ids" value={item.slug} checked={selected.includes(item.slug)} onChange={e=>select(item.slug,e.target.checked)} aria-label={"Select "+item.name}/></td><td>{item.name}</td><td><code>{item.slug}</code></td><td>{item.status}</td><td><Link to={"/admin/catalog/"+kind+"/"+item.slug} className="btn btn-sm btn-outline-primary">Edit</Link></td></tr>)}
      </tbody></table>{visible.length===0&&<p className="p-3">No matching records.</p>}</div>
    </div></Form>
  </AdminShell>;
}
