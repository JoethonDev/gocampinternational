# GoCamp staging — No program pricing and R2 logo (November 1, 2026)

- All 65 staging D1 program rows had the obsolete `price` property removed (including eight populated price values). Rows retain all other catalog information and status. This is not a currency conversion or hidden UI setting.
- The React Admin CMS no longer exposes a price field or accepts `price` into program payloads; old records have their price stripped on edits. The legacy PHP snapshot-to-D1 seed also strips the field on subsequent rebuilds.
- Transformed, transparent logo is stored at `images/branding/gocamp-international-logo-20261101.webp` in the staging `gocamp-staging-media` bucket. Size: 79,350 bytes; 960 × 502 pixels; SHA-256: `4f1884e2bc1ba09814d52943b33e5a846c660e4fdc5b9b45346cab63d8295be9`; media id: `a3bb62bf-6d92-4ca5-91e5-5cb1f2348c1b`.
- The web app's global site logo points to `/media/a3bb62bf-6d92-4ca5-91e5-5cb1f2348c1b`, resolved by D1 + R2, not from the React build.
- `prepare-assets.mjs` removes obsolete `public/images` and `public/uploads` directories before dev and production builds. Build verification rejects image files in public/client outputs; CSS and JavaScript remain standard static assets.
- All legacy `/images/*` and `/uploads/*` URLs are still allowed for link compatibility, but the Worker routes them **exclusively through R2**, with no static fallback. `/media/*` resolves through D1 + R2.
- The SQL overlay is staging-only and supports a fresh D1 rebuild after the R2 logo exists. No production D1 or R2 data changes were made.

Verify actual deployment with `/media/a3bb62bf-6d92-4ca5-91e5-5cb1f2348c1b`, navigation header and Admin Catalog program editor. The logo may need a subsequent visual adjustment for site-header proportions.
