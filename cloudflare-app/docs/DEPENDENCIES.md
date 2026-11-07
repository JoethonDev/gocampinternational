# Dependency maintenance — 2026-11-07

The application uses React Router 8.5.1 with React 19 on Cloudflare Workers. The
framework and installed packages use the v8 APIs; the package manifest and README
are the version source of truth.

| Package                      | Version |
| ---------------------------- | ------- |
| React / React DOM            | 19.3.1  |
| React Router / framework CLI | 8.5.1   |
| Vite                         | 8.3.6   |
| Cloudflare Vite plugin       | 1.67.0  |
| Wrangler                     | 4.158.0 |
| TypeScript                   | 7.0.2   |
| Node declarations            | 22.20.5 |
| Prettier                     | 3.9.10  |
| isbot                        | 5.2.2   |

Direct dependencies are pinned and the lockfile records transitive versions.
TypeScript 7.0.2 is within the `@react-router/dev` 8.5.1 peer range. Node
declarations stay on the Node 22 line used by the local toolchain and CI.
As of 2026-11-07, `npm audit` reports zero known vulnerabilities in the lockfile.

The application uses Bootstrap and ordinary CSS. Unused Tailwind and path-alias
plugins are not installed. The lockfile is checked with `npm audit`, and CI runs
the project test, typecheck, build, and Wrangler dry-run checks.
