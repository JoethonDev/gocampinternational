# PR #40 catalog contract and behavior inventory
SOURCE REF = 80432a2a6fcb4b0de6f14710748e53781ddef58c. Do not read data from main/develop when generating migration fixtures.

## Authoritative content paths
data/legacy/all_programs.php (63), data/legacy/destinations.php (9), data/legacy/programs.php (8 categories), data/legacy/camp_memories.php (28 memories), data/legacy/site_settings.php, data/faq.json; images/ and uploads/ tracked assets. PR #40 includes five additional WhatsApp WebPs and one updated memories catalog from staging.zip. These counts come from PR #40's own reconciliation documentation; independently verify in Phase 0/2.

PR #40's data/{all_programs,destinations,programs,site_settings,camp_memories}.php are *adapter wrappers*, not content snapshots. Do not accidentally import empty wrappers. The PostgreSQL SQL and old Worker bridge express existing field semantics but must not become a second source of truth.

## Current implemented D1 mapping (2026-10-31)
Migration source: cloudflare-app/server/db/migrations/0001_catalog.sql. The former detailed normalized PostgreSQL model below is *reference material*, NOT the D1 schema in use. The implemented D1 design uses catalog_entities(kind, slug, name, status, category_slug, sort_order, content_json, revision), which retains every original PR #40 field in content_json while indexing public filtering fields. site_documents stores the complete original site_settings, camp_memories and FAQ JSON. destination_programs retains program ordering. media_assets holds immutable object metadata. import_sources stores SHA-256 provenance. inquiries and admin_sessions support future features. This removes unnecessary dynamic catalog_items tables.

## Mapping from PR #40 normalized model to SQLite (superseded reference)
program_categories(slug PK, name, status, banner, intro, intro_image, color, section_visibility JSON text, extra JSON text);
programs(id PK, category_slug, name, status, display_order, image, age_min/max, duration, price, color, description, tagline, level, visibility_overrides JSON text, extra JSON text);
destinations(slug PK, name, status, banner, tagline, intro_image, intro_text, section_visibility JSON text, visibility_overrides JSON text, extra JSON text);
destination_programs(destination_slug, program_id, position), catalog_items(owner_type, owner_id, field, position and typed fields), site_settings(key, value JSON text), global_faqs(position, question, answer), media_assets(immutable object key, original/display name, hash, MIME, bytes, public/legacy paths), catalog_revisions(catalog, revision). Additional minimal tables for admin_sessions and inquiries/newsletter are allowed if parity requires them. Keep exact unknown fields in extra JSON, never silently discard.

## Preserve precise legacy behaviors
- Program/category/destination active status, ordering, ages, pricing, HTML description content, categories and destination associations.
- Global visibility settings + per-record overrides; gallery disabled policy for destinations/programs; hidden /programs list with nested categories and inner program pages working; program detail modal disabled, not deleted.
- Home cards, banner/title alignment and sizing, page-specific header/footer, responsive layout at 390/768/1440.
- Admin edit/create/duplicate/archive/delete/restore, bulk selection on per-category/destination and main list, image removal without replacement, media-library pagination/rename, FAQ and memories editing, inquiry/new/read/replied states, visitor forms.
- A stale/unknown category association must be recorded rather than dropped. Specifically italy-tennis and italy-sailing have missing category in PR #40 source.
- Existing URLs including destination/index, program/index, program/category, gallery and contact; route aliases/redirects to be derived from index.php, .htaccess and existing links during Phase 0.
- No extra gallery UI or resurrected listing routes that are intentionally hidden.

## Acceptance evidence table template
| Source feature / URL | Source file / visual capture | New TS route/service | Data record count or expected behavior | Automated test | Pass/Fail |
| --- | --- | --- | --- | --- | --- |
| Home | home.php + sections | TBD Phase 3 | visibility, CTA, cards | screenshot + smoke | Pending |
| Destination list/detail | destination/index.php | TBD Phase 3 | active/status/override | E2E | Pending |
| Categories + inner programs | program/*.php | TBD Phase 3 | hidden top-level list; inner routes | E2E | Pending |
| Admin catalog | admin/*.php | TBD Phase 4 | editable, revisions, bulk, archive | E2E | Pending |
| Media | admin/media-* + admin/ajax | TBD Phase 5 | upload, rename, remove, gallery | E2E | Pending |
| Leads/inquiries | api/*.php + admin/inquiries | TBD Phase 5 | submission + status | E2E | Pending |

The migration converter must output a machine-readable manifest of source file hashes, entity counts, broken relations, image paths, visibility flags, and example rich-text fields. Import staging before any production import; verify same count/hash properties after queries.
