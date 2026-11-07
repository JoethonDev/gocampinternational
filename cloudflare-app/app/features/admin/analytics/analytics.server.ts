import { cleanSeoText } from "../../../lib/seo";
import {
  configuredWebAnalyticsSiteTag,
  isAnalyticsCollectionEnabled
} from "../../../lib/analytics";
import type { AnalyticsEventName, AnalyticsPageType } from "../../../lib/analytics";
import { isSeoIndexingAllowed } from "../../../lib/seo-discovery.server";

type RollupRow = {
  day: string;
  metric: AnalyticsEventName;
  page_type: AnalyticsPageType;
  entity_kind: string;
  entity_slug: string;
  count: number;
  updated_at: number;
};

type InquiryDailyRow = {
  day: string;
  kind: "contact" | "lead" | "newsletter";
  count: number;
  latest_at: number;
};

type CatalogRow = {
  kind: "destination" | "category";
  slug: string;
  name: string;
  content_json: string;
};

type AnalyticsEnv = {
  GOCAMP_ENV: string;
  ANALYTICS_ENABLED?: string;
  ANALYTICS_PRIVACY_NOTICE_PUBLISHED?: string;
  WEB_ANALYTICS_SITE_TAG?: string;
  SEO_INDEXING_ENABLED?: string;
};

function utcDay(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseDay(value: string | null): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  return Number.isFinite(timestamp) && utcDay(new Date(timestamp)) === value ? value : null;
}

function rangeFor(url: URL, now: Date) {
  const range = url.searchParams.get("range");
  const today = utcDay(now);
  if (range === "custom") {
    const from = parseDay(url.searchParams.get("from"));
    const to = parseDay(url.searchParams.get("to"));
    if (!from || !to || from > to || to > today) {
      throw new Response("Choose a valid date range", { status: 400 });
    }
    const days = (Date.parse(`${to}T00:00:00.000Z`) - Date.parse(`${from}T00:00:00.000Z`)) / 86400000;
    if (days > 365) throw new Response("Date range cannot exceed 366 days", { status: 400 });
    return { range: "custom", from, to };
  }

  const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;
  const fromDate = new Date(`${today}T00:00:00.000Z`);
  fromDate.setUTCDate(fromDate.getUTCDate() - (days - 1));
  return { range: `${days}d`, from: utcDay(fromDate), to: today };
}

function descriptionFrom(row: CatalogRow) {
  try {
    const content = JSON.parse(row.content_json) as Record<string, unknown>;
    const seo = content.seo && typeof content.seo === "object"
      ? (content.seo as Record<string, unknown>)
      : {};
    const fallback = row.kind === "destination"
      ? content.tagline || content.intro_text || content.intro
      : content.intro || content.tagline;
    return (
      (typeof seo.description === "string" && cleanSeoText(seo.description)) ||
      (typeof fallback === "string" && cleanSeoText(fallback)) ||
      ""
    );
  } catch {
    return "";
  }
}

export async function loadAnalyticsReport(
  db: D1Database,
  requestUrl: string,
  env: AnalyticsEnv,
  now = new Date()
) {
  const url = new URL(requestUrl);
  const { range, from, to } = rangeFor(url, now);
  const fromEpoch = Date.parse(`${from}T00:00:00.000Z`) / 1000;
  const toEpochExclusive = Date.parse(`${to}T00:00:00.000Z`) / 1000 + 86400;

  const [inquiryResult, schema] = await Promise.all([
    db
      .prepare(
        `SELECT date(created_at,'unixepoch') AS day,kind,COUNT(*) AS count,MAX(created_at) AS latest_at
         FROM inquiries WHERE created_at>=? AND created_at<?
         GROUP BY day,kind ORDER BY day,kind`
      )
      .bind(fromEpoch, toEpochExclusive)
      .all<InquiryDailyRow>(),
    db
      .prepare("SELECT 1 AS ready FROM sqlite_master WHERE type='table' AND name=?")
      .bind("analytics_daily_rollups")
      .first<{ ready: number }>()
  ]);

  const [rollups, catalog] = await Promise.all([
    schema
      ? db
          .prepare(
            `SELECT day,metric,page_type,entity_kind,entity_slug,count,updated_at
             FROM analytics_daily_rollups WHERE day>=? AND day<=?
             ORDER BY day,metric,page_type LIMIT 1000`
          )
          .bind(from, to)
          .all<RollupRow>()
      : Promise.resolve({ results: [] as RollupRow[] }),
    db
      .prepare(
        `SELECT kind,slug,name,content_json FROM catalog_entities
         WHERE kind IN ('destination','category') AND status='active'
         ORDER BY kind,name LIMIT 1000`
      )
      .all<CatalogRow>()
  ]);

  const inquiriesByKind = { contact: 0, lead: 0, newsletter: 0 };
  const inquiriesByDay = new Map<string, number>();
  for (const row of inquiryResult.results) {
    inquiriesByKind[row.kind] += row.count;
    inquiriesByDay.set(row.day, (inquiriesByDay.get(row.day) || 0) + row.count);
  }

  const clicksByMetric: Record<AnalyticsEventName, number> = {
    lead_form_open: 0,
    whatsapp_click: 0,
    contact_cta_click: 0
  };
  const clicksByDay = new Map<string, number>();
  const contentActions = new Map<string, { entityKind: string; entitySlug: string; count: number }>();
  const latestActivity = [
    ...inquiryResult.results.map((row) => row.latest_at),
    ...rollups.results.map((row) => row.updated_at)
  ];
  for (const row of rollups.results) {
    clicksByMetric[row.metric] += row.count;
    clicksByDay.set(row.day, (clicksByDay.get(row.day) || 0) + row.count);
    if (row.entity_kind && row.entity_slug) {
      const key = `${row.entity_kind}:${row.entity_slug}`;
      const item = contentActions.get(key) || {
        entityKind: row.entity_kind,
        entitySlug: row.entity_slug,
        count: 0
      };
      item.count += row.count;
      contentActions.set(key, item);
    }
  }

  const activeEntities = catalog.results.map((row) => ({
    ...row,
    description: descriptionFrom(row),
    noindex: (() => {
      try {
        const content = JSON.parse(row.content_json) as { seo?: { noindex?: unknown } };
        return content.seo?.noindex === true;
      } catch {
        return false;
      }
    })()
  }));
  const dayKeys = new Set([...inquiriesByDay.keys(), ...clicksByDay.keys()]);
  const daily = [...dayKeys]
    .sort()
    .map((day) => ({
      day,
      clicks: clicksByDay.get(day) || 0,
      inquiries: inquiriesByDay.get(day) || 0
    }));

  return {
    range,
    from,
    to,
    now: Math.floor(now.getTime() / 1000),
    lastUpdatedAt: latestActivity.length ? Math.max(...latestActivity) : null,
    inquiriesByKind,
    inquiryTotal: Object.values(inquiriesByKind).reduce((sum, count) => sum + count, 0),
    clicksByMetric,
    clickTotal: Object.values(clicksByMetric).reduce((sum, count) => sum + count, 0),
    daily,
    topContentActions: [...contentActions.values()].sort((a, b) => b.count - a.count).slice(0, 10),
    rollupsAvailable: Boolean(schema),
    collectionEnabled: isAnalyticsCollectionEnabled(env, url),
    webAnalyticsConfigured: Boolean(configuredWebAnalyticsSiteTag(env)),
    indexingEnabled: isSeoIndexingAllowed(url, env),
    seoHealth: {
      activeEntities: activeEntities.length,
      entitiesWithDescription: activeEntities.filter((row) => row.description.length > 0).length,
      entitiesWithThinDescription: activeEntities.filter(
        (row) => row.description.length > 0 && row.description.length < 60
      ).length,
      noindexOverrides: activeEntities.filter((row) => row.noindex).length
    },
    entityNames: Object.fromEntries(activeEntities.map((row) => [`${row.kind}:${row.slug}`, row.name]))
  };
}
