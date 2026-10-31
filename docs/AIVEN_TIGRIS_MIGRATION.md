# GoCamp: single-PR Aiven + Tigris migration review

> **2026-10-31 UPDATE: direct database mode on cPanel is BLOCKED.** The hosting provider cannot install `pdo_pgsql`. The new Cloudflare Worker + Hyperdrive API adapter is in `worker/`, `app/catalog.php`, and `app/storage.php`. See **[`CLOUDFLARE_WORKER_GATEWAY.md`](CLOUDFLARE_WORKER_GATEWAY.md)** for the supported deployment path. **Do not activate the old direct-PDO setup on cPanel.** This remains draft and unmerged; no Cloudflare deployment or Aiven/Tigris import has been executed.


## Decision

- Aiven free PostgreSQL 18: **one service**, distinct `staging` and `production` databases. Database and user separation are logical; both share CPU/RAM/20-connection ceiling. Do not create a second service.
- Tigris: existing private `gocamp-staging` and `gocamp-prod` buckets. **Keep private**. Web requests stream approved objects via `media.php` and local cPanel cache; no public bucket or credit card required.
- SQL columns for destinations, categories, programs, age ranges, statuses, costs, descriptions, settings; separate relational rows for repeatable program details/highlights, destination stats/FAQs, galleries, category sections and memories. JSONB only for variable visibility/options and unknown program-specific fields (such as disciplines).
- Admin writes go **through the authenticated Cloudflare Worker into the database selected by GOCAMP_ENV**. Uploads go **directly to the matching private bucket**; their references are committed only after successful upload. There is no local source-of-truth write in PostgreSQL mode.
- Public site reads a short-lived **file cache** of the normalized catalog. Admin reads are uncached and stale concurrent writes fail. Images cache locally by immutable object key.
- **No Cron, no FTP/FTPS, no automatic deployment.** Existing FTP workflow jobs are explicitly disabled. New import workflow runs only when manually dispatched, with `IMPORT STAGING`, after secrets and environment approval. No migration or deployment is triggered by PR creation.
- The previous GitHub content PR #39 is independent and must be reconciled before it is merged or promoted. This change does not merge it.

## Uploaded staging.zip reconciliation

The ZIP's Git checkout is at `e55bc17` on `develop`, with one locally modified `data/camp_memories.php`, and five new compressed WhatsApp WebP images. The PR keeps the ZIP's memories data in `data/legacy/camp_memories.php` and includes the new media assets. `.ftpquota` and `.git` are excluded. Other tracked catalogs were identical to that checkout. Future edits on cPanel or GitHub **after** the ZIP snapshot are not automatically incorporated; reconcile them before import.

Baseline ZIP catalog: **63 programs, 9 destinations, 8 categories, 28 memories**, plus global FAQ/settings. Two programs (`italy-tennis`, `italy-sailing`) reference a missing category; the migration retains their slug values rather than silently deleting these programs.

## Manual activation gates (not performed by this PR)

1. Review PR, resolve open content changes and snapshot drift. Keep the remote databases/buckets unchanged until approval.
2. In cPanel verify PHP version >= 8.1; extensions `curl`, `fileinfo`, `gd`; outbound HTTPS to the Cloudflare Worker and Tigris. `pdo_pgsql` is NOT available here and is NOT required for Worker mode. Use a private directory outside the document root for credentials and caches. cPanel host outbound IP should be allowlisted on Aiven where possible.
3. Create separate least-privilege Aiven users (`staging` / `production`), and separate Tigris bucket-scoped access keys (`gocamp-staging` / `gocamp-prod`). Never store the master `avnadmin` password or organization-wide Tigris key in source code.
4. Configure **GitHub Environment** `gocamp-staging-import` with required reviewer and seven staging secrets: `AIVEN_DB_HOST`, `AIVEN_DB_PORT`, `AIVEN_DB_USER`, `AIVEN_DB_PASSWORD`, `AIVEN_CA_PEM_BASE64`, `TIGRIS_ACCESS_KEY`, `TIGRIS_SECRET_KEY` (seven total). The migration user can create schema; do not reuse it as the runtime application user. No production secrets in this environment. Review all action logs before sharing them.
5. After approval and merge, manually run `GoCamp manual staging database and media import` with exact confirmation `IMPORT STAGING`. It creates the schema (if missing), imports committed static snapshots, then uploads committed `images/` and `uploads/` to the private staging bucket. It is designed for an **empty** staging catalog. Existing revisions block overwrites; incremental partial import requires review and recovery, not force-reset.
6. Configure **staging cPanel only**, e.g. env file outside `public_html` or real PHP environment variables (test `getenv()` on your cPanel PHP handler):

```dotenv
GOCAMP_ENV=staging
GOCAMP_DATA_SOURCE=worker
GOCAMP_API_URL=https://gocamp-catalog-staging.<subdomain>.workers.dev
GOCAMP_API_TOKEN=STAGING_ONLY_RANDOM_SECRET
TIGRIS_ENDPOINT=https://t3.storage.dev
TIGRIS_BUCKET=gocamp-staging
TIGRIS_ACCESS_KEY=STAGING_ONLY_KEY
TIGRIS_SECRET_KEY=STAGING_ONLY_SECRET
GOCAMP_CACHE_DIR=/home/ACCOUNT/private/gocamp/catalog
GOCAMP_MEDIA_CACHE_DIR=/home/ACCOUNT/private/gocamp/media
GOCAMP_CACHE_TTL=600
```

7. Manually publish the approved PHP code through your chosen hosting control interface. **This PR does not install it**. Verify admin create/update/bulk action, FAQ, visibility, media upload, image replacement, media rename (metadata only; immutable URL), public navigation, memories and rollback. Review storage permissions and performance before enabling production.
8. For production, use an independent authorized import/promotion plan based on a fresh, approved staging export—not this staging-only workflow. Do not turn on `GOCAMP_DATA_SOURCE=worker` in production before its separate Worker/Hyperdrive, data and images have been imported and validated. Keep both old catalog and media snapshots as rollback sources.

## Semantics, compatibility, and safety

- `data/*.php` are compatibility adapters retaining the legacy arrays under `data/legacy/*.php`. The legacy path behaves as before with `GOCAMP_DATA_SOURCE` unset. `data/faq.json` stays as a legacy snapshot only.
- On cutover, **only the selected environment's Aiven DB and Tigris bucket** receive Admin Dashboard modifications. The old PHP arrays must not become a second authoritative store.
- A new media object is uploaded and verified before SQL points to it; on SQL failure the object is best-effort deleted. Existing objects are not automatically deleted when a user removes a catalog reference. This is a safe, deliberately conservative cleanup policy.
- The media library's rename action in external mode updates the **display name** in SQL, not the immutable S3 key. Existing references remain valid.
- Media uploaded to Tigris use unique content-derived immutable keys. A PHP gateway serves only objects listed as public in `media_assets`; the bucket remains private.
- Source `images/` referenced directly by CSS/templates remain in the Git repository. The manual image importer mirrors committed images to Tigris and remaps catalog-managed references. Do not remove local code assets until all static references are audited.
- Import uses your ZIP snapshot, not a database live scrape. Changes made after that snapshot must be reviewed separately. The app does not auto-merge Git changes and SQL edits.
- No provider guarantees unlimited throughput: Aiven has capacity/connections and Tigris has request allowances despite zero per-GB egress charges.

## Known follow-up verification

- Aiven MCP currently lists the databases but the PostgreSQL Editor connector returned a `mode` validation error, so the schema is **not** verified on the remote database. No SQL was executed remotely.
- Tigris MCP lists both private empty buckets; its detailed bucket settings call returned a response-validation error. No binary uploads were performed remotely.
- PHP `pdo_pgsql` is confirmed unavailable from this cPanel package; the old direct-PDO mode must never be used on cPanel. HTTPS Worker mode requires testing against the actual Cloudflare deployment.
- Legacy media in HTML rich text is remapped on read when a matching legacy path was imported. Manually hardcoded CSS and JS paths remain Git-managed.
- No automatic GitHub PR is created for each Admin Dashboard content edit; the new PR is for application code and schema. If you later want approval per content change, add an explicit publish/review workflow rather than silently replacing immediate DB writes.
- Import SQL/remote S3 integration requires staging execution and endpoint verification with real credentials. The existing PHP regression tests cover legacy mode, not external-provider connectivity.