import type { DashboardCount } from "./types";

export const KIND_LABEL: Record<string, string> = {
  program: "Programs",
  destination: "Destinations",
  category: "Categories"
};

export const KIND_ICON: Record<string, string> = {
  program: "bi-mortarboard-fill",
  destination: "bi-geo-alt-fill",
  category: "bi-collection-fill"
};

export const countFor = (rows: DashboardCount[], kind: string) =>
  rows.filter((row) => row.kind === kind).reduce((total, row) => total + row.count, 0);

export const statusCount = (rows: DashboardCount[], kind: string, status: string) =>
  rows.find((row) => row.kind === kind && row.status === status)?.count || 0;

export function relativeTime(timestamp: number) {
  if (!timestamp) return "Imported";
  const seconds = Math.max(1, Math.floor(Date.now() / 1000) - timestamp);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
