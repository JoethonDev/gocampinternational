-- GoCamp staging content policy (2026-11-01).
-- Requires optimized image in staging R2 before registering it.
-- Idempotent; applies to draft, inactive, active, and trashed programs.
BEGIN TRANSACTION;
INSERT OR IGNORE INTO media_assets
 (id,object_key,legacy_path,display_name,mime_type,bytes,sha256,width,height,is_public)
VALUES
 ('a3bb62bf-6d92-4ca5-91e5-5cb1f2348c1b',
  'images/branding/gocamp-international-logo-20261101.webp',
  NULL,'Go Camp International logo (2026)','image/webp',
  79350,'4f1884e2bc1ba09814d52943b33e5a846c660e4fdc5b9b45346cab63d8295be9',
  960,502,1);
UPDATE catalog_entities
SET content_json=json_remove(content_json,'$.price'),
    revision=revision+1,updated_at=unixepoch()
WHERE kind='program' AND json_type(content_json,'$.price') IS NOT NULL;
COMMIT;
