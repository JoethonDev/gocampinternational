-- Anonymous form throttling. Source of truth is D1, not ephemeral Worker memory.
CREATE TABLE IF NOT EXISTS submission_limits (
  scope TEXT NOT NULL,
  address_hash TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK(attempts >= 0),
  PRIMARY KEY (scope,address_hash)
);
CREATE INDEX IF NOT EXISTS submission_limits_expiry ON submission_limits(window_start);
