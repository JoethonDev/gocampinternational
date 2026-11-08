import test from "node:test";
import assert from "node:assert/strict";
import { loadTypeScript } from "./load-typescript.mjs";

const { loadCloudflareWebAnalytics } = await loadTypeScript(
  "../app/features/admin/analytics/cloudflare-web-analytics.server.ts"
);

const config = {
  GOCAMP_ENV: "production",
  ANALYTICS_ENABLED: "true",
  CF_ANALYTICS_API_TOKEN: "test-only-token",
  CF_ANALYTICS_ACCOUNT_ID: "a".repeat(32),
  CF_WEB_ANALYTICS_SITE_TAG: "b".repeat(32)
};
const url = new URL("https://gocampinternational.net/admin/analytics");
const now = new Date("2026-11-08T10:00:00Z");

test("Cloudflare reporting excludes staging and missing credentials", async () => {
  let calls = 0;
  const unavailableFetch = async () => {
    calls++;
    throw new Error("Should not fetch");
  };
  const disabled = await loadCloudflareWebAnalytics(
    { ...config, GOCAMP_ENV: "staging" },
    url,
    "2026-11-01",
    "2026-11-08",
    now,
    unavailableFetch
  );
  const missing = await loadCloudflareWebAnalytics(
    { ...config, CF_ANALYTICS_API_TOKEN: undefined },
    url,
    "2026-11-01",
    "2026-11-08",
    now,
    unavailableFetch
  );
  assert.equal(disabled.status, "disabled");
  assert.equal(missing.status, "not_configured");
  assert.equal(calls, 0);
});

test("Cloudflare GraphQL returns provider visits and pageviews with site ID", async () => {
  const calls = [];
  const fakeFetch = async (_url, request) => {
    calls.push({
      authorization: request.headers.authorization,
      variables: JSON.parse(request.body).variables
    });
    return new Response(
      JSON.stringify({
        data: {
          viewer: {
            accounts: [
              {
                rumPageloadEventsAdaptiveGroups: [
                  { count: 12, sum: { visits: 5 }, dimensions: { date: "2026-11-07" } },
                  { count: 3, sum: { visits: 2 }, dimensions: { date: "2026-11-08" } }
                ]
              }
            ]
          }
        },
        errors: null
      }),
      { status: 200 }
    );
  };
  const result = await loadCloudflareWebAnalytics(
    config,
    url,
    "2026-11-07",
    "2026-11-08",
    now,
    fakeFetch
  );
  assert.equal(result.status, "ok");
  assert.equal(result.visits, 7);
  assert.equal(result.pageviews, 15);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].authorization, "Bearer test-only-token");
  assert.equal(calls[0].variables.siteTag, config.CF_WEB_ANALYTICS_SITE_TAG);
  assert.equal(calls[0].variables.end, "2026-11-09T00:00:00.000Z");
  assert.equal(JSON.stringify(result).includes("test-only-token"), false);
});

test("Cloudflare API errors never masquerade as zero traffic", async () => {
  const denied = await loadCloudflareWebAnalytics(
    config,
    url,
    "2026-11-01",
    "2026-11-08",
    now,
    async () => new Response("Forbidden", { status: 403 })
  );
  assert.equal(denied.status, "access_denied");
  assert.equal(denied.coverageFrom, null);
  const graphqlFailure = await loadCloudflareWebAnalytics(
    config,
    url,
    "2026-11-01",
    "2026-11-08",
    now,
    async () =>
      new Response(
        JSON.stringify({
          data: null,
          errors: [{ message: "not authorized for that account" }]
        }),
        { status: 200 }
      )
  );
  assert.equal(graphqlFailure.status, "access_denied");
});
