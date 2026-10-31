import { CATALOG_KIND_META } from "../../../config/catalog";
import type { DashboardCount } from "./types";

export const KIND_LABEL: Record<string, string> = Object.fromEntries(
  Object.entries(CATALOG_KIND_META).map(([kind, meta]) => [kind, meta.label])
);

export const KIND_ICON: Record<string, string> = Object.fromEntries(
  Object.entries(CATALOG_KIND_META).map(([kind, meta]) => [kind, meta.icon])
);

export const countFor = (rows: DashboardCount[], kind: string) =>
  rows.filter((row) => row.kind === kind).reduce((total, row) => total + row.count, 0);

export const statusCount = (rows: DashboardCount[], kind: string, status: string) =>
  rows.find((row) => row.kind === kind && row.status === status)?.count || 0;

export function relativeTime(timestamp: number, now = Math.floor(Date.now() / 1000)) {
  if (!timestamp) return "Imported";
  const seconds = Math.max(1, now - timestamp);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
