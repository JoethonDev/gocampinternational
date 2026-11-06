# Cloudflare migration — PR #40 route and workflow parity matrix
> Updated 2026-10-31. Branch `migration/cloudflare-react-workers-pr40`. Source of truth: PHP PR #40 at `80432a2a6fcb4b0de6f14710748e53781ddef58c`. This is an acceptance matrix, not a claim that every line is implemented or tested.
>
> Status legend: **HTTP-verified** means only a read-only staging response was checked; **visual-sampled** means one representative URL/viewport was compared to the original PHP; **implemented/unverified** means code exists but behavior/E2E not accepted; **missing** needs implementation. Do not treat any row as production-ready.

## Public GET routes

| PR40 PHP source/URL | Cloudflare React target | State | Acceptance |
| --- | --- | --- | --- |
| `/`, `/index`, `/home`, `/index.php`, `/home.php` | `/` (alias 301s) | HTTP-verified; home visual-sampled | Correct hero images, nav hover/tap, CTAs and footer |
| `/about`, `/about_us.php`, `/about_us` | `/about` (aliases 301) | HTTP-verified; visual-sampled | Exact text, line breaks, banner/spacing |
| `/contact`, `/contact_us.php`, `/contact_us` | `/contact` (aliases 301) | HTTP-verified; visual-sampled | Visible cards/links plus form POST contract |
| `/faq`, `/faq.php` | `/faq` (alias 301) | HTTP-verified; visual-sampled | Accordion toggling and all questions |
| `/destinations/:slug` | same | Sample Italy HTTP-verified/visual-sampled | **Every** non-trashed destination; coming-soon/hidden; related programs, overrides, FAQ |
| `/destination/:slug` | 301 `/destinations/:slug` | Implemented/unverified | Alias preserves slug; invalid/trash stays 404 |
| `/program/category?category=:slug` | same | Adult academic & kids camps HTTP/visual-sampled | **Every** active category; program status and visibility inheritance |
| `/program/category.php?category=:slug` | 301 to canonical | Implemented/unverified | Query-string preservation; unknown 404 |
| `/programs/:slug` | 301 to category query | Implemented/unverified | Correct category slug/301 target |
| `/programs`, `/program/index[.php]` | 404 (hidden by PR40) | HTTP-verified | Never exposes hidden all-program listing |
| `/gallery[.php]`, `/memories` | 404 (hidden by PR40) | HTTP-verified for gallery and gallery.php; memories needs independent status check | Never exposes hidden gallery and memories |
| `/landing`, `/landing.php` | `/landing` (alias 301) | HTTP-verified, browser visual comparison pending | Hero and form parity, mandatory consent/age/gender/interest validation and persistence |
| Unknown/invalid paths | 404 | One URL HTTP-verified | Correct error page, no leak/redirect to Home |
| Program-detail paths | **None in source** | Intentionally absent | Program cards remain non-clickable and detail modal triggers disabled |

## Public state-changing interactions and media

| PHP operation | React/Workers equivalent | Remaining gate |
| --- | --- | --- |
| `/api/submit-contact.php` | D1 `contact` inquiry handler | CSRF/origin, invalid/valid POST, rate-limit, admin view and notification delivery |
| `/api/submit-lead.php` | D1 `lead` inquiry handler | Modal E2E, honeypot, idempotency and notification policy |
| `/api/subscribe-newsletter.php` | D1 `newsletter` inquiry handler | POST validation, duplicate/consent/retention policy |
| PHP `/landing` POST and mail | React route POST to D1 `lead` with route-enforced consent | **Email not sent**; decide provider/failure handling and verify with isolated form fixture |
| Static `/images`, `/uploads` and media catalog | Committed assets + R2/D1 media endpoints | Full source inventory/byte/URL parity, ACLs, upload/delete/transform lifecycle |
| JS interactions (nav hover/tap, slider, accordions, modal, CTAs) | React + Bootstrap | Full keyboard/touch and all-page interaction matrix, beyond sampled home |

## Admin workflow compatibility (PR40 source `admin/index.php`)

These are **not** declared accepted by presence of the new dashboard. Preserve auth and CSRF before adding legacy alias or write endpoints; legacy POST actions must not be redirected to GET screens.

| Legacy PHP admin URL | React admin location / status | Outstanding |
| --- | --- | --- |
| `/admin`, `/admin/dashboard[.php]` | `/admin` React dashboard; legacy dashboard URL alias missing | Authenticated login/session/CSRF, dashboard visual/navigation |
| `/admin/programs[.php]` | `/admin/catalog/program`; legacy URL alias missing | Bulk statuses, create/edit program, category/destination filtering |
| Destination and category lists | `/admin/catalog/destination`, `/admin/catalog/category` | Source UX and global status/visibility rules |
| `/admin/edit-destination[.php]`, `/admin/edit-program[.php]`, `/admin/edit-program-category[.php]` | `/admin/catalog/:kind/:slug` (native React routes) | Legacy query-to-slug mapping, fields, uploads, revisions and optimistic concurrency |
| `/admin/site-visibility[.php]` | `/admin/documents/site_settings` JSON editor | **Visual section controls missing**; global overrides and save semantics |
| `/admin/memories[.php]`, `/admin/edit-faq[.php]` | `/admin/documents/camp_memories` & `/admin/documents/faq` JSON editors | Repeater/photo editor, exact existing operations, legacy URLs |
| `/admin/media-library[.php]`, `/admin/ajax/list-media.php`, `/admin/ajax/upload-media.php` | `/admin/media`, R2 API | Legacy URLs, authenticated upload/list/rename/delete behavior, media selection workflow |
| `/admin/trash[.php]`, `/admin/item-action[.php]`, `/admin/bulk-action[.php]` | Status editing within `/admin/catalog/:kind` (partial) | Restore/trash flows and postback parity; never redirect POST |
| `/admin/inquiries[.php]`, `/admin/view-inquiry[.php]` | `/admin/inquiries` | Detail/open/status workflow, source URL aliases, email delivery |
| `/admin/logout[.php]` | `/admin/logout` | POST-only CSRF protected logout, browser session expiration |

## Acceptance gates, in order

1. Check every destination/category slug against PR #40 using actual D1 records; no missing relationships, content loss, status or section-visibility regressions.
2. Keep screenshot comparisons for **eight** public templates at three viewport sizes. Existing dynamic slugs beyond the samples still need functional/status coverage.
3. Verify form persistence with isolated D1 fixture and correct notifications without sending a fake success; no real customer submissions during test.
4. Implement and test every admin workflow under an authenticated isolated account, including global visibility, bulk operation, R2 media, restore/trash and document editors. Compare existing PHP URLs and decide 301/302/404 compatibility per *HTTP method*.
5. Establish complete media inventory, backup/restore drills, bot/SEO controls, CSP, operational alerting, security and CPU/egress/billing budgets.
6. Release gate: exact commit/branch+build SHA, CI/browser pass, staging smoke, rollback and traffic plan; PR40 stays source-of-truth; **no merge, DNS move or production cutover until explicitly handled**.
