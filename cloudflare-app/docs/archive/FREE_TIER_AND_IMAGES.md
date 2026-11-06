# Free-tier budget and media/CPU policy (validated against 2026-10-31 Cloudflare docs)
Important: quotas are ACCOUNT-WIDE and shared with other personal Workers/D1/R2 usage. $0 additional spend cannot be guaranteed without usage checks; do not enable paid products or upgrade automatically.

## Cloudflare Free limits to respect
- Worker Free: 100,000 requests/day shared account-wide, 10 ms CPU/request; no reliance on >10 ms React SSR per request. Requests for matched Static Assets are free/unlimited when routed without Worker. Inspect real CPU and request usage under realistic traffic.
- D1 Free: 5 million rows read/day, 100,000 rows written/day, 5 GB total storage, 10 databases/account. Personal account had 6 D1 DBs; 2 created here -> 8 total. Daily limits enforced (query failures after exhaustion).
- Cloudflare Images Free: 5,000 UNIQUE transformations/month, account-wide. No new transformation over free allowance; repeat same source/parameters reuses counted transformation. On exhaustion new variants can fail with 9422: fallback to public original / prebuilt static variant.
- R2 Standard: free allowance 10 GB-month, 1M Class A, 10M Class B requests per month account-wide; measure existing buckets before claiming $0. R2 Free is an allowance, not a spend cap when activated.
- No paid Image Storage, no image upscaling AI, no Queues, no paid Workflows, no Browser Rendering, no Hyperdrive (no Aiven runtime), no cron or KV necessary.

## CPU and request-budget design
1. Build-time optimize existing images on GitHub Actions (Sharp/libvips), not a Worker. Retain stable image paths and legacy fallback. Generate only image widths needed by actual UI; produce compressed WebP/AVIF where supported.
2. Serve committed assets directly through Workers Static Assets (asset-first). No Worker per image/CSS/font request.
3. Cache full catalog fragments/SSR HTML with explicit invalidation on admin update; public pages must not query D1 on each image or form paint. Avoid stale visibility leaks; ensure admin routes no-store.
4. Use a small number of indexed D1 reads per public dynamic response; avoid N+1 and full-list replacement per edit; batch database writes.
5. For CMS R2 images, prefer static variant + direct R2 edge caching. Stream bytes; never buffer, decode, re-encode or upscale in Worker JS.
6. Optional Cloudflare Images Free presets: 400, 800, 1280 width max with no arbitrary client dimensions. Estimate: N new images * 3 presets unique/month; protect the shared account's remaining transformation allowance. Prefer fewer variants and precomputed versions.
7. Mobile srcset/sizes + lazy loading, eager only for hero/LCP. Cache immutable hashed assets with long cache-control; safe fallback for old /images and /uploads paths.
8. Form POSTs/admin mutations are small and scarce: enforce input validation, spam controls and idempotency without introducing paid queues.

## Mandatory observations before enabling public traffic
Record Worker CPU p50/p95/p99, requests/day and estimated images/page; D1 rows read/write and total storage; R2 storage/operations; Images transformations used and free allowance remaining; account's unrelated use. If projected or measured limits exceed Free, reduce dynamic workload or do not release. Never silently change to paid billing or promise unlimited image bandwidth.

Official sources:
https://developers.cloudflare.com/workers/platform/pricing/
https://developers.cloudflare.com/d1/platform/pricing/
https://developers.cloudflare.com/r2/pricing/
https://developers.cloudflare.com/images/pricing/
https://developers.cloudflare.com/workers/static-assets/
