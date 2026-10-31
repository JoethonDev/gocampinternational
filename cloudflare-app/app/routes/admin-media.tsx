import { Form, redirect, useNavigation } from "react-router";
import type {Route} from "./+types/admin-media";
import { requireAdmin,requireSameOrigin } from "../lib/admin.server";
import { uploadMedia,mutateMedia,MAX_UPLOAD_BYTES } from "../lib/media.server";
import { AdminShell } from "../components/AdminShell";
export function meta(){return [{title:"GoCamp Media Library"},{name:"robots",content:"noindex,nofollow"}];}
export async function loader({request,context}:Route.LoaderArgs){
  const db=context.cloudflare.env.DB,session=await requireAdmin(request,db);
  const rows=await db.prepare("SELECT id,display_name,mime_type,bytes,is_public,created_at FROM media_assets ORDER BY created_at DESC LIMIT 300")
    .all<{id:string;display_name:string;mime_type:string;bytes:number;is_public:number;created_at:number}>();
  return {session,rows:rows.results,uploaded:new URL(request.url).searchParams.has("uploaded"),updated:new URL(request.url).searchParams.has("updated")};
}
export async function action({request,context}:Route.ActionArgs){
  requireSameOrigin(request);
  await requireAdmin(request,context.cloudflare.env.DB);
  const length=Number(request.headers.get("content-length")||0);
  if(length>MAX_UPLOAD_BYTES+16384)throw new Response("Upload too large",{status:413});
  const form=await request.formData(),operation=String(form.get("operation")||"");
  if(operation==="upload"){const id=await uploadMedia(request,context.cloudflare.env,form);return redirect("/admin/media?uploaded="+id);}
  await mutateMedia(request,context.cloudflare.env,form);
  return redirect("/admin/media?updated=1");
}
export default function AdminMedia({loaderData}:Route.ComponentProps){
  const {session,rows,uploaded,updated}=loaderData,nav=useNavigation();
  return <AdminShell username={session.username} csrf={session.csrf}>
    <h1 className="h3 mb-3">Media Library</h1><p className="text-secondary">New images are stored privately in R2. Only published media is served by its immutable ID. Existing PR40 static assets remain available under /images.</p>
    {(uploaded||updated)&&<div className="alert alert-success">Media saved.</div>}
    <Form method="post" encType="multipart/form-data" className="card shadow-sm mb-4"><div className="card-body d-flex flex-wrap align-items-end gap-3">
      <input type="hidden" name="csrf" value={session.csrf}/><input type="hidden" name="operation" value="upload"/>
      <div><label htmlFor="mediaFile" className="form-label">Upload image (up to 3 MB)</label><input className="form-control" type="file" name="file" id="mediaFile" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" required/></div>
      <button className="btn btn-primary" disabled={nav.state!=="idle"}>Upload to R2</button>
    </div></Form>
    <div className="row g-3">{rows.map(row=><div className="col-md-6 col-xl-4" key={row.id}><div className="card h-100 shadow-sm"><div className="card-body">
      <img alt={row.display_name} className="w-100 rounded mb-3" style={{height:160,objectFit:"contain",background:"#f3f4f6"}} src={"/media/"+row.id}/>
      <p className="small text-secondary mb-1">{Math.round(row.bytes/1024)} KB · {row.is_public?"Published":"Hidden"}</p>
      <Form method="post" className="d-flex gap-2 align-items-end flex-wrap"><input type="hidden" name="csrf" value={session.csrf}/><input type="hidden" name="id" value={row.id}/>
        <div className="flex-grow-1"><label className="form-label">Name</label><input name="display_name" defaultValue={row.display_name} className="form-control form-control-sm"/></div>
        <button name="operation" value="rename" className="btn btn-sm btn-outline-primary">Rename</button><button name="operation" value={row.is_public?"hide":"show"} className="btn btn-sm btn-outline-secondary">{row.is_public?"Hide":"Publish"}</button><button type="submit" name="operation" value="delete" className="btn btn-sm btn-outline-danger" onClick={e=>{if(!window.confirm("Delete this image permanently from R2? Referenced images cannot be deleted."))e.preventDefault();}}>Delete</button>
      </Form><div className="small mt-2 text-secondary">/media/{row.id}</div>
    </div></div></div>)}</div>{rows.length===0&&<p>No uploads yet.</p>}
  </AdminShell>;
}
