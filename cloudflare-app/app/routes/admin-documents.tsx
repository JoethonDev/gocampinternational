import { Form, redirect, useNavigation } from "react-router";
import type {Route} from "./+types/admin-documents";
import {requireAdmin} from "../lib/admin.server";
import {saveDocument} from "../lib/catalog-write.server";
import {AdminShell} from "../components/AdminShell";
type Key="site_settings"|"faq"|"camp_memories";
const parseKey=(value:string):Key=>{
  if(value==="site_settings"||value==="faq"||value==="camp_memories")return value;
  throw new Response("Not Found",{status:404});
};
export function meta(){return [{title:"GoCamp Content Settings"},{name:"robots",content:"noindex,nofollow"}];}
export async function loader({request,context,params}:Route.LoaderArgs){
  const db=context.cloudflare.env.DB,session=await requireAdmin(request,db),key=parseKey(params.key||"");
  const row=await db.prepare("SELECT content_json,revision FROM site_documents WHERE key=?").bind(key).first<{content_json:string;revision:number}>();
  if(!row)throw new Response("Document not found",{status:404});
  return {session,key,content:JSON.stringify(JSON.parse(row.content_json),null,2),revision:row.revision,saved:new URL(request.url).searchParams.has("saved")};
}
export async function action({request,context,params}:Route.ActionArgs) {
  const key=parseKey(params.key||"");
  await saveDocument(request,context.cloudflare.env.DB,key,await request.formData());
  return redirect("/admin/documents/"+key+"?saved=1");
}
export default function Documents({loaderData}:Route.ComponentProps){
  const {session,key,content,revision,saved}=loaderData,nav=useNavigation();
  const title={site_settings:"Site Visibility and Settings",faq:"Global FAQs",camp_memories:"GoCamp Memories"}[key];
  return <AdminShell username={session.username} csrf={session.csrf}>
    <h1 className="h3">{title}</h1><p className="text-secondary">Structured JSON editor. This preserves every existing PR40 field while the visual repeater controls are being migrated.</p>
    {saved&&<div className="alert alert-success">Document saved.</div>}
    <Form method="post" className="card shadow-sm"><div className="card-body"><input type="hidden" name="csrf" value={session.csrf}/><input type="hidden" name="revision" value={revision}/>
      <label className="form-label" htmlFor="documentContent">Document JSON</label><textarea id="documentContent" required name="content" rows={22} spellCheck={false} className="form-control font-monospace" defaultValue={content}/>
      <button disabled={nav.state!=="idle"} className="btn btn-primary mt-3">{nav.state!=="idle"?"Saving...":"Save changes"}</button>
    </div></Form>
  </AdminShell>;
}
