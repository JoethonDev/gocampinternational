# Phased execution plan with setup and acceptance gates
Source baseline: PR #40 @ 80432a2a6fcb4b0de6f14710748e53781ddef58c. Do not merge PRs or change live DNS. Run phases in order, recording status in PROGRESS.md. All commands use current stable compatible package versions, locked by npm lockfile.

## Phase 0 — source freeze, inventory and visual acceptance baseline
Setup: branch from exact PR #40 head; inventory all PHP routes, JS/CSS, forms, redirects, admin menu actions, status/visibility rules, image references, security controls and source assets. Record commit SHA. Capture representative screenshots on desktop (1440px), tablet (768px), mobile (390px). Read the ZIP reconciliation in docs/AIVEN_TIGRIS_MIGRATION.md and confirm PR #40 legacy files are the only authoritative migration input. Do not reconcile PR #39 silently.
Deliverables: URL/action matrix; screenshot set; content counts, image manifest/checksums; known anomalies and exceptions; mapping of each PHP feature to a React route/service.
Acceptance:
- [ ] Every active public/admin URL is mapped, including /programs hidden-list behavior and existing inner routes.
- [ ] All six catalog kinds have documented import mapping and source hashes.
- [ ] Baseline of 63 programs, 9 destinations, 8 categories and 28 memories is verified from PR #40 snapshot; FAQ, settings and all assets additionally enumerated.
- [ ] Existing broken category associations (italy-tennis, italy-sailing) are logged, not silently dropped.
- [ ] Visual reference screenshots are captured for all major page templates at 3 viewports.

## Phase 1 — Cloudflare Free foundation / TS app scaffold
Setup: create isolated staging/prod D1 and R2 resources in personal Cloudflare account; create ONLY an isolated staging Worker for initial health; enable workers.dev for staging, no production routes. Scaffold React Router + React + Vite on the migration branch (keep old PHP source for comparison). Configure Cloudflare Vite plugin, TypeScript strict, ESLint, env types, wrangler D1/R2 bindings, client/server separation, lockfile; use GitHub Actions build/test with no merge and no production deploy. No paid services or new infrastructure.
Deliverables: Worker app, React shell, health and not-ready responses, D1/R2 bindings, local wrangler dev, CI typecheck/build/smoke and free-account budget baseline.
Acceptance:
- [ ] Local typecheck/lint/build succeed with locked dependencies.
- [ ] Staging health endpoint returns environment and version with no secrets; other routes remain nonfunctional until implemented.
- [ ] Staging Worker binds ONLY staging D1/R2; production resources not reachable from staging binding.
- [ ] No Worker invokes for standalone static assets; no existing Workers changed.
- [ ] CI runs on migration branch, creates no FTP and performs no database import.

## Phase 2 — typed schema, import and data access
Setup: translate PR #40 database/001_catalog.sql PostgreSQL relational model to D1 SQLite (TEXT JSON instead of JSONB, INTEGER booleans/timestamps; SQLite FK and uniqueness). Preserve catalog revision/optimistic writes, destination-program links, repeated items, section visibility, media metadata, FAQs, memories and site settings. Implement Drizzle SQL migrations and Zod schemas. Implement a local-only PHP CLI/Node import converter for the PR #40 source arrays; no PHP running in Worker. Import in batches using D1 binding/CLI with staged dry-run, checkpoint and checksums, and idempotency.
Deliverables: schema + migrations, seed/export manifest, typed repository layer, import result report, verification queries and rollback/reimport instructions.
Acceptance:
- [ ] Imported counts match source (63/9/8/28 and FAQ/settings) with exact slugs, statuses, text, relations, order and visibility.
- [ ] All image references resolve to manifest entries or are reported explicitly; orphan references kept as anomalies.
- [ ] Re-running import is safe; no duplicate records, unknown property loss or overwriting newer revisions.
- [ ] CRUD transactions and concurrent-edit conflict detection are tested; FK/index checks pass.
- [ ] No database query runs for static asset requests; public list fetches are bounded/indexed.

## Phase 3 — public website parity and SEO
Setup: port current PHP templates into React route components, retaining layout, CSS, markup semantics, responsive behavior and JavaScript interactions. Prefer static asset delivery, static/pre-rendered stable pages where compatible, and cacheable SSR for dynamic content. Preserve routes/redirects and real-time admin visibility behavior via explicit cache invalidation/short TTL where required. Provide SEO title/meta, canonical URLs, sitemap, robots and semantic markup. Use images with intrinsic dimensions, responsive srcsets and lazy loading.
Deliverables: home, destination list/detail, categories, nested program details, About, FAQ, Contact, gallery/memories, 404/redirects; no involuntary redesign.
Acceptance:
- [ ] All public routes return expected HTTP status and canonical content without relying on JS for indexed text.
- [ ] Program list top-level remains hidden according to current behavior; inner program pages work.
- [ ] Hidden/disabled programs, destination visibility, modal disabled policy and gallery visibility match original rules.
- [ ] Exact migrated copy, section order, media, CTA and links match PR #40 at three viewports.
- [ ] Core Web Vitals/bundle sizes and Worker CPU measured; static hits never invoke Worker; no hydration errors.

## Phase 4 — complete React admin parity
Setup: create admin login/session persistence (secure signed random opaque session IDs stored hashed in D1), HttpOnly/Secure/SameSite cookies, origin/CSRF protection, rate limits, role guard, Zod validation. Port existing admin dashboard and AJAX workflows to React Router loaders/actions and typed services. Preserve current UI styling first, including editors, image removal, batch select, global/per-item visibility, inbox, FAQ/memories, trash, archive and rename semantics.
Deliverables: secured admin UI and typed CRUD, audit traces for critical edits, regression suite; no dependence on PHP sessions/filesystem.
Acceptance:
- [ ] All existing admin tasks have corresponding test cases and pass through browser UI.
- [ ] Login/logout/expiry, CSRF rejection, unauthorized access and rate limit tests pass.
- [ ] All mutations validate, persist in D1 and survive Worker restart; revision conflicts do not overwrite edits.
- [ ] Bulk actions and visibility inherit/override rules match original, including nested category/destination operations.
- [ ] Navigation has no disruptive full-page flashing; forms preserve state and accessible errors.

## Phase 5 — media, inquiries and free image pipeline
Setup: import PR #40 images and referenced uploads, use immutable media IDs and safe legacy URL mappings. Commit optimized WebP/AVIF static variants at build time via Sharp (local/GitHub Actions CPU, not Worker); R2 for CMS-uploaded originals, stream uploads where practical, enforce MIME/magic bytes/file bounds, signed access and per-image metadata. Optional Cloudflare Images Free transformations via limited predeclared preset widths on demand with original fallback. Port contact/lead/newsletter APIs and D1 inquiry listings/status with honeypot, Turnstile where suitable and bounded rate limiting. Email delivery via existing authorized email provider or clearly flagged pending; never fake success.
Deliverables: media importer, immutable reference mapping, galleries, upload/remove/rename, inquiries, validation and caching policies.
Acceptance:
- [ ] Every referenced public image loads or is recorded as an explicit missing-asset exception, no broken image on standard routes.
- [ ] CMS upload, image replacement, name change, removal and gallery order work across environments without mutating source files.
- [ ] Upload failures roll back metadata, filename collisions cannot overwrite, public/private access is verified.
- [ ] Forms persist exactly once and admins can view/update statuses, with spam controls and email behavior verified.
- [ ] No per-request image encoding CPU in Workers; transformation presets consume bounded unique transformations, monthly tally remains under account free allowance.

## Phase 6 — staging validation, budget, rollback, production readiness
Setup: deploy migration Worker only to staging workers.dev; run PHP-vs-React visual and route comparisons, Playwright E2E, D1 import/checksum diff, media QA, perf/CPU/load checks, security/auth and restore drill. Sample quotas under shared account usage. Preserve PR #40 branch and the old site. Configure isolated production bindings and production Worker only after gating; import a checked final snapshot but do not change DNS or merge unless a separate release instruction explicitly authorizes it.
Deliverables: parity report, performance/quota report, rollback runbook, manual promotion checklist, production release readiness statement.
Acceptance:
- [ ] All phase checklists pass and no unreviewed data loss/visibility changes remain.
- [ ] No planned Worker request, CPU, D1, R2 or Images Free limit is exceeded at expected volume, including existing account usage.
- [ ] Staging data restore tested and old PHP site remains operable as fallback.
- [ ] Secrets/authorization checks and SSR/SEO validation pass; all preview routes are noindex as appropriate.
- [ ] No merge, production DNS edit, paid plan activation or live cutover occurs from this plan alone.

### Non-negotiable quality gate
If a phase's tests fail, repair within that phase rather than deferring correctness. Never mark complete based only on code review; record executed commands, URLs and observed results in PROGRESS.md.
