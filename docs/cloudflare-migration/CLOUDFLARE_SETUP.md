# Personal Cloudflare environment — provisioned 2026-10-31
Authenticated account: Elprincedoca@gmail.com's Account (id da59dca47179969defd66c61b710bbdb), personal Cloudflare identity. Do not change unrelated account resources.

## Provisioned and verified
| Environment | D1 database | D1 ID | R2 Standard bucket |
| --- | --- | --- | --- |
| staging | gocamp-staging-db | 87e579d7-4f7a-4673-a317-d62551858b3c | gocamp-staging-media |
| production | gocamp-production-db | 84f3beb7-ed00-49eb-a25b-913b301ad1da | gocamp-production-media |

Both DBs are EMPTY (no tables/imported data); both buckets EMPTY on creation. Location EEUR, D1 replication disabled. Account Workers subdomain: elprincedoca.workers.dev. Resources were created via connected Cloudflare API. No Hyperdrive, KV, Queue, Cron, paid Images storage or zone changes. No traffic routed to production. These resources are separate from all existing projects.

## Active isolated staging bootstrap
Worker gocamp-migration-staging was created/deployed via Cloudflare API and the deployment is active at 100%, with workers.dev enabled (preview URLs disabled). Verified bindings: DB -> staging D1, MEDIA -> staging R2, IMAGES -> Cloudflare Images Free transformation service, GOCAMP_ENV=staging. Only /health is intended to return HTTP 200; other paths intentionally return 503, no production/domain traffic. Expected URL: https://gocamp-migration-staging.elprincedoca.workers.dev/health (external HTTP not yet confirmed). This bootstrap is not React Router. The repo copy is migration/cloudflare-bootstrap-worker.js and must be superseded by the actual compiled app during Phase 1.

## Intended deployment topology
Single Cloudflare Worker app per environment with asset-first routing: React Router + Vite client assets and public/static HTML; dynamic SSR/API/admin only on Worker. Wrangler bindings DB (D1) and MEDIA (R2) are environment-specific. Keep secrets out of repository and out of browser bundles. The existing Worker gateway under worker/ from PR #40 is NOT the new app; it stays for migration/reference only until port complete.
Staging name: gocamp-migration-staging. Production planned name: gocamp-migration-production (do not enable production traffic before Phase 6).

## Phase-specific operational setup
P0: pin source commit, create branch and validate PR #40 fixtures.
P1: scaffold project and npm lockfile; use wrangler.jsonc with staging DB/MEDIA and Workers static assets; set workers_dev true for staging, preview robots noindex; configure no production deploy workflow; verify worker health; add GitHub Actions build/typecheck/test only.
P2: run D1 schema using wrangler d1 migrations apply DB --remote --env staging only after backup; run source converter via local/GitHub Actions, staging dry-run before import. Include deterministic ID and source-hash checks. Avoid importing PR #40 PostgreSQL SQL directly.
P3: run wrangler dev local with local D1/R2; verify SSR, asset-first route behavior, seo/redirects and cache invalidation on admin edits.
P4: configure an ADMIN_PASSWORD_HASH or one-way auth credential through Worker secret (do NOT copy PHP source credentials), SESSION_SIGNING_SECRET or opaque session secret, CSRF protection and session cleanup; isolate cookie names by environment. Use secure random source, no committed secrets.
P5: configure MEDIA R2 object binding, maximum upload size, immutable keys, Content-Type and Content-Disposition validation; optional Images Free transformation binding with fixed presets, plus existing image fallback. Configure Turnstile on forms if needed; secrets only server-side. Email delivery integration pending provider verification and secrets.
P6: use separate production environment binding and create/deploy prod Worker only once acceptance gates pass; migrate approved final snapshot, verify rollback and custom-domain/DNS requirements. Link Data Center authoritative DNS remains untouched until a separate cutover authorization. No merge now.

## Config example
See wrangler.migration.staging.example.jsonc in this directory; update paths at scaffold stage. Do not deploy old PHP gateway with this config. Production config must use production DB ID and bucket; fail CI when a staging job has production resource IDs.

## Deployment and safety controls
- Never deploy PR #40's worker/ gateway as GoCamp React app.
- CI preview and manual staging deployment only. Constrain GitHub Action permissions. No FTP, no automatic PR promotion to production.
- Set Cloudflare compatibility date; use nodejs_compat only when a selected dependency requires it.
- Do not commit tokens or secrets. Use Wrangler secret/connected API to set them when implementation requires them.
- health endpoint reveals only service/environment/commit, no DB credentials. No route to app until migration routes are implemented.
- Resource creation is not proof of connectivity or app readiness. Keep production DB/bucket empty; do not alter other projects.
