# GoCamp — approved content, assets and CMS staging handoff (2026-10-31)

**Source of truth**: [PR40](https://github.com/JoethonDev/gocampinternational/pull/40), commit `80432a2a6fcb4b0de6f14710748e53781ddef58c`, remains untouched. **Additional approved drafts**: [PR39](https://github.com/JoethonDev/gocampinternational/pull/39), commit `a8be270c7a2cad016a747b0918658ee194281e4a` (open and unmerged). No merge or production DNS/Worker cutover.

## Content from prior emails and approvals

- October 30 — Austria: retain existing Vienna German course; reuse PR39 `austria-adventure-camp` exact approved copy as **inactive**. No duplicated German program, invented age/dates, public provider link, or image assignment.
- October 30 — Cambridge UK: reuse PR39 `uk-creative-summer` exact approved copy as **inactive** (ages 12–17, one program containing 3D Design, Acting, Modelling/Animation/Rigging, Branding, Fashion, Film, Game Design). Email said photo missing; no invented main image.
- October 20 / October 18 — Germany: existing PR40 German course/teen, junior, adult, executive content retained in staging, with German destination and German category.
- October 17–18 — Tennis: original submitted UK tennis methodology/four pillars retained in `tennis-academy`. PR40 UK Soccer Academy gallery retains seven photo entries.
- October 17 meeting document — Adult Academic category and existing academic subjects preserved from PR40.
- Approved Young Leader: active MINI MBA 15–17 and Young Leader Oxford/London wording; special-interests category remains trashed, hidden public program listing/gallery and disabled program modals remain unchanged.

The 2 PR39 drafts were copied from original PHP entry data into `data/overlays/pr39-approved-drafts.php` and `cloudflare-app/migration/overlays/pr39-approved-inactive.json`; D1 import was **insert-only and confirmed**. Staging catalog: **65 programs (63 PR40 + 2 inactive PR39), 9 destinations, 8 categories**. The immutable PR40 seed remains 63.

## Image inventory

Git tree contains **331 source image files** under `images/`, and no uploaded asset other than `uploads/.gitkeep`. All **87 direct** D1 image, banner and intro-image paths resolve. Recursive D1 catalog/document scan: **209 references / 172 distinct paths**. One distinct unresolved original reference occurs twice: `uploads/1_1761381038.webp`, from an inactive category. Attempts to access historical hosting copies failed; do not substitute unrelated content. The Austria email photos remain **unassigned**, consistent with the prior unmerged-draft decision.

## CMS work now committed on the migration branch

React admin: dashboard; auth/session/CSRF; filtered program/category/destination catalog and scoped bulk updates; program/destination/category editing with source-preserving HTML preview and formatting; nested repeaters (program schedule, destination highlights/stats/FAQ, category sections); selection of existing 331 images or published R2 assets; per-item Inherit/Show/Hide visibility controls; global visibility sections; visual FAQ reorder/editor; visual memories photo/slider editor; trash restore/publish/permanent-delete; R2 upload/rename/show/hide/reference-protected delete; inquiry status management; safe legacy admin GET bookmark redirects. Admin transitions are modest and respect reduced motion.

## Direct staging pages for review

[Home](https://gocamp-migration-staging.elprincedoca.workers.dev/) · [Austria](https://gocamp-migration-staging.elprincedoca.workers.dev/destinations/austria) · [Germany](https://gocamp-migration-staging.elprincedoca.workers.dev/destinations/germany) · [UK](https://gocamp-migration-staging.elprincedoca.workers.dev/destinations/uk) · [German Courses](https://gocamp-migration-staging.elprincedoca.workers.dev/program/category?category=german-language-courses) · [Adult Academic](https://gocamp-migration-staging.elprincedoca.workers.dev/program/category?category=adult-academic) · [Young Leader](https://gocamp-migration-staging.elprincedoca.workers.dev/program/category?category=young-leader-program)

[Admin Login](https://gocamp-migration-staging.elprincedoca.workers.dev/admin/login) · [Programs](https://gocamp-migration-staging.elprincedoca.workers.dev/admin/catalog/program) · [Austria Adventure draft](https://gocamp-migration-staging.elprincedoca.workers.dev/admin/catalog/program/austria-adventure-camp) · [UK Creative Summer draft](https://gocamp-migration-staging.elprincedoca.workers.dev/admin/catalog/program/uk-creative-summer) · [Visibility](https://gocamp-migration-staging.elprincedoca.workers.dev/admin/documents/site_settings) · [FAQs](https://gocamp-migration-staging.elprincedoca.workers.dev/admin/documents/faq) · [Memories](https://gocamp-migration-staging.elprincedoca.workers.dev/admin/documents/camp_memories) · [Media](https://gocamp-migration-staging.elprincedoca.workers.dev/admin/media) · [Trash](https://gocamp-migration-staging.elprincedoca.workers.dev/admin/trash) · [Inquiries](https://gocamp-migration-staging.elprincedoca.workers.dev/admin/inquiries)

## NOT YET 100% VERIFIED

Existing public browser parity checks cover 8 sample templates × 3 viewport sizes, not every data variation. Newly added CMS actions have passed code/type/build checks in GitHub on preceding commits, but **authenticated end-to-end save/edit/bulk/upload/trash UI flows have not yet been exercised as a signed-in admin**. Actual outbound email notification is not configured for Cloudflare forms; a successful lead means D1 storage only. One original inactive-category image is missing. Full D1 backup/restore, workload quotas, every slug/SEO/legacy POST, and complete media reference replacement have not been verified. Do not label the migration fully complete or promote to production until these are resolved.
