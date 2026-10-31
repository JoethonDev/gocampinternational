import { Link } from "react-router";
import { AdminPageHeader } from "../../../components/admin/AdminPageHeader";
import { CatalogHealth } from "./CatalogHealth";
import { DashboardHero } from "./DashboardHero";
import { KpiGrid } from "./KpiGrid";
import { QuickActions } from "./QuickActions";
import { RecentContent } from "./RecentContent";
import { RecentInquiries } from "./RecentInquiries";
import { StagingStatus } from "./StagingStatus";
import type { DashboardData } from "./types";
import { countFor } from "./utils";
import "./dashboard.css";

export function DashboardPage({
  session,
  ...data
}: { session: { username: string; csrf: string } } & DashboardData) {
  const newInquiries = data.inquiryCounts
    .filter((row) => row.status === "new")
    .reduce((total, row) => total + row.count, 0);
  const catalogRecords = data.counts.reduce((total, row) => total + row.count, 0);
  const destinations = countFor(data.counts, "destination");

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
      <DashboardHero
        username={session.username}
        newInquiries={newInquiries}
        catalogRecords={catalogRecords}
        destinations={destinations}
      />
      <KpiGrid counts={data.counts} inquiryCounts={data.inquiryCounts} media={data.media} />
      <div className="admin-dashboard-grid">
        <div className="admin-dashboard-main">
          <CatalogHealth counts={data.counts} />
          <RecentInquiries rows={data.inquiries} now={data.now} />
        </div>
        <div className="admin-dashboard-side">
          <QuickActions />
          <StagingStatus environment={data.environment} source={data.source} media={data.media} />
        </div>
      </div>
      <RecentContent rows={data.recentContent} documents={data.documents} now={data.now} />
    </div>
  );
}
