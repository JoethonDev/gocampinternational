import { Form, Link, redirect, useNavigation } from "react-router";
import type {Route} from "./+types/admin-catalog";
import { requireAdmin } from "../lib/admin.server";
import { changeBulkStatus,ensureKind } from "../lib/catalog-write.server";
import { listCatalog } from "../lib/catalog.server";
import { AdminShell } from "../components/AdminShell";
export function meta() {return [{title:"GoCamp Content Management"},{name:"robots",content:"noindex,nofollow"}];}
export async function loader({request,context,params}:Route.LoaderArgs) {
  const db=context.cloudflare.env.DB,session=await requireAdmin(request,db),kind=ensureKind(params.kind||"");
  return {session,kind,records:await listCatalog(db,kind,false),updated:new URL(request.url).searchParams.get("updated")};
}
export async function action({request,context,params}:Route.ActionArgs){
  const kind=ensureKind(params.kind||"");
  const n=await changeBulkStatus(request,context.cloudflare.env.DB,kind,await request.formData());
  return redirect("/admin/catalog/"+kind+"?updated="+n);
}
export default function Catalog({loaderData}:Route.ComponentProps) {
  const {session,kind,records,updated}=loaderData;
  const navigation=useNavigation();
  const title={program:"Programs",destination:"Destinations",category:"Program Categories"}[kind];
  const options=kind==="destination"?["active","inactive","coming-soon","trash"]:["active","inactive","trash"];
  return <AdminShell username={session.username} csrf={session.csrf}>
    <div className="d-flex justify-content-between align-items-center mb-4 gap-2"><h1 className="h3 mb-0">{title}</h1><Link className="btn btn-primary" to={"/admin/catalog/"+kind+"/new"}>+ Create</Link></div>
    {updated&&<div className="alert alert-success" role="status">{updated} item(s) updated.</div>}
    <Form method="post" className="card shadow-sm"><input type="hidden" name="csrf" value={session.csrf}/><div className="card-body">
      <div className="d-flex flex-wrap gap-2 align-items-center mb-3"><label htmlFor="bulk-status" className="form-label mb-0">Bulk action</label>
        <select id="bulk-status" className="form-select" style={{maxWidth:220}} name="status" required defaultValue=""><option value="" disabled>Select status</option>{options.map(v=><option key={v} value={v}>{v}</option>)}</select>
        <button disabled={navigation.state!=="idle"} className="btn btn-outline-primary">Apply to selected</button><span className="small text-secondary">Select records below</span>
      </div>
      <div className="table-responsive"><table className="table table-hover align-middle"><thead><tr><th scope="col">Select</th><th scope="col">Name</th><th scope="col">ID</th><th scope="col">Status</th><th scope="col">Edit</th></tr></thead><tbody>
        {records.map(item=><tr key={item.slug}><td><input type="checkbox" name="ids" value={item.slug} aria-label={"Select "+item.name}/></td><td>{item.name}</td><td><code>{item.slug}</code></td><td>{item.status}</td><td><Link to={"/admin/catalog/"+kind+"/"+item.slug} className="btn btn-sm btn-outline-primary">Edit</Link></td></tr>)}
      </tbody></table>{records.length===0&&<p>No items found.</p>}</div>
    </div></Form>
  </AdminShell>;
}
