import { consumeRateLimit } from "./rate-limit.server";
import { limitRequestBody } from "./request.server";
import {
  analyticsPageContext,
  isAnalyticsCollectionEnabled,
  validateAnalyticsEvent,
  type AnalyticsEventV1
} from "./analytics";

type AnalyticsEnv = {
  DB: D1Database;
  GOCAMP_ENV: string;
  ANALYTICS_ENABLED?: string;
};

const noStore = {
  "cache-control": "no-store",
  "x-robots-tag": "noindex, nofollow"
};

const response = (status: number) => new Response(null, { status, headers: noStore });

export async function ingestAnalyticsEvents(
  request: Request,
  env: AnalyticsEnv
): Promise<Response> {
  if (request.method !== "POST") return response(405);
  const url = new URL(request.url);
  if (!isAnalyticsCollectionEnabled(env, url)) return response(204);

  const origin = request.headers.get("origin");
  if (!origin || origin !== url.origin || request.headers.get("sec-fetch-site") === "cross-site") {
    return response(403);
  }
  if (/(?:bot|crawler|spider|headless|lighthouse)/i.test(request.headers.get("user-agent") || "")) {
    return response(204);
  }
  if (
    (request.headers.get("content-type") || "").split(";", 1)[0].trim().toLowerCase() !==
    "application/json"
  ) {
    return response(415);
  }

  let limited: Request;
  try {
    limited = await limitRequestBody(request, 8192);
  } catch (error) {
    if (error instanceof Response && error.status === 413) return response(413);
    return response(400);
  }

  let payload: unknown;
  try {
    payload = await limited.json();
  } catch {
    return response(400);
  }
  if (
    payload === null ||
    typeof payload !== "object" ||
    Array.isArray(payload) ||
    Object.keys(payload).some((key) => key !== "events")
  ) {
    return response(400);
  }
  const inputEvents = (payload as { events?: unknown }).events;
  if (!Array.isArray(inputEvents) || inputEvents.length < 1 || inputEvents.length > 10) {
    return response(400);
  }
  const now = Date.now();
  const events = inputEvents.map((event) => validateAnalyticsEvent(event, now));
  if (events.some((event) => event === null)) return response(400);
  const validEvents = events.filter((event): event is AnalyticsEventV1 => event !== null);
  if (new Set(validEvents.map((event) => event.eventId)).size !== validEvents.length) {
    return response(400);
  }

  if (!(await consumeRateLimit(env.DB, request, "analytics-events", 300, 10))) {
    return response(429);
  }

  for (const event of validEvents) {
    if (event.entityKind && event.entitySlug) {
      const entity = await env.DB.prepare(
        "SELECT 1 AS visible FROM catalog_entities WHERE kind=? AND slug=? AND status='active'"
      )
        .bind(event.entityKind, event.entitySlug)
        .first<{ visible: number }>();
      if (!entity) return response(400);
    }
  }

  // UTC day and bounded dimensions are chosen server-side; browser timestamps are validation only.
  const day = new Date().toISOString().slice(0, 10);
  const aggregates = new Map<
    string,
    { metric: string; pageType: string; entityKind: string; entitySlug: string; count: number }
  >();
  for (const event of validEvents) {
    const entityKind = event.entityKind || "";
    const entitySlug = event.entitySlug || "";
    const key = JSON.stringify([event.eventName, event.pageType, entityKind, entitySlug]);
    const aggregate = aggregates.get(key);
    if (aggregate) aggregate.count++;
    else {
      aggregates.set(key, {
        metric: event.eventName,
        pageType: event.pageType,
        entityKind,
        entitySlug,
        count: 1
      });
    }
  }
  try {
    await env.DB.batch(
      [...aggregates.values()].map((aggregate) =>
        env.DB.prepare(
          `INSERT INTO analytics_daily_rollups(day,metric,page_type,entity_kind,entity_slug,count,updated_at)
             VALUES(?,?,?,?,?,?,unixepoch())
             ON CONFLICT(day,metric,page_type,entity_kind,entity_slug) DO UPDATE SET
               count=count+excluded.count,updated_at=unixepoch()`
        ).bind(
          day,
          aggregate.metric,
          aggregate.pageType,
          aggregate.entityKind,
          aggregate.entitySlug,
          aggregate.count
        )
      )
    );
  } catch {
    // Do not return storage details or log event payloads; tracking must stay noncritical.
    return response(503);
  }

  return response(204);
}

/** Ingest production browser navigations; no IP or user IDs are stored. */
export async function ingestTrafficEvent(
  request: Request,
  env: AnalyticsEnv
): Promise<Response> {
  if (request.method !== "POST") return response(405);
  const url = new URL(request.url);
  if (!isAnalyticsCollectionEnabled(env, url)) return response(204);
  const origin = request.headers.get("origin");
  if (!origin || origin !== url.origin || request.headers.get("sec-fetch-site") === "cross-site") {
    return response(403);
  }
  if (/(?:bot|crawler|spider|headless|lighthouse)/i.test(request.headers.get("user-agent") || "")) {
    return response(204);
  }
  if (
    (request.headers.get("content-type") || "").split(";", 1)[0].trim().toLowerCase() !==
    "application/json"
  ) {
    return response(415);
  }

  let body: unknown;
  try {
    body = await (await limitRequestBody(request, 1024)).json();
  } catch (error) {
    return response(error instanceof Response && error.status === 413 ? 413 : 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) return response(400);
  const input = body as Record<string, unknown>;
  if (
    Object.keys(input).some((key) => !["pagePath", "search", "newSession"].includes(key)) ||
    typeof input.pagePath !== "string" ||
    input.pagePath.length > 256 ||
    typeof input.newSession !== "boolean" ||
    (input.search !== undefined &&
      (typeof input.search !== "string" || input.search.length > 256))
  ) {
    return response(400);
  }
  if (!analyticsPageContext(input.pagePath, String(input.search || ""))) return response(400);
  if (!(await consumeRateLimit(env.DB, request, "analytics-traffic", 120, 60))) {
    return response(429);
  }

  const day = new Date().toISOString().slice(0, 10);
  try {
    await env.DB.prepare(
      "INSERT INTO analytics_traffic_daily(day,visits,pageviews,updated_at) " +
        "VALUES(?,?,1,unixepoch()) ON CONFLICT(day) DO UPDATE SET " +
        "visits=visits+excluded.visits,pageviews=pageviews+1,updated_at=unixepoch()"
    )
      .bind(day, input.newSession ? 1 : 0)
      .run();
  } catch {
    return response(503);
  }
  return response(204);
}
