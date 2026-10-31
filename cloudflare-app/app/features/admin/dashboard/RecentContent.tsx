import { Link } from "react-router";
import { AdminPanel } from "../../../components/admin/AdminPanel";
import { StatusBadge } from "../../../components/admin/StatusBadge";
import type { DashboardContentRow, DashboardDocumentRow } from "./types";
import { KIND_ICON, relativeTime } from "./utils";

export function RecentContent({
  rows,
  documents,
  now
}: {
  rows: DashboardContentRow[];
  documents: DashboardDocumentRow[];
  now: number;
}) {
  return (
    <AdminPanel
      title="Recently updated"
      description="Catalog records and shared content documents."
    >
      <div className="admin-recent-list">
        {rows.map((row) => (
          <Link
            className="admin-recent-item"
            to={`/admin/catalog/${row.kind}/${row.slug}`}
            key={`${row.kind}-${row.slug}`}
          >
            <span className="admin-recent-icon">
              <i className={`bi ${KIND_ICON[row.kind] || "bi-file-earmark"}`} />
            </span>
            <span className="flex-grow-1">
              <strong>{row.name}</strong>
              <span className="d-block small text-secondary text-capitalize">
                {row.kind} · {row.slug} · {relativeTime(row.updated_at, now)}
              </span>
            </span>
            <StatusBadge status={row.status} />
          </Link>
        ))}
        {documents.map((document) => (
          <Link
            className="admin-recent-item"
            to={`/admin/documents/${document.key}`}
            key={document.key}
          >
            <span className="admin-recent-icon">
              <i className="bi bi-file-earmark-text" />
            </span>
            <span className="flex-grow-1">
              <strong className="text-capitalize">{document.key.replaceAll("_", " ")}</strong>
              <span className="d-block small text-secondary">
                Document · {relativeTime(document.updated_at, now)}
              </span>
            </span>
            <i className="bi bi-chevron-right text-secondary" />
          </Link>
        ))}
      </div>
    </AdminPanel>
  );
}
