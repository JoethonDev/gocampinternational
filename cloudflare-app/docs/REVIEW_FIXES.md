# Pre-commit review fixes — 2026-11-06

All eight reported findings are fixed. Existing local data, staging bindings and
legacy URL aliases remain preserved. No schema migration or new dependency was
needed for these fixes.

| Finding | Result |
| --- | --- |
| New forms overwrite existing IDs | Creates are insert-only; duplicate IDs return 409, including races. Missing edited records return 404 rather than being recreated. |
| Concurrent writes partially commit | Revision conflicts fail inside the D1 transaction, rolling back earlier writes and relationship changes. Guards also cover child revisions, newly linked records during renames, bulk updates and trash deletion. |
| Select all misses unrendered rows | Hidden ID fields serialize the complete selection independently of rendered checkboxes. |
| Inquiry pagination rejects numbers | Shared positive-integer page parsing is used by inquiry and media loaders. |
| Media deletion ignores aliases | The DELETE checks ID URLs, current R2 paths, legacy paths and bare legacy filenames against saved content. The usage check is atomic with deletion. Originals and variants are removed for unused media. |
| Long IDs cannot be duplicated | Prefix equality replaces LIKE. Generated copy IDs reserve suffix space and stay within the accepted ID length. |
| Allowed selections exceed D1 limits | Reads are chunked at 100 parameters, including fixed query parameters. Tests cover 100-record bulk actions and 150 linked programs. |
| Main upload form skips byte limits | Both upload entrypoints share one streamed body limit and authenticate before parsing multipart data. |

## Transaction guard

`checkedWrite` adds a SQL assertion immediately after a write that must affect one
row. SQLite's lazy CASE branch invokes `abs(INT64_MIN)` only when the write affects
zero rows. The resulting SQL error aborts the D1 batch, and `runAtomicBatch` returns
a 409 conflict. This avoids checking row counts after the transaction has committed,
and needs no persistent guard table. Real local Cloudflare D1 tests verify rollback
and successful commits; SQLite fixtures exercise the complete CMS functions and
controlled concurrent edits.

## Validation

The isolated Node 22.23.4 workflow runs type generation, formatting, all 35 tests,
full TypeScript compilation, production builds, asset checks and a Wrangler deployment
dry run. No remote data or services are used by the tests. The D1 fixture disables
remote bindings and persistence. The test fixtures use Node's built-in SQLite module;
no extra database driver is shipped to the application.

The lockfile audit reports zero known vulnerabilities. Upstream Vite deprecation
and Node SQLite experimental warnings are informational.

The final browser preview on 2026-11-07 passed desktop and mobile layout checks,
40-record bulk selection with only 15 rendered rows, second-page inquiry loading,
and duplicate-ID rejection without overwriting content. There were no uncaught
browser errors. It used a production build, disposable local D1 data and cached
public media; the external Facebook embed was excluded. No manual deployment or
production-data mutation was performed.
