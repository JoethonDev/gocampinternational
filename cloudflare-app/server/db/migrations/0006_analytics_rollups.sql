-- Bounded business-click aggregates only; raw pageviews and visitor identifiers are not stored.
CREATE TABLE IF NOT EXISTS analytics_daily_rollups (
  day TEXT NOT NULL CHECK(day GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  metric TEXT NOT NULL CHECK(metric IN ('lead_form_open','whatsapp_click','contact_cta_click')),
  page_type TEXT NOT NULL CHECK(page_type IN ('home','destination','category','about','faq','contact','landing')),
  entity_kind TEXT NOT NULL DEFAULT '' CHECK(entity_kind IN ('','destination','category')),
  entity_slug TEXT NOT NULL DEFAULT '' CHECK(
    entity_slug = '' OR (
      length(entity_slug) <= 160 AND
      entity_slug GLOB '[a-z0-9]*' AND
      entity_slug NOT GLOB '*[^a-z0-9_-]*'
    )
  ),
  count INTEGER NOT NULL DEFAULT 0 CHECK(count >= 0),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY(day,metric,page_type,entity_kind,entity_slug),
  CHECK((entity_kind = '' AND entity_slug = '') OR (entity_kind <> '' AND entity_slug <> ''))
);
CREATE INDEX IF NOT EXISTS analytics_daily_by_metric_day
  ON analytics_daily_rollups(metric,day);
CREATE INDEX IF NOT EXISTS inquiries_created_at_kind
  ON inquiries(created_at,kind);
-- Retain at most 400 days of aggregates when new daily dimensions are created.
CREATE TRIGGER IF NOT EXISTS analytics_daily_rollups_retention
AFTER INSERT ON analytics_daily_rollups
BEGIN
  DELETE FROM analytics_daily_rollups WHERE day < date('now','-400 days');
END;
