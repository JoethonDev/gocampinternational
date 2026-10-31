import type { InquiryRecord } from "../../../lib/domain";

export type DashboardCount = { kind: string; status: string; count: number };

export type DashboardContentRow = {
  kind: string;
  slug: string;
  name: string;
  status: string;
  updated_at: number;
};

export type DashboardDocumentRow = { key: string; updated_at: number };

export type DashboardMedia = {
  count: number;
  bytes: number;
  published: number;
};

export type DashboardData = {
  counts: DashboardCount[];
  inquiryCounts: DashboardCount[];
  inquiries: InquiryRecord[];
  recentContent: DashboardContentRow[];
  documents: DashboardDocumentRow[];
  media: DashboardMedia;
  environment: string;
  source: string;
  now: number;
};
