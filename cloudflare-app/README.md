# GoCamp React Router migration

This subproject is isolated from the PHP application. It starts with Cloudflare's official React Router starter template, then adds GoCamp-specific configuration. The deployed staging account currently contains a separate health-only placeholder; this source replaces it only after CI build validation.

## Commands
```bash
cd cloudflare-app
npm ci
npm run cf-typegen
npm run typecheck
npm run build
npx wrangler deploy --dry-run
```

Staging deploy only after CI success: `npm run deploy`. The production Worker is intentionally unrouted. Source-of-truth: PR #40 @ 80432a2a6fcb4b0de6f14710748e53781ddef58c.

Static assets are copied from committed PHP-era folders at build time; no PHP files are copied. The initial home page is deliberately branded as incomplete and noindex. Public/admin parity is tracked in docs/cloudflare-migration/PHASES.md.
