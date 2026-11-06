# Dependency maintenance — 2026-11-06

Versions were checked against the npm registry and framework peer requirements.
React Router remains on its maintained v7 line (7.18.5), including fixes for the
published manifest-endpoint denial-of-service advisories. Moving to v8 changes
loader/action context and SSR APIs; it requires a separate migration and validation.
TypeScript 6.0.3 is the newest compiler line supported by this React Router release.

| Package | Version |
| --- | --- |
| React / React DOM | 19.3.1 |
| React Router / framework CLI | 7.18.5 |
| Vite | 8.3.6 |
| Cloudflare Vite plugin | 1.67.0 |
| Wrangler | 4.158.0 |
| TypeScript | 6.0.3 |
| Prettier | 3.9.10 |
| isbot | 5.2.2 |

The local toolchain and CI use Node 22; 22.23.4 is the current patched release of
that LTS line. Node declarations track Node 22 rather than a newer runtime's API.
Direct dependencies are pinned and the lockfile records transitive versions.

Unused Tailwind and path-alias plugins were removed. The app has no Tailwind
stylesheet or alias imports; public styling uses Bootstrap and ordinary CSS.
The obsolete Vite Environment API flag was replaced with its supported v7 name,
and unused TypeScript base URL/path configuration was removed.

The regenerated lockfile reports zero known npm audit vulnerabilities, including
development dependencies. This describes the advisory database at review time;
it does not guarantee the absence of undisclosed defects. The application findings are tracked in [review fixes](REVIEW_FIXES.md).

References: [React Router upgrade guide](https://reactrouter.com/upgrading/v7),
[manifest endpoint advisory](https://github.com/remix-run/react-router/security/advisories/GHSA-chx6-hx7r-mcp5),
[Vite migration guide](https://vite.dev/guide/migration).

Validation passed in an isolated Node 22.23.4 Linux container: type generation,
formatting, all 35 tests, full typechecking, production client/server builds,
static-asset checks and Wrangler deployment dry run. No remote resources were
accessed during validation. An upstream React Router v7/Vite `envFile`
deprecation warning remains; it does not fail the checks.
