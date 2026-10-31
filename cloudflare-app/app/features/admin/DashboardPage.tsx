import { Link } from "react-router";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { StatusBadge } from "../../components/admin/StatusBadge";
import type { InquiryRecord } from "../../lib/domain";

type CountRow = { kind: string; status: string; count: number };
type RecentContent = {
  kind: string;
  slug: string;
  name: string;
  status: string;
  updated_at: number;
};
type DocumentRow = { key: string; updated_at: number };
type MediaSummary = { count: number; bytes: number; published: number };

const KIND_LABEL: Record<string, string> = {
  program: "Programs",
  destination: "Destinations",
  category: "Categories"
};

const KIND_ICON: Record<string, string> = {
  program: "bi-mortarboard-fill",
  destination: "bi-geo-alt-fill",
  category: "bi-collection-fill"
};

function countFor(rows: CountRow[], kind: string, status?: string) {
  return rows
    .filter((row) => row.kind === kind && (!status || row.status === status))
    .reduce((total, row) => total + row.count, 0);
}

function statusCount(rows: CountRow[], kind: string, status: string) {
  return rows.find((row) => row.kind === kind && row.status === status)?.count || 0;
}

function relativeTime(timestamp: number) {
  if (!timestamp) return "Imported";
  const seconds = Math.max(1, Math.floor(Date.now() / 1000) - timestamp);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function KpiCard({
  icon,
  label,
  value,
  detail,
  accent
}: {
  icon: string;
  label: string;
  value: number | string;
  detail: string;
  accent: string;
}) {
  return (
    <article className={`admin-kpi admin-kpi-${accent}`}>
      <div className="admin-kpi-icon">
        <i className={`bi ${icon}`} />
      </div>
      <div>
        <div className="admin-kpi-value">{value}</div>
        <div className="admin-kpi-label">{label}</div>
        <div className="admin-kpi-detail">{detail}</div>
      </div>
    </article>
  );
}

function CatalogHealth({ counts }: { counts: CountRow[] }) {
  return (
    <section className="admin-panel">
      <div className="admin-panel-header">
        <div>
          <h2 className="h5 mb-1">Catalog health</h2>
          <p className="text-secondary small mb-0">Published, draft and trashed records by type.</p>
        </div>
        <Link to="/admin/catalog/program" className="btn btn-sm btn-outline-primary">
          Manage catalog
        </Link>
      </div>
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
    </section>
  );
}

function QuickActions() {
  const actions = [
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
  return (
    <section className="admin-panel">
      <div className="admin-panel-header">
        <div>
          <h2 className="h5 mb-1">Quick actions</h2>
          <p className="text-secondary small mb-0">Jump straight to the workflow you need.</p>
        </div>
      </div>
      <div className="admin-quick-grid">
        {actions.map((action) => (
          <Link className="admin-quick-action" to={action.to} key={action.to}>
            <i className={`bi ${action.icon}`} />
            <span>{action.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function RecentInquiries({ rows }: { rows: InquiryRecord[] }) {
  return (
    <section className="admin-panel">
      <div className="admin-panel-header">
        <div>
          <h2 className="h5 mb-1">Recent inquiries</h2>
          <p className="text-secondary small mb-0">
            Latest contact, landing and newsletter submissions.
          </p>
        </div>
        <Link to="/admin/inquiries" className="btn btn-sm btn-outline-primary">
          Open inbox
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="text-secondary small mb-0">No inquiries yet.</p>
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
    </section>
  );
}

function RecentContent({ rows, documents }: { rows: RecentContent[]; documents: DocumentRow[] }) {
  return (
    <section className="admin-panel">
      <div className="admin-panel-header">
        <div>
          <h2 className="h5 mb-1">Recently updated</h2>
          <p className="text-secondary small mb-0">Catalog records and shared content documents.</p>
        </div>
      </div>
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
                {row.kind} · {relativeTime(row.updated_at)}
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
                Document · {relativeTime(document.updated_at)}
              </span>
            </span>
            <i className="bi bi-chevron-right text-secondary" />
          </Link>
        ))}
      </div>
    </section>
  );
}

function StagingPanel({
  environment,
  source,
  media
}: {
  environment: string;
  source: string;
  media: MediaSummary;
}) {
  return (
    <section className="admin-panel admin-staging-panel">
      <h2 className="h5 mb-3">Staging status</h2>
      <dl className="admin-status-list mb-0">
        <div>
          <dt>Environment</dt>
          <dd>
            <span className="badge bg-warning text-dark">{environment}</span>
          </dd>
        </div>
        <div>
          <dt>Indexing</dt>
          <dd>Noindex, nofollow</dd>
        </div>
        <div>
          <dt>Source commit</dt>
          <dd>
            <code>{source.slice(0, 12)}</code>
          </dd>
        </div>
        <div>
          <dt>Media library</dt>
          <dd>
            {media.published} published / {media.count} total
          </dd>
        </div>
        <div>
          <dt>Media storage</dt>
          <dd>{(media.bytes / (1024 * 1024)).toFixed(1)} MB</dd>
        </div>
      </dl>
      <Link
        className="btn btn-sm btn-outline-secondary w-100 mt-3"
        to="/"
        target="_blank"
        rel="noopener noreferrer"
      >
        <i className="bi bi-box-arrow-up-right me-1" /> Open public site
      </Link>
    </section>
  );
}

export function DashboardPage({
  session,
  counts,
  inquiryCounts,
  inquiries,
  recentContent,
  documents,
  media,
  environment,
  source
}: {
  session: { username: string; csrf: string };
  counts: CountRow[];
  inquiryCounts: CountRow[];
  inquiries: InquiryRecord[];
  recentContent: RecentContent[];
  documents: DocumentRow[];
  media: MediaSummary;
  environment: string;
  source: string;
}) {
  const totalInquiries = inquiryCounts.reduce((total, row) => total + row.count, 0);
  const newInquiries = inquiryCounts
    .filter((row) => row.status === "new")
    .reduce((total, row) => total + row.count, 0);
  const programs = countFor(counts, "program");
  const destinations = countFor(counts, "destination");
  const categories = countFor(counts, "category");

  return (
    <div className="admin-dashboard">
      <AdminPageHeader
        title="Dashboard"
        description="A working overview of catalog health, inquiries and recent content changes."
        aside={
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-warning text-dark">Staging</span>
            <Link
              to="/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-outline-secondary"
            >
              <i className="bi bi-box-arrow-up-right me-1" /> Public site
            </Link>
          </div>
        }
      />
      <section className="admin-hero">
        <div>
          <p className="admin-hero-eyebrow">GoCamp CMS</p>
          <h2 className="admin-hero-title">Good to see you, {session.username}.</h2>
          <p className="admin-hero-copy">
            You have{" "}
            <strong>
              {newInquiries} new {newInquiries === 1 ? "inquiry" : "inquiries"}
            </strong>{" "}
            and <strong>{programs + destinations + categories} catalog records</strong> across{" "}
            {destinations} destinations.
          </p>
        </div>
        <div className="admin-hero-actions">
          <Link className="btn btn-light" to="/admin/catalog/program/new">
            <i className="bi bi-plus-lg me-1" /> Create program
          </Link>
          <Link className="btn btn-outline-light" to="/admin/inquiries">
            Review inbox <i className="bi bi-arrow-right ms-1" />
          </Link>
        </div>
      </section>
      <div className="admin-kpi-grid">
        <KpiCard
          icon="bi-mortarboard-fill"
          label="Programs"
          value={programs}
          detail={`${statusCount(counts, "program", "active")} active`}
          accent="blue"
        />
        <KpiCard
          icon="bi-geo-alt-fill"
          label="Destinations"
          value={destinations}
          detail={`${statusCount(counts, "destination", "active")} active`}
          accent="green"
        />
        <KpiCard
          icon="bi-collection-fill"
          label="Categories"
          value={categories}
          detail={`${statusCount(counts, "category", "active")} active`}
          accent="violet"
        />
        <KpiCard
          icon="bi-inbox-fill"
          label="Inquiries"
          value={totalInquiries}
          detail={`${newInquiries} new`}
          accent="amber"
        />
        <KpiCard
          icon="bi-images"
          label="Media"
          value={media.count}
          detail={`${media.published} published`}
          accent="rose"
        />
      </div>
      <div className="admin-dashboard-grid">
        <div className="admin-dashboard-main">
          <CatalogHealth counts={counts} />
          <RecentInquiries rows={inquiries} />
        </div>
        <div className="admin-dashboard-side">
          <QuickActions />
          <StagingPanel environment={environment} source={source} media={media} />
        </div>
      </div>
      <RecentContent rows={recentContent} documents={documents} />
    </div>
  );
}
