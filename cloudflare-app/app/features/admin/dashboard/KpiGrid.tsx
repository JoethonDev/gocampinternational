import { MetricCard } from "../../../components/admin/MetricCard";
import type { DashboardCount, DashboardMedia } from "./types";
import { countFor, statusCount } from "./utils";

export function KpiGrid({
  counts,
  inquiryCounts,
  media
}: {
  counts: DashboardCount[];
  inquiryCounts: DashboardCount[];
  media: DashboardMedia;
}) {
  const totalInquiries = inquiryCounts.reduce((total, row) => total + row.count, 0);
  const newInquiries = inquiryCounts
    .filter((row) => row.status === "new")
    .reduce((total, row) => total + row.count, 0);

  return (
    <div className="admin-kpi-grid">
      <MetricCard
        icon="bi-mortarboard-fill"
        label="Programs"
        value={countFor(counts, "program")}
        detail={`${statusCount(counts, "program", "active")} active`}
        accent="blue"
      />
      <MetricCard
        icon="bi-geo-alt-fill"
        label="Destinations"
        value={countFor(counts, "destination")}
        detail={`${statusCount(counts, "destination", "active")} active`}
        accent="green"
      />
      <MetricCard
        icon="bi-collection-fill"
        label="Categories"
        value={countFor(counts, "category")}
        detail={`${statusCount(counts, "category", "active")} active`}
        accent="violet"
      />
      <MetricCard
        icon="bi-inbox-fill"
        label="Inquiries"
        value={totalInquiries}
        detail={`${newInquiries} new`}
        accent="amber"
      />
      <MetricCard
        icon="bi-images"
        label="Media"
        value={media.count}
        detail={`${media.published} published`}
        accent="rose"
      />
    </div>
  );
}
