import { Form, redirect, useNavigation } from "react-router";
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
  return <AdminShell username={session.username} csrf={session.csrf}><h1 className="h3 mb-3">Inquiries & Leads</h1>
    {updated&&<p role="status" className="alert alert-success">Inquiry updated.</p>}
    <div className="table-responsive card shadow-sm"><table className="table mb-0"><thead><tr><th>Received</th><th>Type</th><th>Contact</th><th>Details</th><th>Status</th></tr></thead><tbody>{rows.map(row=><tr key={row.id}>
      <td>{new Date(row.created_at*1000).toLocaleString()}</td><td>{row.kind}</td><td><strong>{row.name}</strong><div><a href={"mailto:"+row.email}>{row.email}</a></div><div>{row.phone}</div></td>
      <td><pre className="small" style={{whiteSpace:"pre-wrap",maxWidth:350}}>{JSON.stringify(JSON.parse(row.content_json),null,2).slice(0,1800)}</pre></td>
      <td><Form method="post" className="d-flex gap-2"><input type="hidden" name="csrf" value={session.csrf}/><input type="hidden" name="id" value={row.id}/><select name="status" defaultValue={row.status} className="form-select form-select-sm">{["new","read","replied","archived"].map(v=><option key={v}>{v}</option>)}</select><button disabled={nav.state!=="idle"} className="btn btn-outline-primary btn-sm">Save</button></Form></td>
    </tr>)}</tbody></table>{rows.length===0&&<p className="p-3 mb-0">No inquiries yet.</p>}</div>
  </AdminShell>;
}
