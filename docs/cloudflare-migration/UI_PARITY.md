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
