# GoCamp React Router migration
Isolated React Router v7 + Cloudflare Vite plugin app. Authoritative source: PR #40 commit 80432a2a6fcb4b0de6f14710748e53781ddef58c.

## Local build
```bash
cd cloudflare-app
npm ci
npm run cf-typegen
npm run typecheck
npm run build
npx wrangler deploy --dry-run
```

## Staging data setup
```bash
php scripts/export-pr40.php --check
php scripts/export-pr40.php --output build/imports/legacy-pr40.json
node scripts/make-d1-seed.mjs build/imports/legacy-pr40.json build/imports/seed-pr40.sql
npx wrangler d1 migrations apply gocamp-staging-db --remote
# REVIEW generated SQL and staging state before optional remote import
npx wrangler d1 execute gocamp-staging-db --remote --file build/imports/seed-pr40.sql
```
No production import or deployment is automated. Browser preview is intentionally incomplete and noindex. Legacy public assets are copied from repository at build time; no PHP is packaged.

D1 uses **indexed typed summary columns plus lossless JSON content per entity**, not a row for every highlight. This simplification preserves every PR40 dynamic field with lower migration risk and fewer queries. PR40 PostgreSQL schema is a reference, not a D1 migration.

## Deployment verification
Cloudflare Builds uses the migration branch as the **production branch of the staging Worker only**. Its deploy command runs `npx wrangler deploy && npm run smoke:staging`, without staging credentials or changes to production. This verifies public HTTP routes after deployment and should not be confused with full UI or admin end-to-end validation.
