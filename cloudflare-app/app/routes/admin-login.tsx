import { Form, redirect, useActionData, useNavigation } from "react-router";
import type { Route } from "./+types/admin-login";
import { getAdmin, login } from "../lib/admin.server";
export function meta() {return [{title:"Admin Login | GoCamp"},{name:"robots",content:"noindex,nofollow"}];}
export async function loader({request,context}:Route.LoaderArgs) {
  if(await getAdmin(request,context.cloudflare.env.DB))throw redirect("/admin");
  return null;
}
export async function action({request,context}:Route.ActionArgs) {
  const form=await request.formData();
  const result=await login(request,context.cloudflare.env.DB,context.cloudflare.env,form);
  if("cookie" in result&&result.cookie)return redirect("/admin",{headers:{"Set-Cookie":result.cookie,"Cache-Control":"no-store"}});
  return Response.json({error:result.error},{status:result.status,headers:{"Cache-Control":"no-store"}});
}
export default function AdminLogin() {
  const data=useActionData<typeof action>() as {error?:string}|undefined;
  const navigation=useNavigation();
  return <div className="container py-5 my-5" style={{maxWidth:480}}><div className="card shadow border-0"><div className="card-body p-4 p-lg-5">
    <h1 className="h3 mb-2">GoCamp Administration</h1><p className="text-secondary">Sign in to manage the staging catalog.</p>
    {data?.error&&<div role="alert" className="alert alert-danger">{data.error}</div>}
    <Form method="post"><div className="mb-3"><label className="form-label" htmlFor="username">Username</label><input required autoComplete="username" className="form-control" name="username" id="username" maxLength={100}/></div>
    <div className="mb-3"><label className="form-label" htmlFor="password">Password</label><input required type="password" className="form-control" name="password" id="password" autoComplete="current-password" maxLength={512}/></div>
    <button disabled={navigation.state!=="idle"} className="btn btn-primary w-100" type="submit">{navigation.state!=="idle"?"Signing in...":"Sign in"}</button></Form>
  </div></div></div>;
}
