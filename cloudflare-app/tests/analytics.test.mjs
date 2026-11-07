import test from "node:test";
import assert from "node:assert/strict";
import { loadTypeScript } from "./load-typescript.mjs";
import { SqliteD1, entity } from "./sqlite-d1.mjs";

const {
  analyticsPageContext,
  isAnalyticsCollectionEnabled,
  validateAnalyticsEvent,
  webAnalyticsSiteTag
} =
  await loadTypeScript("../app/lib/analytics.ts");
const { ingestAnalyticsEvents } = await loadTypeScript("../app/lib/analytics.server.ts");
const { loadAnalyticsReport } = await loadTypeScript(
  "../app/features/admin/analytics/analytics.server.ts"
);

const enabledEnv = {
  GOCAMP_ENV: "production",
  ANALYTICS_ENABLED: "true",
  ANALYTICS_PRIVACY_NOTICE_PUBLISHED: "true"
};

function event(overrides = {}) {
  return {
    version: 1,
    eventId: crypto.randomUUID(),
    eventName: "lead_form_open",
    occurredAt: new Date().toISOString(),
    pagePath: "/program/category",
    pageType: "category",
    entityKind: "category",
    entitySlug: "language-camps",
    elementId: "header_book_now",
    ...overrides
  };
}

function request(events, overrides = {}) {
  return new Request("https://gocampinternational.net/api/analytics/events", {
    method: "POST",
    headers: {
      origin: "https://gocampinternational.net",
      "content-type": "application/json",
      "cf-connecting-ip": "203.0.113.42",
      ...overrides
    },
    body: JSON.stringify({ events })
  });
}

test("analytics stays closed off outside explicitly enabled canonical production", () => {
  assert.equal(
    isAnalyticsCollectionEnabled(enabledEnv, new URL("https://gocampinternational.net/")),
    true
  );
  assert.equal(
    isAnalyticsCollectionEnabled(enabledEnv, new URL("https://new.gocampinternational.net/")),
    false
  );
  assert.equal(
    isAnalyticsCollectionEnabled(
      { ...enabledEnv, GOCAMP_ENV: "staging" },
      new URL("https://gocampinternational.net/")
    ),
    false
  );
  assert.equal(
    isAnalyticsCollectionEnabled(
      { ...enabledEnv, ANALYTICS_PRIVACY_NOTICE_PUBLISHED: "false" },
      new URL("https://gocampinternational.net/")
    ),
    false
  );
  assert.equal(
    isAnalyticsCollectionEnabled(enabledEnv, new URL("https://gocampinternational.net:444/")),
    false
  );
  assert.equal(
    webAnalyticsSiteTag(
      { ...enabledEnv, WEB_ANALYTICS_SITE_TAG: "public-site-tag-123456" },
      new URL("https://gocampinternational.net/")
    ),
    "public-site-tag-123456"
  );
  assert.equal(
    webAnalyticsSiteTag(
      { ...enabledEnv, WEB_ANALYTICS_SITE_TAG: "<script>alert(1)</script>" },
      new URL("https://gocampinternational.net/")
    ),
    undefined
  );
});

test("analytics page context keeps only known routes and bounded catalog slugs", () => {
  assert.deepEqual(analyticsPageContext("/destinations/italy", "?utm_source=private"), {
    pagePath: "/destinations/italy",
    pageType: "destination",
    entityKind: "destination",
    entitySlug: "italy"
  });
  assert.deepEqual(analyticsPageContext("/program/category", "?category=language-camps"), {
    pagePath: "/program/category",
    pageType: "category",
    entityKind: "category",
    entitySlug: "language-camps"
  });
  assert.equal(analyticsPageContext("/program/category", "?category=hello%40mail.test"), null);
  assert.equal(analyticsPageContext("/admin/inquiries", ""), null);
  assert.equal(analyticsPageContext("https://attacker.example/", ""), null);
});

test("event schema rejects PII, forged conversions, invalid routes and stale timestamps", () => {
  assert.ok(validateAnalyticsEvent(event()));
  assert.equal(validateAnalyticsEvent(event({ email: "parent@example.test" })), null);
  assert.equal(validateAnalyticsEvent(event({ eventName: "lead_form_success" })), null);
  assert.equal(validateAnalyticsEvent(event({ pagePath: "/admin/inquiries" })), null);
  assert.equal(
    validateAnalyticsEvent(event({ occurredAt: "2020-01-01T00:00:00.000Z" })),
    null
  );
  assert.equal(
    validateAnalyticsEvent(event({ eventName: "whatsapp_click", elementId: "contact_whatsapp" })),
    null
  );
});

test("event ingestion is disabled by default and stores only bounded daily aggregates", async () => {
  const db = new SqliteD1();
  const disabled = await ingestAnalyticsEvents(request([event()]), {
    DB: db,
    GOCAMP_ENV: "staging",
    ANALYTICS_ENABLED: "true",
    ANALYTICS_PRIVACY_NOTICE_PUBLISHED: "true"
  });
  assert.equal(disabled.status, 204);
  assert.equal(db.sql.prepare("SELECT COUNT(*) AS count FROM analytics_daily_rollups").get().count, 0);

  entity(db, "category", "language-camps");
  const oldDay = new Date(Date.now() - 401 * 86400000).toISOString().slice(0, 10);
  db.sql
    .prepare(
      "INSERT INTO analytics_daily_rollups(day,metric,page_type,count) VALUES(?,'whatsapp_click','contact',1)"
    )
    .run(oldDay);
  assert.equal(
    db.sql.prepare("SELECT COUNT(*) AS count FROM analytics_daily_rollups WHERE day=?").get(oldDay)
      .count,
    0
  );
  const accepted = await ingestAnalyticsEvents(request([event(), event()]), { DB: db, ...enabledEnv });
  assert.equal(accepted.status, 204);
  assert.equal(
    db.sql.prepare("SELECT COUNT(*) AS count FROM analytics_daily_rollups WHERE day=?").get(oldDay)
      .count,
    0
  );
  const row = db.sql
    .prepare("SELECT day,metric,page_type,entity_kind,entity_slug,count FROM analytics_daily_rollups")
    .get();
  assert.equal(row.day, new Date().toISOString().slice(0, 10));
  assert.equal(row.metric, "lead_form_open");
  assert.equal(row.page_type, "category");
  assert.equal(row.entity_kind, "category");
  assert.equal(row.entity_slug, "language-camps");
  assert.equal(row.count, 2);
  const columns = db.sql
    .prepare("PRAGMA table_info(analytics_daily_rollups)")
    .all()
    .map((column) => column.name);
  assert.equal(columns.some((column) => /email|phone|name|session|ip/i.test(column)), false);
});

test("event ingestion rejects cross-origin and unknown payload fields before persistence", async () => {
  const db = new SqliteD1();
  entity(db, "category", "language-camps");
  const crossOrigin = await ingestAnalyticsEvents(request([event()], { origin: "https://other.test" }), {
    DB: db,
    ...enabledEnv
  });
  const privatePayload = await ingestAnalyticsEvents(
    request([{ ...event(), email: "parent@example.test" }]),
    { DB: db, ...enabledEnv }
  );
  assert.equal(crossOrigin.status, 403);
  assert.equal(privatePayload.status, 400);
  assert.equal(db.sql.prepare("SELECT COUNT(*) AS count FROM analytics_daily_rollups").get().count, 0);
});

test("event ingestion drops obvious crawlers before writing aggregates", async () => {
  const db = new SqliteD1();
  const crawler = await ingestAnalyticsEvents(request([event()], { "user-agent": "ExampleBot/1.0" }), {
    DB: db,
    ...enabledEnv
  });
  assert.equal(crawler.status, 204);
  assert.equal(db.sql.prepare("SELECT COUNT(*) AS count FROM analytics_daily_rollups").get().count, 0);
});

test("event ingestion bounds request size and per-address event rate", async () => {
  const db = new SqliteD1();
  entity(db, "category", "language-camps");
  const oversized = await ingestAnalyticsEvents(
    request([{ ...event(), extra: "x".repeat(9000) }]),
    { DB: db, ...enabledEnv }
  );
  assert.equal(oversized.status, 413);

  const results = [];
  for (let index = 0; index < 11; index++) {
    results.push(
      await ingestAnalyticsEvents(request([event()]), { DB: db, ...enabledEnv })
    );
  }
  assert.equal(results.slice(0, 10).every((result) => result.status === 204), true);
  assert.equal(results[10].status, 429);
});

test("admin analytics reports aggregate counts without returning inquiry details", async () => {
  const db = new SqliteD1();
  entity(db, "destination", "italy", {
    tagline: "Language and cultural camps in Italy for international students."
  });
  const id = crypto.randomUUID();
  db.sql
    .prepare(
      "INSERT INTO inquiries(id,kind,name,email,phone,status,content_json,created_at) VALUES(?,?,?,?,?,'new','{}',?)"
    )
    .run(id, "lead", "Private parent", "private@example.test", "+2012345678", Math.floor(Date.now() / 1000));

  const report = await loadAnalyticsReport(
    db,
    "https://new.gocampinternational.net/admin/analytics?range=30d",
    { GOCAMP_ENV: "staging" }
  );
  assert.equal(report.inquiryTotal, 1);
  assert.equal(report.inquiriesByKind.lead, 1);
  assert.equal(report.seoHealth.activeEntities, 1);
  assert.equal(report.seoHealth.entitiesWithDescription, 1);
  assert.equal(report.collectionEnabled, false);
  assert.equal(report.webAnalyticsConfigured, false);
  assert.equal(JSON.stringify(report).includes("private@example.test"), false);
  assert.equal(JSON.stringify(report).includes("Private parent"), false);
});
