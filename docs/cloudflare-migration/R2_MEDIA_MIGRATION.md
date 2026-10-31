# Cloudflare-only staging R2 media migration

## Scope (2026-10-31)
This migration extends the **full-stack React Router + Cloudflare Worker + D1 + R2** application on `migration/cloudflare-react-workers-pr40`. It is **not** a PHP deployment or a database migration. Production is unchanged.

- Repository `images/` (331+ files, ~22 MB): stage copies under the same R2 keys `images/<filename>` and keep all existing `/images/<filename>` URLs.
- CMS uploads: already use private R2 `MEDIA` binding and `/media/:id` route. Leave authorization, visibility, delete and caching behavior unchanged.
- CSS, JS, React build chunks, HTML: keep as Cloudflare Workers Static Assets, **not R2 objects**.
- Legacy PHP-only `admin/placeholder-image.png`: not part of the React app's published assets; do not blindly import old admin/PHP artifacts.
- `uploads/` contains no committed uploaded media; never migrate `.gitkeep` or secrets.
- Any later real attachments/PDFs must use typed media upload rules and access policies; this commit migrates committed public images only.

## Rollout

1. Configure existing `gocamp-staging-media` as the `MEDIA` bucket (already bound in `cloudflare-app/wrangler.json`).
2. Keep original image files copied into build during migration as a fallback.
3. Staging uses `assets.binding=ASSETS` and Worker-first routing for `/images/*`. Worker checks private R2 first, then serves existing static asset when missing. The public URL does not change.
4. Open staging `/admin/media/import` while authenticated, click **Start / resume R2 import**, keep page open. It imports batches of 8. This action is disabled unless `GOCAMP_ENV=staging`, and every POST checks session, origin, and CSRF.
5. Each object copies exact repository bytes from the Worker's current bundled static assets to R2. Existing entries are not overwritten: size and SHA-256 metadata must agree. Newly uploaded objects are verified by a fresh R2 HEAD.
6. When import completes, inspect R2 object count/keys and verify pages, banners, galleries, and `HEAD /images/hero.webp`. Check `/media/:id` CMS uploads and admin media library.
7. **Separate follow-up cutover:** only after evidence confirms all R2 objects, update `scripts/prepare-assets.mjs` to stop bundling `images/`, preserve `app/legacy-media.json` for CMS, and remove the static fallback. No deletions from GitHub/R2 during this stage. Do not cut over production from the staging task.

## Rollback
Revert the Worker-first image routing and return to the existing bundled static assets. R2 copies may safely remain in the private bucket. The import only writes missing objects under `images/` and never deletes, modifies D1, or updates CMS URLs.

## Verification gates
- Import reports `total == uploaded + existing` with no failures.
- R2 object keys and content SHA-256 metadata match source for all files.
- New and legacy media pages render without 403/404, UI layout unchanged.
- Admin upload, preview, publish/hide, rename, delete, and reference protection continue to work.
- Staging remains noindex, production R2 binding never touched.
- Cloudflare build/typecheck pass and staging image requests serve R2 when present, static fallback when absent.

**Current status:** staging import flow implemented in source. Upload of image bytes requires invoking the authenticated staging admin action; do not claim bytes are migrated until the action completes and remote R2 is verified.
