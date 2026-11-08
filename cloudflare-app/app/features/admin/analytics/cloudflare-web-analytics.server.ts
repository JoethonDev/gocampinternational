/** Server-side Cloudflare Web Analytics. Never expose API credentials to the browser. */
export type ProviderTrafficStatus =
  | "ok"
  | "partial"
  | "disabled"
  | "not_configured"
  | "out_of_retention"
  | "access_denied"
  | "rate_limited"
  | "provider_error";

export type ProviderTraffic = {
  status: ProviderTrafficStatus;
  visits: number;
  pageviews: number;
  coverageFrom: string | null;
  coverageTo: string | null;
};

export type ProviderAnalyticsEnv = {
  GOCAMP_ENV: string;
  ANALYTICS_ENABLED?: string;
  CF_ANALYTICS_API_TOKEN?: string;
  CF_ANALYTICS_ACCOUNT_ID?: string;
  CF_WEB_ANALYTICS_SITE_TAG?: string;
};

const ENDPOINT = "https://api.cloudflare.com/client/v4/graphql";
const ONE_DAY = 86400000;
const cache = new Map<string, { until: number; value: ProviderTraffic }>();
const QUERY =
  "query GoCampRUMTraffic($accountTag: string!, $siteTag: string!, $start: Time!, $end: Time!) {" +
  " viewer { accounts(filter: { accountTag: $accountTag }) {" +
  " rumPageloadEventsAdaptiveGroups(limit: 20, orderBy: [date_ASC]," +
  " filter: { siteTag: $siteTag, datetime_geq: $start, datetime_lt: $end }) {" +
  " count sum { visits } dimensions { date } } } } }";

type TrafficRow = {
  count: number;
  sum: { visits: number };
  dimensions: { date: string };
};

type GraphQLPayload = {
  data?: { viewer?: { accounts?: Array<{ rumPageloadEventsAdaptiveGroups?: TrafficRow[] }> } };
  errors?: Array<{ message?: string }> | null;
};

function empty(status: ProviderTrafficStatus): ProviderTraffic {
  return { status, visits: 0, pageviews: 0, coverageFrom: null, coverageTo: null };
}

function classify(status: number, errors?: GraphQLPayload["errors"]): ProviderTrafficStatus {
  const messages = (errors || []).map((item) => item.message || "").join(" ");
  if (status === 401 || status === 403 || /unauthoriz|not authorized|permission|access denied/i.test(messages)) {
    return "access_denied";
  }
  if (status === 429 || /rate limit|budget depleted|too many quer/i.test(messages)) {
    return "rate_limited";
  }
  return "provider_error";
}

/** Query only aggregated provider metrics for the authenticated production admin. */
export async function loadCloudflareWebAnalytics(
  env: ProviderAnalyticsEnv,
  requestUrl: URL,
  from: string,
  to: string,
  now = new Date(),
  fetcher: typeof fetch = fetch
): Promise<ProviderTraffic> {
  if (
    env.GOCAMP_ENV !== "production" ||
    env.ANALYTICS_ENABLED !== "true" ||
    requestUrl.protocol !== "https:" ||
    requestUrl.hostname !== "gocampinternational.net"
  ) {
    return empty("disabled");
  }
  const token = env.CF_ANALYTICS_API_TOKEN;
  const accountTag = env.CF_ANALYTICS_ACCOUNT_ID;
  const siteTag = env.CF_WEB_ANALYTICS_SITE_TAG;
  if (
    !token ||
    !accountTag ||
    !siteTag ||
    !/^[a-f0-9]{32}$/i.test(accountTag) ||
    !/^[a-f0-9]{32}$/i.test(siteTag)
  ) {
    return empty("not_configured");
  }

  const start = Date.parse(from + "T00:00:00.000Z");
  const end = Date.parse(to + "T00:00:00.000Z") + ONE_DAY;
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return empty("provider_error");
  }
  const cutoff = new Date(now);
  cutoff.setUTCMonth(cutoff.getUTCMonth() - 6);
  cutoff.setUTCHours(0, 0, 0, 0);
  const effectiveStart = Math.max(start, cutoff.getTime());
  if (end <= effectiveStart) return empty("out_of_retention");

  const partial = effectiveStart > start;
  const key = [accountTag, siteTag, effectiveStart, end].join(":");
  if (fetcher === fetch) {
    const hit = cache.get(key);
    if (hit && hit.until > Date.now()) return hit.value;
  }

  const chunks: Array<{ start: number; end: number }> = [];
  for (let ms = effectiveStart; ms < end; ms += 14 * ONE_DAY) {
    chunks.push({ start: ms, end: Math.min(ms + 14 * ONE_DAY, end) });
  }

  try {
    const responses = await Promise.all(
      chunks.map(async (chunk) => {
        const response = await fetcher(ENDPOINT, {
          method: "POST",
          headers: {
            authorization: "Bearer " + token,
            "content-type": "application/json"
          },
          body: JSON.stringify({
            query: QUERY,
            variables: {
              accountTag,
              siteTag,
              start: new Date(chunk.start).toISOString(),
              end: new Date(chunk.end).toISOString()
            }
          }),
          signal: AbortSignal.timeout(8000)
        });
        if (!response.ok) return { status: classify(response.status) } as const;
        const payload = (await response.json()) as GraphQLPayload;
        if (payload.errors?.length) {
          return { status: classify(response.status, payload.errors) } as const;
        }
        const accounts = payload.data?.viewer?.accounts;
        if (!Array.isArray(accounts) || accounts.length !== 1) {
          return { status: "provider_error" } as const;
        }
        const rows = accounts[0].rumPageloadEventsAdaptiveGroups;
        if (!Array.isArray(rows) || rows.length > 20) {
          return { status: "provider_error" } as const;
        }
        let visits = 0;
        let pageviews = 0;
        for (const row of rows) {
          const count = Number(row.count);
          const visiting = Number(row.sum?.visits);
          if (
            !Number.isSafeInteger(count) ||
            !Number.isSafeInteger(visiting) ||
            count < 0 ||
            visiting < 0
          ) {
            return { status: "provider_error" } as const;
          }
          pageviews += count;
          visits += visiting;
        }
        return { status: "ok", visits, pageviews } as const;
      })
    );
    const failure = responses.find((item) => item.status !== "ok");
    if (failure) return empty(failure.status);

    const result: ProviderTraffic = {
      status: partial ? "partial" : "ok",
      visits: responses.reduce((value, item) => value + (item.visits || 0), 0),
      pageviews: responses.reduce((value, item) => value + (item.pageviews || 0), 0),
      coverageFrom: new Date(effectiveStart).toISOString().slice(0, 10),
      coverageTo: to
    };
    if (fetcher === fetch) {
      if (cache.size >= 32) cache.clear();
      cache.set(key, { until: Date.now() + 300000, value: result });
    }
    return result;
  } catch {
    return empty("provider_error");
  }
}
