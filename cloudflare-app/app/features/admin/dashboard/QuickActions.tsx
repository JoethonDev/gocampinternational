import { Link } from "react-router";
import { AdminPanel } from "../../../components/admin/AdminPanel";

const ACTIONS = [
  { to: "/admin/catalog/program/new", icon: "bi-plus-circle", label: "New program" },
  { to: "/admin/catalog/destination/new", icon: "bi-plus-circle", label: "New destination" },
  { to: "/admin/catalog/category/new", icon: "bi-plus-circle", label: "New category" },
  { to: "/admin/inquiries", icon: "bi-inbox", label: "Inbox" },
  { to: "/admin/media", icon: "bi-images", label: "Media library" },
  { to: "/admin/documents/site_settings", icon: "bi-toggles", label: "Visibility" },
  { to: "/admin/documents/faq", icon: "bi-question-circle", label: "FAQs" },
  { to: "/admin/documents/camp_memories", icon: "bi-camera", label: "Memories" },
  { to: "/admin/trash", icon: "bi-trash3", label: "Trash" }
];

export function QuickActions() {
  return (
    <AdminPanel title="Quick actions" description="Jump straight to the workflow you need.">
      <div className="admin-quick-grid">
        {ACTIONS.map((action) => (
          <Link className="admin-quick-action" to={action.to} key={action.to}>
            <i className={`bi ${action.icon}`} />
            <span>{action.label}</span>
          </Link>
        ))}
      </div>
    </AdminPanel>
  );
}
