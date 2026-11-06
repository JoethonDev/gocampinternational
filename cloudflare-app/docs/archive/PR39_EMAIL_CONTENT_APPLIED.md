# October 30, 2026 GoCamp email content — Cloudflare staging

## Current approved staging state — November 1, 2026

Following the original inactive-draft import documented below, the user explicitly approved **activating the Special Interests Camps category and disabling all other programs in that category**.

- Category `special-interests-camps`: **active**, including updated introduction/sections that describe only the two approved programs.
- Approved/active: `austria-adventure-camp`, `uk-creative-summer` (the latter's image reference was changed separately in staging; verify editorial suitability before production).
- Set from active to inactive: `italy-fashion`, `italy-food`, `italy-outdoor-exploration`, `switzerland-adventure-camp`, `switzerland-ski-camp`.
- Already inactive and retained: `canada-adventure-summer`.
- Already in trash, retained without restoration: `italy-sea-quest`, `switzerland-film-academy`.
- Final verified staging count: **2 active, 6 inactive, 2 trash**. Status columns and JSON status fields match. No records, R2 images or destination associations were deleted.

The durable, idempotent SQL patch is `cloudflare-app/migration/overlays/special-interests-approved-programs-staging.sql`. It is **staging-only**, applied after the earlier PR39 overlays; it preserves later editor changes unless the original category content matches the known source revision. Production D1/R2 and cPanel were not modified by this update.

---

## Applied on staging
Both approved PR39 program drafts already existed in `gocamp-staging-db` before this follow-up (inactive). This update retained them as **inactive drafts**, added the two Austria email JPEGs optimized to WebP in the private `gocamp-staging-media` bucket, created their `media_assets` rows and program references, recorded the seven UK disciplines as JSON content, and linked the drafts to their respective destinations in both `destination_programs` and destination JSON.

- Austria Adventure Camp: `/media/a91e66de-6fce-5e12-b63f-a919564ec653` hero, both Austria images in gallery
- UK Creative Summer: seven disciplines, ages 12–17; **no supplied image**, do not invent
- Vienna German Summer for Teenagers: preserved unchanged
- Special Interests Camps: **still trashed**; reactivation would expose other legacy content and requires separate review
- The `villagecamps.com` link from the email is internal-only; **never publish it**
- Dates, prices, duration and Austria age eligibility remain unspecified

## Durable import reference
`pr39-email-20261030-staging.sql` is an **idempotent staging-only patch** to apply after the existing PR39 inactive overlay when rebuilding a *new staging* D1 database. `pr39-email-20261030-media.json` is the media manifest, with actual R2 object keys, SHA-256 hashes, sizes and media IDs. The objects must exist in R2 before the SQL runs. **Do not use these staging identifiers or this SQL for production promotion without a reviewed process.**

The migration changes were applied directly to staging D1 and R2 on 2026-11-01 and checked by reading back records. The SQL is committed for reproducibility and should not overwrite later CMS edits.

## Verification queries
```sql
SELECT slug,status,revision,json_extract(content_json,'$.image') AS hero
FROM catalog_entities WHERE kind='program' AND slug IN ('austria-adventure-camp','uk-creative-summer');
SELECT destination_slug,program_slug,position FROM destination_programs
WHERE program_slug IN ('austria-adventure-camp','uk-creative-summer');
SELECT id,object_key,bytes,sha256 FROM media_assets
WHERE object_key LIKE 'images/programs/austria-adventure-camp/%';
```

Only the Cloudflare staging database and bucket are in scope. No Aiven, Tigris, cPanel, FTP, Cron Job, Cloudflare production database or production R2 bucket is used.
