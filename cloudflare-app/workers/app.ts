import { createRequestHandler } from "react-router";
declare module "react-router" {
  export interface AppLoadContext { cloudflare: {env:Env;ctx:ExecutionContext}; }
}
const handle=createRequestHandler(()=>import("virtual:react-router/server-build"),import.meta.env.MODE);
export default { async fetch(request,env,ctx) {
  const response=await handle(request,{cloudflare:{env,ctx}});
  if(env.GOCAMP_ENV!=="staging")return response;
  const headers=new Headers(response.headers);headers.set("X-Robots-Tag","noindex, nofollow");
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
} } satisfies ExportedHandler<Env>;
