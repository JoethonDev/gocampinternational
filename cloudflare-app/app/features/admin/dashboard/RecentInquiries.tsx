import { Link } from "react-router";
import { AdminPanel } from "../../../components/admin/AdminPanel";
import { AdminTable, type AdminTableColumn } from "../../../components/admin/AdminTable";
import { StatusBadge } from "../../../components/admin/StatusBadge";
import type { InquiryRecord } from "../../../lib/domain";
import { relativeTime } from "./utils";

export function RecentInquiries({ rows, now }: { rows: InquiryRecord[]; now: number }) {
  const columns: AdminTableColumn<InquiryRecord>[] = [
    {
      key: "contact",
      label: "Contact",
      render: (row) => (
        <>
          <strong>{row.name || "Newsletter subscriber"}</strong>
          <div className="small text-secondary">{row.email}</div>
        </>
      )
    },
    {
      key: "kind",
      label: "Type",
      render: (row) => <span className="text-capitalize">{row.kind}</span>
    },
    { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
    {
      key: "created",
      label: "Received",
      render: (row) => (
        <span className="small text-secondary">{relativeTime(row.created_at, now)}</span>
      )
    }
  ];

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
      <AdminTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        density="compact"
        ariaLabel="Recent inquiries"
        emptyTitle="No inquiries yet"
        emptyDescription="New contact and landing-page submissions will appear here."
      />
    </AdminPanel>
  );
}
