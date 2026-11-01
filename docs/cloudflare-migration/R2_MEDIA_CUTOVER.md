# GoCamp — GitHub images/uploads to Cloudflare R2 + D1 (staging)

## Migration status (2026-11-01)

- Source: branch `migration/cloudflare-react-workers-pr40`, original `images/` (332 files) and `uploads/` (one WebP).
- R2: `gocamp-staging-media` now contains **all 333** migrated original paths, plus two Austria camp assets (335 in total).
- D1: `gocamp-staging-db` has 335 `media_assets` rows, including 333 with `legacy_path`.
- Saved CMS: 205 media references across 78 catalog entities/documents were changed to `/media/<id>`, with revision-guarded updates; all succeeded.
- The static application retains the canonical old `/images/*` and `/uploads/*` URLs, but these URLs resolve **R2 only**. No image binaries or CDN fallback are required in this migration branch after this commit.
- `cloudflare-app/app/legacy-media.json` is a checked-in R2 inventory, not rebuilt from files on disk. The admin Media Library uses it to list legacy paths and checks D1 for usage.
- New CMS uploads remain R2-only under content-addressed keys, and are listed separately.
- Staging-only Admin → Media → Verify R2 migration checks R2 object metadata against the D1 registry.
- All image assets are preserved in R2; old paths are supported during transition to new managed media IDs.
- No production DB, production R2, cPanel, Aiven, or Tigris resources are modified.

## Source discrepancy
`images/logo-transparent.webp`: GitHub had 7,696 bytes; the existing R2 version has 45,220 bytes. **R2 was not overwritten**, because the Worker already serves its version; it could represent a later image update. The preserved D1 metadata and manifest refer to the R2 object, not the obsolete Git binary. Review its appearance before production promotion.

## Rollback
The legacy Git asset binaries are removed **only on this migration branch**. They remain recoverable from Git history. Revert the cutover commit if needed; R2 objects and live D1 rows are left intact for safe rollback. Previous staging D1 revisions are not automatically reverted.

## Verification
1. Ensure 333 known legacy R2 keys, with SHA-256 metadata, plus two Austria objects.
2. Ensure 333 legacy D1 media mappings and 335 total media rows.
3. Ensure no catalog/gallery/document image reference remains dependent on `/images/` or `/uploads/` for editorial content.
4. Verify `GET /images/logo.webp`, `GET /uploads/1_1761381038.webp` and `GET /media/<id>` from staging, checking content types and `X-GoCamp-Media-Source: r2` for legacy paths.
5. Verify Media Library search, view, replace, upload, safe deletion, and category/destination navigation before promoting production.

The older catalog import seed and PR39 overlays are intentionally retained. Rebuilds must import the media registry before replacing legacy content URLs; the R2 bucket is now the authoritative file store.
