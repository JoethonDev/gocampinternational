import { Link } from "react-router";
import { AdminPanel } from "../../../components/admin/AdminPanel";
import type { DashboardCount } from "./types";
import { countFor, KIND_ICON, KIND_LABEL, statusCount } from "./utils";

export function CatalogHealth({ counts }: { counts: DashboardCount[] }) {
  return (
    <AdminPanel
      title="Catalog health"
      description="Published, draft and trashed records by type."
      action={
        <Link to="/admin/catalog/program" className="btn btn-sm btn-outline-primary">
          Manage catalog
        </Link>
      }
    >
      <div className="admin-health-list">
        {(["program", "destination", "category"] as const).map((kind) => {
          const total = countFor(counts, kind);
          const active = statusCount(counts, kind, "active");
          const inactive = statusCount(counts, kind, "inactive");
          const comingSoon = statusCount(counts, kind, "coming-soon");
          const trash = statusCount(counts, kind, "trash");
          const pct = (value: number) => (total ? `${(value / total) * 100}%` : "0%");
          return (
            <div className="admin-health-row" key={kind}>
              <div className="admin-health-heading">
                <span>
                  <i className={`bi ${KIND_ICON[kind]} me-2`} />
                  {KIND_LABEL[kind]}
                </span>
                <span className="text-secondary small">{total} total</span>
              </div>
              <div
                className="admin-status-bar"
                aria-label={`${KIND_LABEL[kind]} status distribution`}
              >
                <span
                  className="admin-status-active"
                  style={{ width: pct(active) }}
                  title={`Active: ${active}`}
                />
                <span
                  className="admin-status-draft"
                  style={{ width: pct(inactive + comingSoon) }}
                  title={`Draft/coming soon: ${inactive + comingSoon}`}
                />
                <span
                  className="admin-status-trash"
                  style={{ width: pct(trash) }}
                  title={`Trash: ${trash}`}
                />
              </div>
              <div className="admin-health-meta small text-secondary">
                <span>
                  <i className="bi bi-circle-fill admin-dot-active" /> Active {active}
                </span>
                <span>
                  <i className="bi bi-circle-fill admin-dot-draft" /> Draft {inactive + comingSoon}
                </span>
                <span>
                  <i className="bi bi-circle-fill admin-dot-trash" /> Trash {trash}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </AdminPanel>
  );
}
