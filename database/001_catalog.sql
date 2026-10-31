-- GoCamp content schema. Run independently on staging and production.
-- Do not run automatically on deployment. Apply with psql after backup.
BEGIN;
CREATE TABLE IF NOT EXISTS program_categories (
 slug text PRIMARY KEY, name text NOT NULL, status text NOT NULL DEFAULT 'inactive',
 banner text NOT NULL DEFAULT '', intro text NOT NULL DEFAULT '', intro_image text NOT NULL DEFAULT '',
 color text, section_visibility jsonb NOT NULL DEFAULT '{}'::jsonb,
 extra jsonb NOT NULL DEFAULT '{}'::jsonb, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS programs (
 id text PRIMARY KEY, category_slug text NOT NULL, name text NOT NULL, status text NOT NULL DEFAULT 'inactive',
 display_order integer, image text NOT NULL DEFAULT '', age_min smallint, age_max smallint,
 duration integer, price text NOT NULL DEFAULT '', color text NOT NULL DEFAULT '',
 description text NOT NULL DEFAULT '', tagline text NOT NULL DEFAULT '', level text NOT NULL DEFAULT '',
 visibility_overrides jsonb NOT NULL DEFAULT '{}'::jsonb,
 extra jsonb NOT NULL DEFAULT '{}'::jsonb, updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT ages_order CHECK(age_min IS NULL OR age_max IS NULL OR age_min <= age_max)
);
CREATE INDEX IF NOT EXISTS programs_category_status_idx ON programs(category_slug,status);
CREATE INDEX IF NOT EXISTS programs_status_order_idx ON programs(status,display_order);
CREATE TABLE IF NOT EXISTS destinations (
 slug text PRIMARY KEY, name text NOT NULL, status text NOT NULL DEFAULT 'inactive',
 banner text NOT NULL DEFAULT '', tagline text NOT NULL DEFAULT '', intro_image text NOT NULL DEFAULT '',
 intro_text text NOT NULL DEFAULT '', section_visibility jsonb NOT NULL DEFAULT '{}'::jsonb,
 visibility_overrides jsonb NOT NULL DEFAULT '{}'::jsonb,
 extra jsonb NOT NULL DEFAULT '{}'::jsonb, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS destinations_status_idx ON destinations(status);
CREATE TABLE IF NOT EXISTS destination_programs (
 destination_slug text NOT NULL REFERENCES destinations(slug) ON DELETE CASCADE,
 program_id text NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
 position integer NOT NULL DEFAULT 0, PRIMARY KEY(destination_slug,program_id)
);
CREATE INDEX IF NOT EXISTS destination_programs_program_idx ON destination_programs(program_id);
-- Repeated structured fields. One item = one row with typed columns, not a JSON array.
CREATE TABLE IF NOT EXISTS catalog_items (
 owner_type text NOT NULL CHECK(owner_type IN ('program','destination','category','memories')),
 owner_id text NOT NULL, field text NOT NULL,
 position integer NOT NULL CHECK(position >= 0), value text, label text, icon text,
 title text, content text, image text, number text, suffix text,
 is_active boolean, in_slider boolean,
 PRIMARY KEY(owner_type,owner_id,field,position)
);
CREATE INDEX IF NOT EXISTS catalog_items_owner_idx ON catalog_items(owner_type,owner_id);
CREATE TABLE IF NOT EXISTS site_settings (
 key text PRIMARY KEY, value jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS global_faqs (
 position integer PRIMARY KEY CHECK(position >= 0), question text NOT NULL, answer text NOT NULL
);
CREATE TABLE IF NOT EXISTS media_assets (
 object_key text PRIMARY KEY, public_path text NOT NULL UNIQUE,
 original_name text NOT NULL, content_type text NOT NULL,
 bytes bigint NOT NULL CHECK(bytes >= 0), sha256 text NOT NULL,
 width integer, height integer, is_public boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS media_assets_sha_idx ON media_assets(sha256);
CREATE TABLE IF NOT EXISTS catalog_revisions (
 catalog text PRIMARY KEY,
 revision bigint NOT NULL DEFAULT 0,
 updated_at timestamptz NOT NULL DEFAULT now()
);
COMMIT;
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS legacy_path text UNIQUE;
