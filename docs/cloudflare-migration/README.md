# GoCamp — Cloudflare full-stack migration
Date: 2026-10-31 | Status: foundation prepared, migration application NOT implemented.

## Binding decisions
- **Immutable migration baseline:** PR #40 head 80432a2a6fcb4b0de6f14710748e53781ddef58c; source: https://github.com/JoethonDev/gocampinternational/pull/40. Branch: migration/cloudflare-react-workers-pr40.
- **Content source of truth:** PR #40 data/legacy/*.php, data/faq.json, its committed images/ and uploads/, plus the PR's documented ZIP reconciliation. Use these exact bytes, not main/develop/production drift or unrelated PR #39. PR #40 is NOT merged.
- **Functional source of truth:** PHP pages, admin behaviors, CSS/JS, visibility semantics, media workflows and API contracts at the same commit.
- **Target:** TypeScript + React Router (current supported stable major, choose and lock during Phase 1) + React + Vite + Cloudflare Worker (single app with static assets, SSR only where required); D1 SQLite + R2 Standard via direct bindings; Drizzle for typed queries and migrations; Zod validation.
- **Why D1/R2 rather than PR #40 Aiven/Tigris runtime:** this is a complete PHP replacement hosted in the owner's personal Cloudflare account, constrained to Cloudflare Free. PR #40's PostgreSQL schema is a *data modeling reference*, not executable SQLite SQL. Its Worker PHP gateway and its Hyperdrive/Tigris adapters are legacy migration references, not deployment targets. Do not import into Aiven or Tigris or create Hyperdrive for this branch.
- **Scope:** identical public and admin UI/UX, data, routing, eligibility/status/visibility, image gallery, media, inquiries and newsletter, without a redesign. Never silently discard unknown catalog properties.
- **Out of scope:** new business features, framework experiments, microservices, queues, KV, Durable Objects, paid Cloudflare Images storage, cron, FTP, cPanel changes, production DNS cutover, PR merges.
- **Environments:** staging and production use separate database and bucket. Staging Worker may use workers.dev; production Worker placeholder remains unrouted/disabled; production app/custom domain only after release gate. Existing other Cloudflare resources are immutable for this project.
- **Time-critical rule:** no automatic import on deploy. Every import is idempotent, checksum-tracked, staging-first; production promotions require complete backups and a final data snapshot review.
- **Free-tier goal:** $0 *incremental* spend is a design requirement, not guaranteed if account-wide shared quotas, Cloudflare billing, or existing usage exceed included allowances. No paid-plan upgrades or paid add-ons are authorized.

## Documentation index
- PHASES.md — every phase's setup, deliverables and binary acceptance criteria.
- PARITY_AND_DATA.md — source record inventory, data mapping and UI/functional parity.
- CLOUDFLARE_SETUP.md — personal account resources, bindings, deployment and security gates.
- FREE_TIER_AND_IMAGES.md — quotas, CPU reduction, media transformation controls and budget gates.
- PROGRESS.md — exact current state, evidence and remaining work.

## Definition of done
No PHP request-path code in the new Worker app; same public/admin behavior and routing; full source-preserving data migration; end-to-end uploads and inquiries; SSR/public metadata; automated regression checks; staging evidence; free-plan budget verification; explicit go/no-go before any DNS or production switch.
