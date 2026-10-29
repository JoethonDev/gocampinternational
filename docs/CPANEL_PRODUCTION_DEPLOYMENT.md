# cPanel production: automatic GitHub deployment (main)

This deployment is **independent** from:
- cPanel staging (`develop`, `cpanel-staging` environment).
- InfinityFree development (`develop`, `infinityfree-development` environment).

The workflow `.github/workflows/deploy-cpanel-production.yml` validates every
pull request to `main` without contacting production. After it is merged,
every push to `main` deploys automatically **only if you explicitly enable it**.
Until then production is untouched.

## Critical safety requirements

1. **Backup production separately in cPanel first** (website files and any
   other business data). GitHub's backup covers overwritten *application code
   files only*; it is not a complete server snapshot.
2. In cPanel **Domains**, identify the *actual document root* for your current
   live production domain. Do **not** assume `public_html` or the staging path.
3. In cPanel **Files > FTP Accounts**, create a **dedicated production-only FTP
   user** with its **Directory set to exactly this production document root**.
   Verify that the account cannot navigate above that directory. A full
   cPanel/primary FTP login is **unsafe** because its remote root may include
   both staging and production. Do not reuse the staging credentials.
4. In the FTP client's connection details, obtain the **hosting server's
   hostname** (not the website domain or FTP alias), compatible with explicit
   **FTPS with TLS 1.2+ on port 21**. cPanel FTP does not support TLS SNI:
   its hostname and certificate must match.
5. Before enabling automatic uploads, verify this FTP server accepts
   `AUTH TLS` and supports passive-mode transfers from GitHub Actions.
   **Never change the script to plain FTP to work around TLS failures.**

The separate staging run #40860198098 failed with `500 This security scheme is
not implemented` when contacting `ftp.gocampinternational.net`. This means
that endpoint did not accept the requested FTPS negotiation. Fix host/FTPS
service with the hosting provider before setting up production with the same
endpoint; the production script also requires FTPS.

## Configure GitHub environment once

Go to repository **Settings > Environments > New environment**.
Create **`cpanel-production`** (separate from `cpanel-staging`).

Set these **Environment secrets**:

| Name | Value |
|---|---|
| `CPANEL_PRODUCTION_FTP_USERNAME` | The **dedicated production-only** full FTP username from cPanel |
| `CPANEL_PRODUCTION_FTP_PASSWORD` | The password for that dedicated FTP account |

Set these **Environment variables**:

| Name | Value |
|---|---|
| `CPANEL_PRODUCTION_FTP_HOST` | FTPS server's TLS-valid hostname, no scheme, path or port |
| `CPANEL_PRODUCTION_DEPLOY_ENABLED` | `false` initially, then `true` after verification |

The production workflow does not need a GitHub PAT, database credentials,
cPanel API token, SSH key, or manual zip uploads.

## Rollout

1. Review and merge the production deployment PR into **`main`**. This does
   not upload files while the enable flag is unset or `false`.
2. Configure the dedicated production FTP account and environment secrets.
3. Ensure staging has been tested with the intended release, and take an
   independent cPanel production backup.
4. Enable `CPANEL_PRODUCTION_DEPLOY_ENABLED=true` in environment variables.
5. Trigger a new push/merge to `main` to initiate the first deployment.
6. Open **GitHub Actions > Deploy cPanel production (FTPS)** and confirm the
   check, encrypted backup, and deploy steps succeeded.
7. Smoke-test production home, /admin login, destination/program categories,
   inquiry form, current catalog records, and media URLs after deployment.

On each subsequent push to `main` the same checks and deployment run
automatically. Disable by setting `CPANEL_PRODUCTION_DEPLOY_ENABLED=false`
whenever releases must be paused. GitHub environment reviewer protection is
optional but, if enabled, will require manual approval per deployment.

### What exactly changes?

- Overwrites allowlisted PHP/CSS/JS app files and tracked root entrypoints.
- Adds **missing** Git-tracked media images and data seed files.
- Does **not** overwrite existing admin-managed `data/*.php` and `faq.json`
  records, `images/` media, or `uploads/`.
- Does **not** upload `.git/`, `.github/`, tests, `.env`, backup archives,
  server logs, or `data/inquiries/`.
- Does **not** delete remote files during normal deployment.
- Before uploading, reads and encrypts existing code files into a GitHub
  Actions rollback artifact (14-day retention), checks for concurrent code
  edits, and verifies each modified code file after transfer.
- If a transfer fails, the script attempts to restore modified code from the
  snapshot and reports any incomplete rollback. FTPS is **not atomic**;
  monitor every run and use your independent cPanel backup if needed.

For encrypted artifact restoration, the backup is sealed with a key derived
from the production FTP password used in that run. Keep a secure record of
password rotation in your password manager, or old encrypted artifacts will
not be decryptable after rotation.

### Note about catalog updates

Production is intentionally **not** running the develop-only catalog
reconciliation. This protects all live admin-edited records. Committing
changes to the Git-tracked `data/*.php` files will not overwrite existing
production catalog files. Publish catalog changes through the production
admin dashboard or add a separately reviewed and backed-up reconcile
migration in a future PR.

### Troubleshooting FTPS 500

If you see `500 This security scheme is not implemented`, the remote FTP
server did not accept `AUTH TLS`; do not change to insecure FTP. In cPanel
**FTP Accounts > Configure FTP Client** check the server hostname, and if
needed ask the host/WHM administrator to enable TLS support for ProFTPD or
Pure-FTPd. GitHub Actions requires the remote server to support secure
file transfer over the configured port.

For `550` errors, inspect the dedicated account's Directory and permissions.
For timeouts, ask your hosting provider about FTPS port 21 and passive FTP
data ports from GitHub-hosted runners.

For manual workflow dispatch, GitHub may show the Run workflow button only
when the workflow also exists on the default branch.
