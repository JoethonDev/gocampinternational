-- GoCamp D1 migration 0001; create once in staging; no production migration from CI.
-- Compact indexed entities + lossless original JSON keeps PR #40 fields unchanged.
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS catalog_entities (
  kind TEXT NOT NULL CHECK(kind IN ('program','destination','category')),
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL,
  category_slug TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  content_json TEXT NOT NULL CHECK(json_valid(content_json)),
  revision INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (kind,slug)
);
CREATE INDEX IF NOT EXISTS catalog_kind_status_order ON catalog_entities(kind,status,sort_order);
CREATE INDEX IF NOT EXISTS catalog_program_category_status ON catalog_entities(kind,category_slug,status);
CREATE TABLE IF NOT EXISTS destination_programs (
  destination_slug TEXT NOT NULL,
  program_slug TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(destination_slug,program_slug),
  FOREIGN KEY(destination_slug) REFERENCES catalog_entities(slug) DEFERRABLE INITIALLY DEFERRED
);
-- A destination can be represented by the same slug as another type; application enforces kind.
CREATE INDEX IF NOT EXISTS destination_program_lookup ON destination_programs(program_slug);
CREATE TABLE IF NOT EXISTS site_documents (
  key TEXT PRIMARY KEY CHECK(key IN ('site_settings','camp_memories','faq')),
  content_json TEXT NOT NULL CHECK(json_valid(content_json)),
  revision INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE TABLE IF NOT EXISTS media_assets (
  id TEXT PRIMARY KEY,
  object_key TEXT NOT NULL UNIQUE,
  legacy_path TEXT UNIQUE,
  display_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  bytes INTEGER NOT NULL DEFAULT 0 CHECK(bytes >= 0),
  sha256 TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  is_public INTEGER NOT NULL DEFAULT 1 CHECK(is_public IN (0,1)),
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS media_sha_lookup ON media_assets(sha256);
CREATE TABLE IF NOT EXISTS import_sources (
  source_path TEXT PRIMARY KEY,
  sha256 TEXT NOT NULL,
  imported_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE TABLE IF NOT EXISTS inquiries (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK(kind IN ('contact','lead','newsletter')),
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new',
  content_json TEXT NOT NULL CHECK(json_valid(content_json)),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS inquiries_kind_status_date ON inquiries(kind,status,created_at);
CREATE TABLE IF NOT EXISTS admin_sessions (
  session_hash TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  csrf_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS admin_session_expiry ON admin_sessions(expires_at);
