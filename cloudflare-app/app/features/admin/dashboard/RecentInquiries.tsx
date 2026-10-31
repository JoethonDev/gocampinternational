import { Link } from "react-router";
import { AdminEmptyState } from "../../../components/admin/AdminEmptyState";
import { AdminPanel } from "../../../components/admin/AdminPanel";
import { StatusBadge } from "../../../components/admin/StatusBadge";
import type { InquiryRecord } from "../../../lib/domain";
import { relativeTime } from "./utils";

export function RecentInquiries({ rows }: { rows: InquiryRecord[] }) {
  return (
    <AdminPanel
      title="Recent inquiries"
      description="Latest contact, landing and newsletter submissions."
      action={
        <Link to="/admin/inquiries" className="btn btn-sm btn-outline-primary">
          Open inbox
        </Link>
      }
    >
      {rows.length === 0 ? (
        <AdminEmptyState
          icon="bi-inbox"
          title="No inquiries yet"
          description="New contact and landing-page submissions will appear here."
        />
      ) : (
        <div className="table-responsive">
          <table className="table admin-table align-middle mb-0">
            <thead>
              <tr>
                <th>Contact</th>
                <th>Type</th>
                <th>Status</th>
                <th>Received</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.name || "Newsletter subscriber"}</strong>
                    <div className="small text-secondary">{row.email}</div>
                  </td>
                  <td className="text-capitalize">{row.kind}</td>
                  <td>
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="small text-secondary">{relativeTime(row.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminPanel>
  );
}
