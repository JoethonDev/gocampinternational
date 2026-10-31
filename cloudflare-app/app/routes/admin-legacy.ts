import {redirect} from "react-router";
import type {Route} from "./+types/admin-legacy";
/** Read-only compatibility for original admin bookmarks. Never redirect old POSTs to GET. */
const aliases:Record<string,string>={
  "dashboard":"/admin","dashboard.php":"/admin",
  "programs":"/admin/catalog/program","programs.php":"/admin/catalog/program",
  "media-library":"/admin/media","media-library.php":"/admin/media",
  "site-visibility":"/admin/documents/site_settings","site-visibility.php":"/admin/documents/site_settings",
  "memories":"/admin/documents/camp_memories","memories.php":"/admin/documents/camp_memories",
  "edit-memories":"/admin/documents/camp_memories","edit-memories.php":"/admin/documents/camp_memories",
  "edit-faq":"/admin/documents/faq","edit-faq.php":"/admin/documents/faq",
  "trash.php":"/admin/trash",
  "inquiries.php":"/admin/inquiries",
  "view-inquiry":"/admin/inquiries","view-inquiry.php":"/admin/inquiries",
  "logout.php":"/admin/login"
};
const edits:Record<string,string>={
  "edit-program":"program","edit-program.php":"program",
  "edit-destination":"destination","edit-destination.php":"destination",
  "edit-program-category":"category","edit-program-category.php":"category"
};
export function loader({request,params}:Route.LoaderArgs) {
  if(request.method!=="GET"&&request.method!=="HEAD")throw new Response("Method Not Allowed",{status:405,headers:{Allow:"GET, HEAD"}});
  const old=params.legacy||"",url=new URL(request.url);
  if(old==="logout.php")throw new Response("Log out through the authenticated POST-only admin control",{status:405});
  if(Object.hasOwn(aliases,old))return redirect(aliases[old],302);
  if(Object.hasOwn(edits,old)){
    const slug=url.searchParams.get("slug")||"new";
    if(!/^[a-z0-9][a-z0-9_-]{0,159}$/i.test(slug))throw new Response("Invalid slug",{status:404});
    return redirect("/admin/catalog/"+edits[old]+"/"+slug,302);
  }
  throw new Response("Not Found",{status:404});
}
