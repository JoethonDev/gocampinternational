import { Form, redirect, useNavigation } from "react-router";
import { useMemo, useState } from "react";
import type {Route} from "./+types/admin-inquiries";
import { requireAdmin, verifyAdminPost } from "../lib/admin.server";
import { AdminShell } from "../components/AdminShell";
export function meta(){return [{title:"GoCamp Inquiries"},{name:"robots",content:"noindex,nofollow"}];}
export async function loader({request,context}:Route.LoaderArgs){
  const db=context.cloudflare.env.DB,session=await requireAdmin(request,db);
  const rows=await db.prepare("SELECT id,kind,name,email,phone,status,content_json,created_at FROM inquiries ORDER BY created_at DESC LIMIT 250").all<{id:string;kind:string;name:string;email:string;phone:string;status:string;content_json:string;created_at:number}>();
  return {session,rows:rows.results,updated:new URL(request.url).searchParams.has("updated")};
}
export async function action({request,context}:Route.ActionArgs){
  const db=context.cloudflare.env.DB,form=await request.formData();
  await verifyAdminPost(request,db,form);
  const id=String(form.get("id")||""),status=String(form.get("status")||"");
  if(!/^[a-f0-9-]{36}$/i.test(id)||!["new","read","replied","archived"].includes(status))throw new Response("Invalid request",{status:400});
  const res=await db.prepare("UPDATE inquiries SET status=?,updated_at=unixepoch() WHERE id=?").bind(status,id).run();
  if(res.meta.changes!==1)throw new Response("Inquiry not found",{status:404});
  return redirect("/admin/inquiries?updated=1");
}
export default function Inquiries({loaderData}:Route.ComponentProps){
  const {session,rows,updated}=loaderData;const nav=useNavigation();
  const [search,setSearch]=useState(""),[statusFilter,setStatusFilter]=useState(""),[kindFilter,setKindFilter]=useState("");
  const visible=useMemo(()=>rows.filter(r=>{
    const q=search.toLowerCase();return (!q||(r.name+" "+r.email+" "+r.phone+" "+r.id).toLowerCase().includes(q))&&(!statusFilter||r.status===statusFilter)&&(!kindFilter||r.kind===kindFilter);
  }),[rows,search,statusFilter,kindFilter]);
  return <AdminShell username={session.username} csrf={session.csrf}><h1 className="h3 mb-3">Inquiries & Leads</h1>
    {updated&&<p role="status" className="alert alert-success">Inquiry updated.</p>}
    <div className="row g-2 align-items-end mb-3">
      <div className="col-md-6"><label className="form-label small fw-semibold" htmlFor="inquiry-search">Search by name, email or phone</label><input id="inquiry-search" className="form-control" value={search} onChange={e=>setSearch(e.target.value)}/></div>
      <div className="col-6 col-md-3"><label className="form-label small fw-semibold">Status</label><select className="form-select" value={statusFilter} aria-label="Inquiry status filter" onChange={e=>setStatusFilter(e.target.value)}><option value="">All statuses</option>{["new","read","replied","archived"].map(x=><option key={x}>{x}</option>)}</select></div>
      <div className="col-6 col-md-3"><label className="form-label small fw-semibold">Type</label><select className="form-select" value={kindFilter} aria-label="Inquiry type filter" onChange={e=>setKindFilter(e.target.value)}><option value="">All types</option>{["contact","lead","newsletter"].map(x=><option key={x}>{x}</option>)}</select></div>
    </div><p className="small text-secondary">{visible.length} of {rows.length} inquiries</p>
    <div className="table-responsive card shadow-sm"><table className="table mb-0"><thead><tr><th>Received</th><th>Type</th><th>Contact</th><th>Details</th><th>Status</th></tr></thead><tbody>{visible.map(row=><tr key={row.id}>
      <td>{new Date(row.created_at*1000).toLocaleString()}</td><td>{row.kind}</td><td><strong>{row.name}</strong><div><a href={"mailto:"+row.email}>{row.email}</a></div><div>{row.phone}</div></td>
      <td><details><summary className="btn btn-sm btn-outline-secondary">View details</summary><div className="mt-2 border rounded p-2" style={{minWidth:220}}>
        {Object.entries(JSON.parse(row.content_json) as Record<string,unknown>).map(([key,value])=><div key={key} className="small border-bottom py-1"><strong className="text-capitalize">{key.replaceAll("_"," ")}:</strong> <span className="text-break">{typeof value==="object"?JSON.stringify(value):String(value??"")}</span></div>)}
        <div className="d-flex flex-wrap gap-1 mt-2"><a className="btn btn-sm btn-outline-primary" href={"mailto:"+row.email}>Email parent</a>{row.phone.replace(/[^\d]/g,"").length>=8&&<a className="btn btn-sm btn-outline-success" href={"https://wa.me/"+row.phone.replace(/[^\d]/g,"")} target="_blank" rel="noopener noreferrer">WhatsApp</a>}</div>
      </div></details></td>
      <td><Form method="post" className="d-flex gap-2"><input type="hidden" name="csrf" value={session.csrf}/><input type="hidden" name="id" value={row.id}/><select name="status" defaultValue={row.status} className="form-select form-select-sm">{["new","read","replied","archived"].map(v=><option key={v}>{v}</option>)}</select><button disabled={nav.state!=="idle"} className="btn btn-outline-primary btn-sm">Save</button></Form></td>
    </tr>)}</tbody></table>{visible.length===0&&<p className="p-3 mb-0">No matching inquiries.</p>}</div>
  </AdminShell>;
}
