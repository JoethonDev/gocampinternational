-- Browser sessions and pageviews only, no visitor identifiers or individual activity records.
CREATE TABLE IF NOT EXISTS analytics_traffic_daily (
  day TEXT PRIMARY KEY NOT NULL CHECK(day GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  visits INTEGER NOT NULL DEFAULT 0 CHECK(visits >= 0),
  pageviews INTEGER NOT NULL DEFAULT 0 CHECK(pageviews >= 0),
  updated_at INTEGER NOT NULL DEFAULT(unixepoch())
);
CREATE TRIGGER IF NOT EXISTS analytics_traffic_retention
AFTER INSERT ON analytics_traffic_daily
BEGIN
  DELETE FROM analytics_traffic_daily WHERE day < date('now','-400 days');
END;
