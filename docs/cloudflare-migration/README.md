# GoCamp International — PHP to React/Cloudflare migration

**Migration branch:** `migration/cloudflare-react-workers-pr40`  
**Current state (2026-10-31):** full-stack React Router v7 application is **deployed on staging**, with PR #40 core catalog imported into D1; **not production ready**.  
**Source of truth:** [PR #40](https://github.com/JoethonDev/gocampinternational/pull/40) head `80432a2...` (still open and unmerged at last review).

**Start here to resume in another conversation: [HANDOFF.md](./HANDOFF.md).**  
**Detailed authoritative status:** [PROGRESS.md](./PROGRESS.md).  
**Original visual parity and automated browser evidence:** [UI_PARITY.md](./UI_PARITY.md).  
**Phases and release criteria:** [PHASES.md](./PHASES.md).

Staging: https://gocamp-migration-staging.elprincedoca.workers.dev/  
Last verified app SHA: `0e750c979f77091b32c3945cc3bd6e069cafb927`. [21-pair visual regression pass](https://github.com/JoethonDev/gocampinternational/actions/runs/41213333085); 15 live staging smoke checks passed. Production remains isolated and unrouted.

## Architecture decisions — do not reopen without new requirements

- **Frontend/backend:** React Router v7, React 19, TypeScript, Vite on one Cloudflare Worker; public SSR + Static Assets and limited dynamic requests.
- **Data:** Cloudflare D1 SQLite (typed SQL and tracked migrations), with indexed core catalog and lossless `content_json` for legacy fields. PR #40 legacy arrays/FAQ/settings and images are immutable import inputs.
- **Media:** Cloudflare R2 for new CMS media, original committed assets/static first; optional budgeted Images Free transformations for predictable variants, build-time optimization when possible.
- **Auth:** Worker secret(s) + D1 sessions; privileged endpoints must enforce auth and CSRF. All authenticated actions still need E2E/security verification.
- **Free-tier:** no incremental paid services; quotas shared account-wide, so confirm Workers CPU/requests, D1 rows, R2 usage and Images unique transformations before production readiness.
- **No extra infrastructure:** No Aiven/Tigris runtime, paid Images storage, Cron, FTP, unnecessary KV/Queues/microservices.
- **Parity requirement:** Match original PHP markup, content, CSS, spacing, images, responsive behavior and JS interactions. No redesign or dropping legacy features.
- **Safety:** Keep staging/prod D1+R2 isolated; PR #40 and `main`/`develop` unmerged; do not touch live DNS, cPanel or PHP production until a separate explicit release go/no-go.

Other documentation:
- [PARITY_AND_DATA.md](./PARITY_AND_DATA.md) — catalog contract / anomalies / behavior.
- [CLOUDFLARE_SETUP.md](./CLOUDFLARE_SETUP.md) — environment names and bindings.
- [FREE_TIER_AND_IMAGES.md](./FREE_TIER_AND_IMAGES.md) — CPU/media budget.
