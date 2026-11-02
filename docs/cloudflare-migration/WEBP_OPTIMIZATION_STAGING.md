# GoCamp staging WebP migration (2026-11-02)

- Existing React Router Worker performs upload-time optimization using env.IMAGES and R2.
- New uploads: convert JPEG/PNG/GIF/AVIF/WebP to WebP quality 86, once per content SHA-256.
- Cache reuse: same image bytes (regardless of filename) reuses media ID; same filename with changed content gets a different content-addressed R2 key and media ID.
- R2 stores WebP with long-lived immutable headers; public /media/<id> responds with WebP and ETag for 304 revalidation.
- Legacy /images/*.png and *.gif routes stay accessible. After backfill their D1 legacy_path mappings point to optimized WebP content with the original URL unchanged.
- A staging-only scheduled handler backfills older managed media using the Images binding and atomically switches object_key, mime_type, byte size, and SHA-256 in D1.
- Run the staging cron temporarily, then remove the cron schedule after the D1 non-WebP count is zero.
- Avoid deleting old R2 keys or historical media records until references and legacy hotlinks have been checked: identical object hashes are not sufficient proof that a URL is unused.
- Scope: migration/cloudflare-react-workers-pr40 branch + staging database and bucket only. Never touch production resources.
