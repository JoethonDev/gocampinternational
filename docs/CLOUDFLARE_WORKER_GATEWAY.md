# GoCamp Aiven + Tigris via Cloudflare Worker (draft; not deployed)

## Why
The cPanel hosting package cannot enable PHP `pdo_pgsql`; direct database mode **must not be enabled there**. GoCamp uses Cloudflare Workers as an authenticated HTTPS gateway, leaving the existing PHP Admin Dashboard intact. Neither Deno Deploy nor an additional VPS is required.

**Current PR behavior:** `GOCAMP_DATA_SOURCE` unset => legacy PHP catalogs; `postgres` => direct PDO for **GitHub Actions CLI imports only**; `worker` => HTTPS catalog and media metadata through Cloudflare Worker. No remote resources are created or modified by opening or merging this PR.

## Infrastructure

```text
Staging PHP (cPanel) -> HTTPS -> gocamp-catalog-staging Worker -> staging Hyperdrive -> Aiven/staging
Production PHP      -> HTTPS -> gocamp-catalog-production Worker -> prod Hyperdrive -> Aiven/production
       |                                   
       +-- signed S3 HTTPS --> private Tigris bucket (staging or prod)
       +-- local PHP cache for public catalog and image bytes
```

Existing Cloudflare account has Workers but no GoCamp Worker or Hyperdrive configuration; **do not modify other Workers**. Use a separate Worker and Hyperdrive configuration per environment. Aiven free has 20 connections across both databases: Hyperdrive's per-configuration minimum is five origin connections; tune conservatively, and monitor the total. Do not enable Hyperdrive query caching for admin writes/transactions; PHP public cache already avoids frequent database reads. **Do not expose any endpoint that executes arbitrary SQL**.

The API has fixed catalog/metadata endpoints (`worker/src/core.js`). It uses a server-to-server bearer secret and an explicit `X-GoCamp-Environment` header, checked against the Worker deployment environment. Cloudflare secrets and cPanel configuration use independent tokens per environment. No browser access, no CORS, no public DB connection credentials.

## Before enabling staging

1. Review PR #40, reconcile PR #39 and content edits after `staging.zip`.
2. In Aiven, create a least-privilege **staging application database user** for schema read/write; preserve a distinct migration user for GitHub Actions. Do not use `avnadmin` in the Worker. Upload the Aiven project CA certificate to Cloudflare Hyperdrive when configuring TLS verification (`verify-full`). Test the database from Hyperdrive before deploying the Worker. No changes to production.
3. In Cloudflare dashboard: Workers & Pages → Hyperdrive, create a **staging** configuration pointing to the external Aiven endpoint and `staging` database. Restrict its pool to the smallest supported size, initially five connections. Save its binding ID.
4. Under `worker/`, copy `wrangler.staging.example.toml` to `wrangler.staging.toml`, replacing the Hyperdrive ID. Treat the production template as **disabled** until separately approved.
5. On your local machine or GitHub Actions, install Worker dependencies (`npm install` under `worker/`), then `npm run check`. Deployment is manual only; no Cron/FTP and no automatic production dispatch.
6. Deploy only `gocamp-catalog-staging` after approval (`npx wrangler deploy -c wrangler.staging.toml`). Set an unpredictable per-environment `API_TOKEN` as a **Cloudflare Worker secret**, not a plain `vars` entry or committed source file. Publish the matching cPanel setting using protected environment configuration outside the web root. Save the staging Worker URL.
7. The manual import (existing workflow) can use `pdo_pgsql` from the **GitHub Actions runner**, even though cPanel cannot. It requires Aiven staging migration credentials and staging-only Tigris key, and must be gated to an empty catalog. This workflow is not guaranteed visible in Actions until present on the default branch. Do not merge to `main` merely to enable dispatch.
8. Configure cPanel staging with `GOCAMP_DATA_SOURCE=worker` only when the staging Worker, database schema and media import all work. Check actual `getenv()` support in cPanel and use a protected env loader if needed. Test `GET /v1/catalog`, admin edit, FAQ, bulk visibility, media upload/rename/replacement, and public cache. Production must keep legacy data until explicit promotion.
9. Confirm Aiven access rules and use least-privilege credentials. **No production deployment or import from this PR**.

### Staging cPanel runtime environment (no database password/CA required in PHP)

```dotenv
GOCAMP_ENV=staging
GOCAMP_DATA_SOURCE=worker
GOCAMP_API_URL=https://gocamp-catalog-staging.<your-workers-subdomain>.workers.dev
GOCAMP_API_TOKEN=STAGING_ONLY_RANDOM_SECRET
GOCAMP_CACHE_DIR=/home/ACCOUNT/private/gocamp/catalog
GOCAMP_MEDIA_CACHE_DIR=/home/ACCOUNT/private/gocamp/media
GOCAMP_CACHE_TTL=600
TIGRIS_ENDPOINT=https://t3.storage.dev
TIGRIS_BUCKET=gocamp-staging
TIGRIS_ACCESS_KEY=STAGING_BUCKET_SCOPED_KEY
TIGRIS_SECRET_KEY=STAGING_BUCKET_SCOPED_SECRET
```

Set the same `API_TOKEN` value in the **staging** Worker secret. Production must have its *own* Worker, Hyperdrive, API token, Tigris bucket/key, and cache directories. No `.env` with secrets should be committed or stored inside the public directory.

### Manual GitHub Actions import secrets (`gocamp-staging-import`)

- `AIVEN_DB_HOST`, `AIVEN_DB_PORT`, `AIVEN_DB_USER`, `AIVEN_DB_PASSWORD`
- `AIVEN_CA_PEM_BASE64`, `TIGRIS_ACCESS_KEY`, `TIGRIS_SECRET_KEY`

GitHub Actions runs PHP 8.4 with `pdo_pgsql`; this is deliberately separate from cPanel PHP 8.1+.

## Worker routes

- `GET /health` — no DB activity or secrets exposed; reports environment.
- `GET /v1/catalog/{all_programs,destinations,programs,site_settings,camp_memories,faq}` — normalized SQL projection with revision.
- `PUT /v1/catalog/{kind}` — replace authoritative collection with expected revision, within one SQL transaction, rejecting stale writers.
- `GET /v1/revision/{kind}` — current revision.
- `GET /v1/media/list`, `GET /v1/media/object?key=`, `GET /v1/media/mappings` — authorized media metadata.
- `POST /v1/media`, `PATCH /v1/media/rename`, `PATCH /v1/media/legacy` — metadata mutations after/with Tigris object lifecycle.

Only authenticated server-side PHP can call protected routes. Image bytes are uploaded/read from Tigris via S3 HTTPS in PHP, not proxied through Worker; the Worker tracks metadata. PHP caches successful media authorization for ten minutes and immutable image bytes by checksum. Unpublishing an image may still leave a browser-cached image; avoid claiming immediate revocation of already-public images.

## Quotas and known risks

Cloudflare Workers Free: 100,000 requests/day, 10 ms CPU per request; Hyperdrive Free: 100,000 database statements/day. These are **finite, account-level limits**. Total usage is shared with other existing Workers; if quotas are exceeded, a free Worker can fail. The Worker is for admin writes and periodic catalog refreshes, not direct per-visitor image delivery. Hyperdrive origin connection pools can temporarily exceed configured sizes, so watch Aiven's 20-connection cap. Aiven project CA verification and Hyperdrive connectivity must be tested with the live service.

- No real Aiven schema/query, Cloudflare Hyperdrive connectivity or Tigris S3 upload has been executed yet. Offline tests cannot establish deployability.
- The current full-collection replace strategy is compatible with old admin forms but may use many SQL statements per edit; monitor CPU/Hyperdrive quota and optimize to partial-row edits if required.
- Environment isolation relies on distinct Worker deployments, credentials, database bindings and protected cPanel configuration. Never configure staging to call the production Worker.
- Legacy source image files referenced directly in CSS, JS or HTML remain in Git until audited; images referenced through the catalog can be remapped after migration.
- The original PHP `postgres` adapter remains for CLI import compatibility, but is not viable on cPanel. Do not accidentally activate it.
- If the Worker, Aiven or Tigris is unavailable, public catalog reads may use a local last-known-good snapshot; admin writes fail closed. Tigris remains the image source of truth. No two-way sync or Cron tasks.
- Rotate bucket keys that have already been displayed in a conversation before production use.