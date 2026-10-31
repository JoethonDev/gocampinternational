import { Form, Link, useLocation } from "react-router";
import "../admin.css";
export function AdminShell({username,csrf,children}:{username:string;csrf:string;children:React.ReactNode}) {
  const location=useLocation();
  const nav=[["/admin","Dashboard"],["/admin/catalog/program","Programs"],["/admin/catalog/destination","Destinations"],["/admin/catalog/category","Categories"],["/admin/documents/site_settings","Visibility & Settings"],["/admin/documents/faq","FAQs"],["/admin/documents/camp_memories","Memories"],["/admin/inquiries","Inquiries"],["/admin/media","Media"],["/admin/trash","Trash"]];
  return <div className="container-fluid px-3 px-md-4 py-4 admin-workspace" style={{minHeight:"85vh"}}>
    <header className="d-flex flex-wrap gap-2 align-items-center justify-content-between mb-3">
      <div><Link to="/admin" className="text-decoration-none h3 fw-bold">GoCamp Admin</Link><div className="text-secondary small">Cloudflare migration staging</div></div>
      <div className="d-flex align-items-center gap-3"><span className="text-secondary small">{username}</span>
        <Form method="post" action="/admin/logout"><input type="hidden" name="csrf" value={csrf}/><button className="btn btn-sm btn-outline-secondary">Log out</button></Form>
      </div>
    </header>
    <nav aria-label="Admin navigation" className="d-flex flex-wrap gap-2 mb-4 admin-nav">{nav.map(([href,label])=><Link key={href} aria-current={location.pathname===href?"page":undefined} className={"btn btn-sm "+(location.pathname===href?"btn-primary":"btn-outline-primary")} to={href}>{label}</Link>)}</nav>
    <main className="admin-main">{children}</main>
  </div>;
}
