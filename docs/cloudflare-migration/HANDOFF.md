# Resume here — GoCamp Cloudflare migration handoff

**Resume date/reference:** 2026-10-31.  
**Repo:** https://github.com/JoethonDev/gocampinternational  
**Working branch:** `migration/cloudflare-react-workers-pr40` — no merges.  
**Last verified app commit:** `0e750c979f77091b32c3945cc3bd6e069cafb927` (a documentation-only successor commit may now be HEAD).  
**Immutable legacy data and UI reference:** [PR #40](https://github.com/JoethonDev/gocampinternational/pull/40), commit `80432a2a6fcb4b0de6f14710748e53781ddef58c`.  
**Current staging:** https://gocamp-migration-staging.elprincedoca.workers.dev/  
**Detailed snapshot:** [PROGRESS.md](./PROGRESS.md). **Acceptance contract:** [PHASES.md](./PHASES.md). **UI/UX comparisons:** [UI_PARITY.md](./UI_PARITY.md).

## State in 30 seconds

The full-stack React Router v7/TypeScript app builds and deploys to the user's **personal Cloudflare** staging Worker. Staging D1 has PR #40 data (63 programs, 9 destinations, 8 categories, 37 links, 28 memories, 11 FAQs, 6 source manifests); production D1 is not initialized with application tables. Staging is isolated from the public PHP site.

**Last evidence:**
- [Visual + interaction check 41213333085](https://github.com/JoethonDev/gocampinternational/actions/runs/41213333085) = **PASS**. 21 screenshot *pairs*: 7 sampled routes × desktop/tablet/mobile. Log confirms it tested exact deployed commit `0e750c979`. Checks include banner geometry, link underlines, hover/touch dropdowns, no overflow, shared memories and page height.
- Cloudflare Build `3b7c6761-15f3-48b1-acd6-27d82b24310a` = **SUCCESS** for the same SHA, with **15/15 staging HTTP smoke tests** passed.
- Source/production: PR #40 open/unmerged; no production cutover, DNS change, paid service or deploy to live domain.

**Do not conflate** seven passing pages with complete site parity. Admin code and R2/media endpoints exist but lack real authenticated E2E acceptance.

## What to do next (recommended start)

**Start with the public functional parity gap**. Inspect `cloudflare-app/app/routes.ts`, PHP's `program/index.php`, `program/category.php`, `destination/index.php` and `.htaccess`. PR #40 has **no standalone individual program-detail routes**: cards and modal CTAs were deliberately disabled. Preserve non-clickable program cards; finish canonical PHP entrypoint/redirect coverage and the missing `/landing` marketing form, then test all destination/category slugs, status/visibility and interactions.

Then complete **admin parity** against `admin/*.php`: real React editors (not only JSON text areas), scoped bulk operations, visibility, archive/restore, media, FAQ, memories and inquiries. Add protected authenticated test fixtures and verify permissions, CSRF, revision conflicts and D1 persistence.

Next verify media/R2 lifecycle, forms, email delivery, full SEO and all source images. Finish with performance/Cloudflare Free budget, backup/restore, security checks and release gates. Update [PROGRESS.md](./PROGRESS.md) with evidence at every milestone.

## Strict constraints

- Keep **same UI/UX AND JS interactions as original PR #40** — no redesign, no missing content, hover behavior or new underlines. Workflows must mirror old PHP behavior.
- Use Cloudflare personal **Free**: Workers, D1, R2, optional fixed-preset Images transformations; keep CPU low via build-time image processing and static assets. No paid upgrades, Cron, FTP, cPanel or unnecessary architecture.
- Use the **existing** migration branch, **do not merge** to `develop`/`main`; don't change production DNS, production Worker routes, production data or other personal Workers.
- PR #40 legacy PHP data/assets = **source of truth**; keep snapshots immutable. Its Aiven/Tigris Worker gateway is not the target runtime.
- Confirm branch HEAD and latest Cloudflare build **before** modifications: concurrent commits may appear. Preserve them; make optimistic/expected-SHA ref updates.
- Keep credentials out of GitHub. Staging admin secret is already present in Cloudflare; never log or reproduce secret values. Existing admin UI is **not** proof of security acceptance.

## Work/test commands and links

```bash
git fetch origin migration/cloudflare-react-workers-pr40
git switch migration/cloudflare-react-workers-pr40
cd cloudflare-app
npm ci
npm run typecheck
npm run build
npm run check
# Run after the staging deployment:
npm run smoke:staging
```

GitHub browser workflow: [cloudflare-migration-visual-parity.yml](https://github.com/JoethonDev/gocampinternational/actions/workflows/cloudflare-migration-visual-parity.yml). It compares live staging vs the original PHP site, **waiting for the exact deployed Git commit** via `/migration-commit.txt`. Cloudflare Builds deploys **staging only** from this branch. Snapshot counts and staging/prod binding names are in [PROGRESS.md](./PROGRESS.md).

## Suggested prompt for a new conversation

> Continue the GoCamp International PHP→React/Cloudflare Workers migration from GitHub branch `migration/cloudflare-react-workers-pr40`. Read `docs/cloudflare-migration/HANDOFF.md`, `PROGRESS.md`, `PHASES.md` and `UI_PARITY.md` first, then verify current GitHub HEAD/CI and Cloudflare staging. PR #40 (`80432a2...`) is the immutable source of truth for content and original UI/JS. Work on the existing branch, don't merge or touch production/DNS, keep Cloudflare personal Free. Prioritize complete public routes/program detail parity, then admin/media/forms, then security/performance/release gates. Run the parity and smoke checks, record exact evidence and update progress after each stage. Avoid a redesign or overengineering.

## Important correction from source audit (2026-10-31)

Do **not** implement invented `/program/:slug` detail pages. The original `index.php` only routes categories and destinations, and `sections/program_card_modern.php` leaves program detail modal triggers commented out. The next public gap is the **marketing landing page and its exact lead form/email behavior**, not a program details route. A small follow-up branch commit adds legacy PHP-style URL aliases and extends staging smoke tests; see PROGRESS.md §8. Once GitHub Actions/Cloudflare Builds report this commit, update the verified checkpoint above and record actual results.

## Landing page follow-up (2026-10-31)

The branch now has initial React landing-page markup/CSS, correct form fields and D1 lead persistence, including explicit server-side age/gender/consent/interests validation. `/landing.php` redirects to `/landing`. It is **not yet accepted**: run browser/POST and admin inbox tests on staging, check visual parity, and add an email provider with accurate failure handling or obtain a documented decision that inbox-only delivery is sufficient. Never claim mail was delivered when only D1 has an inquiry. Read PROGRESS.md §9.
