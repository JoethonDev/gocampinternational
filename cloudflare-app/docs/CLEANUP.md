# React-only cleanup

The PHP application, its gateway Worker, bridge, FTP deployers, PHP tests and PHP
workflows are retired. Historical route aliases remain in React Router to preserve
bookmarks and form endpoints. There is no PHP runtime dependency.

The four public stylesheets moved into `public/css`; inherited trailing whitespace
was removed without changing CSS rules. Unused legacy
JavaScript is no longer copied into the application. Migration records moved into
`docs/archive`; use the current README for development instructions. The initial D1
seed, reviewed overlays and R2 manifest remain available for recovery. Ignored local
uploads, secrets and the existing untracked handoff were preserved.

## Implementation

- Share fixed-window login/inquiry rate limiting and binary/string SHA-256 helpers.
- Enforce actual streamed body sizes on inquiries, login and media uploads; validate
  upload origin and session before reading a potentially large multipart body.
- Share response streaming, HEAD metadata, ETags and conditional 304 responses for
  public media. Historical image URLs respect registered media visibility and use
  the current converted object key when selecting responsive variants.
- Apply no-store/noindex on admin responses and mutations, including errors; add
  framing, base URI and object embedding restrictions without blocking site assets.
- Share reorder buttons across list editors; remove the unreachable pagination
  component and unused single-upload, program lookup and hero-style helpers.
- Replace repeated program-to-destination scans with a first-match lookup map.
- Enable unused declaration checks and normalize source formatting.
- Run React-only tests, formatting, type generation, compilation and deployment dry
  runs in CI. No automatic deployment or remote data writes were added.

## Validation and limits

Completed locally:

- Static TypeScript compilation of the changed shared server modules, Worker and
  list-editor components, using installed dependencies and generated declarations.
- Actual fixed-window SQL against an in-memory SQLite database with dummy data:
  five accepted attempts, excess attempts rejected, boundary expiry resets the
  window and independent scopes remain independent.
- Original/relocated stylesheet byte comparison, route-module existence checks,
  R2 manifest count, source import-graph review and removal of tracked PHP files.
- Formatting and Git whitespace checks.

After updating dependencies on 2026-11-06, the full workflow also passed in an
isolated Node 22.23.4 container: Cloudflare/route type generation, formatting,
all 35 tests, full TypeScript compilation, client/server production builds,
R2-only asset checks and Wrangler deployment dry run. The container had no network
access during execution, read-only source/toolchain mounts, and bounded resources.
The dependency acquisition step used `npm ci --ignore-scripts` separately.

The lockfile now reports zero known npm audit vulnerabilities across production
and development dependencies. See [dependency notes](DEPENDENCIES.md) for versions
and compatibility choices. React Router v7 emits an upstream Vite `envFile`
deprecation warning; it did not fail any check. No local deprecation workaround
or dependency override was added.

Generated types in an existing checkout must still be refreshed with
`npm run cf-typegen` after installing the new dependency versions. The eight application review findings have now been fixed, with regression
coverage for CMS writes, selections, pagination, media deletion and upload limits.
See [review fixes](REVIEW_FIXES.md) for the changes and verification, including the
2026-11-07 desktop/mobile browser preview and admin interaction checks. No manual
deployment, live security probes or performance benchmark was performed.

HTTP behavior follows the Cloudflare [Request API](https://developers.cloudflare.com/workers/runtime-apis/request/)
and [R2 Workers API](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/).
