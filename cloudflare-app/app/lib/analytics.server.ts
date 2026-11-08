import { consumeRateLimit } from "./rate-limit.server";
import { limitRequestBody } from "./request.server";
import {
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
