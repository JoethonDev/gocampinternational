# UI/UX parity — verified reference and remaining gates

**Source of truth:** PHP/CSS/JavaScript at [PR #40](https://github.com/JoethonDev/gocampinternational/pull/40), commit `80432a2...`. Do not redesign.  
**Last verified application checkpoint:** `0e750c979f77091b32c3945cc3bd6e069cafb927`.  
**Latest PASS:** [GitHub browser run 41213333085](https://github.com/JoethonDev/gocampinternational/actions/runs/41213333085) (completed 2026-10-31 15:10 UTC). The log confirms exact staging revision and `Visual parity checks passed. Screenshot pairs: 21`.

## What passed

**Seven page samples** at three viewports (1440×900 desktop, 820×1180 tablet, 390×844 mobile):

| Page | Tested |
| --- | --- |
| Home | Yes |
| Italy destination | Yes |
| Adult Academic category | Yes |
| Kids Camps category | Yes |
| About | Yes |
| FAQ | Yes |
| Contact | Yes |

Playwright/Chromium captures paired screenshots, checks navbar styles (no underlines), hover opening Programs/Destinations on desktop, mobile dropdown tap, banner background/overlay, hero and navbar dimensions, full-page height tolerance, absence of horizontal overflow, shared memories and card count. It waits until live `/migration-commit.txt` matches `GITHUB_SHA`, preventing false results from out-of-sync deployments. See `tests/migration-visual-parity.cjs` and `.github/workflows/cloudflare-migration-visual-parity.yml`. Screenshot artifact is stored in the Actions run with limited retention.

## Specific regressions fixed

- Replaced `button.btn-link` navbar toggles with original PHP-style links, removing accidental underlines.
- Ported desktop hover and mobile menu dropdown/collapse, active nav, scroll shadows, back-to-top and image lightbox interactions using React effects with cleanup.
- Restored original category banner side-aligned typography, responsive hero height, parallax/gradient contrast, image sizing, homepage text shadow and card dimensions.
- Restored footer contact/social links, LinkedIn and exact mobile list spacing.
- Ported shared **Go Campers Memories** slider, arrows and optional Facebook panel to home, category and destination templates.
- Preserved rich FAQ body markup safely via restricted React element parsing, instead of printing HTML tags as literal text.
- Aligned About/FAQ/Contact page wrappers and About paragraph/image CSS with original PHP.
- Added static staging commit marker to synchronize browser checks with the deployed Worker.

## Still NOT accepted

Passing snapshots and geometry checks are not proof of pixel-by-pixel identity or **all** UI/JS functionality. Still needed: every destination/program/category, exact program detail route behavior, desktop/tablet/mobile and keyboard accessibility for remaining pages, carousel timing, interactions/forms/modals, visibility inheritance, admin UX, Safari/Firefox/device checks. Visually inspect screenshot artifacts and fix actual drift at source CSS/component level rather than arbitrary offsets. Avoid declaring all public pages finished until every route in PHASES.md is exercised.

See [PROGRESS.md](./PROGRESS.md) for the wider functional, data and deployment status.

## Program card and legacy URL contract correction (2026-10-31)

PR #40 does not serve standalone program-detail routes. `sections/program_card_modern.php` explicitly disables click/CTA triggers; the React `ProgramCard` is non-clickable for this reason. The migration must not introduce new program links or reopen the modal. The alias compatibility change and expanded HTTP smoke tests are separate from the seven-route screenshot pass; verify CI/staging before checking them off. The source `landing.php` marketing page and its POST + mail semantics remain pending, not silently redirected.

## Landing page in the browser acceptance matrix (pending CI result)

The browser comparator now captures **8** public templates at desktop/tablet/mobile, 24 screenshot pairs total, including `/landing`. On landing it checks original field names/4 interest checkboxes, consent, hero/form geometry, original nav styling and horizontal overflow. This is tighter than an HTTP smoke check, but **not pixel-identical color/typography validation**. The PHP source explicitly cancels `body` padding on the landing page; the React scoped stylesheet now reproduces that exception. This row remains pending until the GitHub browser workflow for the new commit completes.

### Responsive drift regression and targeted repair

[Browser run 41218919612](https://github.com/JoethonDev/gocampinternational/actions/runs/41218919612) for application commit `396ad6a` **FAILED five new landing geometry assertions**: desktop hero height 1299px PHP vs 1255px React; tablet hero 1756 vs 1832 and form width 752 vs 716; mobile hero 1985 vs 2354 and form width 326 vs 310 (desktop/tablet/mobile viewport sizes from the established suite). Existing seven pages passed. This was a real discrepancy, not a bad test.

Source investigation identified conflicting CSS specificity: PR #40 `landing.php` defines generic `.hero-headline` and `.lead-form-card` styles; the shared `css/design-system.css` intentionally overrides them using `.page-content .hero-headline`, responsive card padding, container typography and mobile spacing. The new React stylesheet mistakenly used equally/highly specific `.landing-page .hero-headline` selectors and introduced a mobile-only override, defeating those original design-system rules. The follow-up changes these to `:where(.landing-page) .hero-headline` (scoped, *low specificity*) and removes the invented mobile override, restoring PHP's cascade without relaxing assertions. Require a fresh visual workflow pass before considering this fixed.

## Landing CSS regression resolved (2026-10-31)

[Visual run 41219367418](https://github.com/JoethonDev/gocampinternational/actions/runs/41219367418) **SUCCESS**, exact deployed app `1de60f6`: **24/24** screenshot pairs (8 templates × 3 viewports). The source-specific `:where(.landing-page)` fix restores responsive CSS cascade that caused the five earlier measured mismatches. These sampled UI checks do not prove real form POST or all dynamic/administrative pages.
