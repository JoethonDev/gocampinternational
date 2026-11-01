-- This schema is applied directly to the staging D1 database first.
-- Existing media IDs and original R2 object keys remain unchanged.
CREATE TABLE IF NOT EXISTS media_variants (
  media_id TEXT NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  preset TEXT NOT NULL CHECK(preset IN ('mobile','tablet','desktop')),
  object_key TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL DEFAULT 'image/webp',
  bytes INTEGER NOT NULL CHECK(bytes > 0),
  width INTEGER NOT NULL CHECK(width > 0),
  height INTEGER NOT NULL CHECK(height > 0),
  method TEXT NOT NULL CHECK(method IN ('ai','standard')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY(media_id,preset)
);
