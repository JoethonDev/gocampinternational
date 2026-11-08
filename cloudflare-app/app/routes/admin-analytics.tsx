import { Form, Link } from "react-router";
import { getCloudflare } from "../lib/cloudflare-context";
import type { Route } from "./+types/admin-analytics";
import { requireAdmin } from "../lib/admin.server";
import { AdminShell } from "../components/admin/AdminShell";
import { AdminPageHeader } from "../components/admin/AdminPageHeader";
import { AdminPanel } from "../components/admin/AdminPanel";
import { MetricCard } from "../components/admin/MetricCard";
import { loadAnalyticsReport } from "../features/admin/analytics/analytics.server";
import "../features/admin/analytics/analytics.css";

export function meta() {
  return [{ title: "GoCamp Analytics" }, { name: "robots", content: "noindex,nofollow" }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const { env } = getCloudflare(context);
  const authenticated = await requireAdmin(request, env.DB);
  const session = { username: authenticated.username, csrf: authenticated.csrf };
  const report = await loadAnalyticsReport(env.DB, request.url, env);
  return { session, environment: env.GOCAMP_ENV, ...report };
}

const metricLabels = {
  lead_form_open: "Booking form opens",
  whatsapp_click: "WhatsApp clicks",
  contact_cta_click: "Phone clicks"
} as const;

function dateLabel(value: string) {
  return new Date(`${value}T00:00:00.000Z`).toLocaleDateString("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC"
  });
}

export default function AdminAnalytics({ loaderData }: Route.ComponentProps) {
  const { session, environment, ...report } = loaderData;
  const rangeLinks = [
    ["7d", "7 days"],
    ["30d", "30 days"],
    ["90d", "90 days"]
  ] as const;

  return (
    <AdminShell username={session.username} csrf={session.csrf}>
      <div className="admin-analytics">
        <AdminPageHeader
          title="Analytics & SEO"
          description="Privacy-safe business actions and saved inquiries from the selected period."
          aside={<span className="admin-badge-soft text-capitalize">{environment}</span>}
        />

        <AdminPanel
          title="Date range"
          description={`${dateLabel(report.from)} – ${dateLabel(report.to)}`}
        >
          <div className="admin-analytics-range">
            <div className="btn-group" role="group" aria-label="Preset date ranges">
              {rangeLinks.map(([value, label]) => (
                <Link
                  key={value}
                  to={`?range=${value}`}
                  className={`btn btn-sm ${report.range === value ? "btn-primary" : "btn-outline-primary"}`}
                  aria-current={report.range === value ? "page" : undefined}
                >
                  {label}
                </Link>
              ))}
            </div>
            <Form method="get" className="admin-analytics-custom-range">
              <input type="hidden" name="range" value="custom" />
              <label>
                <span>From</span>
                <input
                  className="form-control form-control-sm"
                  type="date"
                  name="from"
                  defaultValue={report.from}
                />
              </label>
              <label>
                <span>To</span>
                <input
                  className="form-control form-control-sm"
                  type="date"
                  name="to"
                  defaultValue={report.to}
                />
              </label>
              <button className="btn btn-sm btn-outline-primary">Apply</button>
            </Form>
          </div>
        </AdminPanel>

        <div className="admin-kpi-grid">
          <MetricCard
            icon="bi-bar-chart-line"
            label="Visits & pageviews"
            value="Unavailable"
            detail={
              report.webAnalyticsConfigured
                ? report.collectionEnabled
                  ? "Web Analytics is configured; provider totals are not queried here."
                  : "A site tag is configured, but collection is disabled."
                : "Web Analytics site tag is not configured."
            }
            accent="blue"
          />
          <MetricCard
            icon="bi-inbox-fill"
            label="Saved inquiries"
            value={report.inquiryTotal}
            detail={`Contact ${report.inquiriesByKind.contact} · Lead ${report.inquiriesByKind.lead} · Newsletter ${report.inquiriesByKind.newsletter}`}
            accent="amber"
          />
          <MetricCard
            icon="bi-whatsapp"
            label={metricLabels.whatsapp_click}
            value={report.rollupsAvailable ? report.clicksByMetric.whatsapp_click : "Unavailable"}
            detail="Approximate browser-reported intent, not a confirmed message."
            accent="green"
          />
          <MetricCard
            icon="bi-telephone"
            label={metricLabels.contact_cta_click}
            value={
              report.rollupsAvailable ? report.clicksByMetric.contact_cta_click : "Unavailable"
            }
            detail="Approximate phone-link clicks; no call duration or outcome."
            accent="violet"
          />
          <MetricCard
            icon="bi-window"
            label={metricLabels.lead_form_open}
            value={report.rollupsAvailable ? report.clicksByMetric.lead_form_open : "Unavailable"}
            detail="Approximate modal opens; not a submitted form."
            accent="rose"
          />
        </div>

        <AdminPanel
          title="Data availability"
          description="Sources are labeled separately; unlike metrics are not combined into conversion rates."
        >
          <ul className="admin-analytics-status">
            <li>
              <strong>Inquiry conversions:</strong> persisted rows in D1, the application source of
              truth.
            </li>
            <li>
              <strong>Business clicks:</strong>{" "}
              {report.rollupsAvailable
                ? "daily aggregate rows in this environment's D1 database."
                : "the additive D1 rollup migration has not been applied."}
            </li>
            <li>
              <strong>Collection:</strong>{" "}
              {report.collectionEnabled
                ? "enabled on canonical production by explicit environment flags."
                : "disabled; collection requires the canonical production hostname and the production feature flag."}
            </li>
            <li>
              <strong>Visits and Core Web Vitals:</strong> not queried by this dashboard; use the
              Cloudflare Web Analytics provider after its beacon is configured.
            </li>
            <li>
              <strong>Campaign attribution:</strong> omitted from the limited D1 fallback; unknown
              sources are not inferred.
            </li>
            <li>
              <strong>Analytics Engine:</strong> not bound to this app; the D1 fallback stores only
              a small allowlist of daily business-click aggregates when collection is enabled.
            </li>
            <li>
              <strong>Indexing:</strong>{" "}
              {report.indexingEnabled
                ? "enabled for this canonical production host."
                : "disabled on this environment/host; this is not a Search Console index report."}
            </li>
          </ul>
        </AdminPanel>

        <p className="small text-secondary mb-0" aria-live="polite">
          {report.lastUpdatedAt
            ? `Latest source record: ${new Date(report.lastUpdatedAt * 1000).toLocaleString()}.`
            : "No source records are available for this period yet."}
        </p>

        <div className="admin-analytics-columns">
          <AdminPanel
            title="Daily activity"
            description="D1 click aggregates and saved inquiries. Missing days indicate zero recorded events."
          >
            {report.daily.length ? (
              <div className="table-responsive">
                <table className="table table-sm align-middle mb-0">
                  <thead>
                    <tr>
                      <th scope="col">UTC day</th>
                      <th scope="col">Business clicks</th>
                      <th scope="col">Saved inquiries</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.daily.map((row) => (
                      <tr key={row.day}>
                        <th scope="row">{dateLabel(row.day)}</th>
                        <td>{row.clicks}</td>
                        <td>{row.inquiries}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-secondary mb-0">No activity was recorded for this period.</p>
            )}
          </AdminPanel>

          <AdminPanel
            title="SEO metadata coverage"
            description="Active destination and category content only; this does not represent Google or Bing indexing."
          >
            <dl className="admin-analytics-definition-list">
              <div>
                <dt>Active destination/category pages</dt>
                <dd>{report.seoHealth.activeEntities}</dd>
              </div>
              <div>
                <dt>Pages with a usable description source</dt>
                <dd>{report.seoHealth.entitiesWithDescription}</dd>
              </div>
              <div>
                <dt>Descriptions shorter than 60 characters</dt>
                <dd>{report.seoHealth.entitiesWithThinDescription}</dd>
              </div>
              <div>
                <dt>Explicit noindex overrides</dt>
                <dd>{report.seoHealth.noindexOverrides}</dd>
              </div>
            </dl>
          </AdminPanel>
        </div>

        <AdminPanel
          title="Content actions"
          description="Only explicit CTA clicks attached to validated active destinations or categories are listed."
        >
          {report.topContentActions.length ? (
            <div className="table-responsive">
              <table className="table table-sm align-middle mb-0">
                <thead>
                  <tr>
                    <th scope="col">Page</th>
                    <th scope="col">Kind</th>
                    <th scope="col">CTA clicks</th>
                  </tr>
                </thead>
                <tbody>
                  {report.topContentActions.map((row) => (
                    <tr key={`${row.entityKind}:${row.entitySlug}`}>
                      <th scope="row">
                        {report.entityNames[`${row.entityKind}:${row.entitySlug}`] ||
                          row.entitySlug}
                      </th>
                      <td className="text-capitalize">{row.entityKind}</td>
                      <td>{row.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-secondary mb-0">
              No content-specific actions were recorded for this period.
            </p>
          )}
        </AdminPanel>
      </div>
    </AdminShell>
  );
}
