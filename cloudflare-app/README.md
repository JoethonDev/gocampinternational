# GoCamp International

React Router 7 and React 19 on Cloudflare Workers. D1 stores catalog, CMS, sessions
and inquiries; R2 stores media. No PHP runtime, parent-directory assets, or external
database gateway is required.

## Development

Use Node.js 22.23.4 (the current Node 22 LTS patch). From this directory:

```sh
npm ci
npm run cf-typegen
npm run dev
```

Use `.dev.vars` for local secrets; never commit it. `ADMIN_USERNAME` and
`ADMIN_PASSWORD_SHA256` configure the existing admin login. Provision local D1 data
before browsing content. Apply migrations only to the intended local database:

```sh
npx wrangler d1 migrations apply gocamp-staging-db --local
```

The reviewed initial seed and overlays in `migration/` remain available for recovery.
They are historical snapshots, not a backup of current CMS edits. Review them before
any import. Production data, credentials and resource changes require separate setup.

## Checks

```sh
npm run cf-typegen
npm run format:check
npm run check
```

`check` runs tests, type generation/checking, the build, and a deployment dry run.
CI runs these on pushes and pull requests without deploying. `smoke:staging` is an
explicit live HTTP check, separate from local validation. `deploy` publishes to the
Worker selected in `wrangler.json`, currently staging.

## Structure

- `app/routes`: route loaders/actions, HTTP contracts and page composition.
- `app/features`: page and CMS feature implementations.
- `app/components`: shared UI; `ui` and `admin` contain reusable primitives.
- `app/hooks`: shared client behavior and drag ordering.
- `app/lib`: domain types and shared functions; `.server` modules own D1/R2/auth.
- `workers/app.ts`: request dispatch, response policy and error handling.
- `public/css`: committed site styles, independent of the removed PHP application.
- `server/db/migrations`: ordered D1 schema changes.
- `tests`: catalog concurrency, form/URL contracts, local D1 and HTTP regressions.
- `docs/archive`: historical migration decisions; paths and commands may be retired.

Keep business logic in the data layer, reuse existing components before adding new
ones, and prefer small functions over new inheritance or service frameworks.
Admin mutations require origin, session and CSRF validation. Keep SQL values bound,
render CMS HTML through `SafeRichText`, and enforce byte limits before parsing uploads.
Image variants are materialized in R2; public requests do not run image transformations.

See [cleanup notes](docs/CLEANUP.md) for this refactor's scope and validation limits.

Dependency versions and security checks: [dependency maintenance](docs/DEPENDENCIES.md).

Public page copy, shared images, links, SEO previews and section visibility are edited
in D1. See [public content editing](docs/PUBLIC_CONTENT.md) for the admin workflow.
