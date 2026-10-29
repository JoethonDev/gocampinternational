# cPanel staging: automatic deploy from `develop`

Target: **https://new.gocampinternational.net/** (verify the cPanel Domains document root before deployment)

The staging cPanel subdomain is independent of production and the existing InfinityFree
development host. Every push to `develop` (once enabled) triggers:
1. PHP/JS/CSS and missing seed-file upload through plaintext FTP as a temporary hosting-provider workaround.
2. Recurring, reviewed PHP catalog reconciliation preserving admin-managed fields.
3. An encrypted catalog rollback artifact retained in GitHub Actions for 7 days.

No remote file deletions. Existing uploads, inquiry submissions, and admin-edited images
are not overwritten. Existing program catalogs are not blindly replaced.

## One-time cPanel step: make a restricted FTP account

1. In cPanel **Domains**, find `new.gocampinternational.net` and copy its *actual* document root.
   Do not guess its path. Production's document root must be different.
2. Open **Files > FTP Accounts**. Create a dedicated account, e.g. `stagingdeploy`,
   with **Directory equal to the exact staging document root** (for example,
   `public_html/staging`, *only if that is the path shown in Domains*).
   Correct the Directory field if cPanel appended the username.
3. Set a strong unique password. Copy the full FTP account login shown by cPanel
   (often `stagingdeploy@your-domain`). Do **not** use a primary or production FTP
   account or the cPanel administrative password.
4. From the FTP configuration section or hosting provider, get the **FTP server hostname**
   (e.g., `ftp.gocampinternational.net`).
5. The dedicated FTP account is jailed to its staging document root. Relative
   remote root `/` therefore points to the staging site. The workflow currently uses unencrypted
   FTP over TCP port 21 (not SFTP on 22) until the provider fixes TLS.

This isolated account is essential: a primary FTP login could access production.
Nothing in the GitHub workflow can prove the FTP server's `/` is a staging-only
directory; scope the account correctly before enabling deployment.

## One-time GitHub step: environment variables and secrets

Open the GitHub repository:
**Settings > Environments > New environment > `cpanel-staging`**.

Add **Environment secrets**:

| Name | Value |
| --- | --- |
| `CPANEL_STAGING_FTP_USERNAME` | Full staging-only FTP login from cPanel |
| `CPANEL_STAGING_FTP_PASSWORD` | Strong password for that same FTP account |

Add **Environment variables**:

| Name | Value |
| --- | --- |
| `CPANEL_STAGING_FTP_HOST` | FTP server hostname, without protocol or port |
| `CPANEL_STAGING_DEPLOY_ENABLED` | `true` (lowercase) |

The separate environment is **not** `infinityfree-development` and uses **none**
of its `INFINITYFREE_*` secrets. No GitHub PAT, cPanel API token or
database password is needed for this file deployment.

When credentials have been entered and the dedicated staging-only account is
verified, set `CPANEL_STAGING_DEPLOY_ENABLED` to `true`.

## Verify

1. Merge the cPanel deployment PR into `develop` (not `main`).
2. In **Actions**, find **Deploy cPanel staging (FTP)**.
3. If `CPANEL_STAGING_DEPLOY_ENABLED` was `false` or missing for the merge
   push, make a subsequent push to `develop` after setting it to `true`.
4. Check the workflow for success, then load `https://staging.gocampinternational.net/`
   and check the browser and server logs for any PHP warnings.
5. Confirm that existing admin-created data and image uploads are intact.

There is no need to upload ZIP files, install Git on cPanel, or run commands
on the cPanel host after this one-time setup. Each later push to `develop`
deploys automatically.

### Troubleshooting

- **TLS unavailable:** the staging workflow temporarily opts into plaintext FTP;
  restore `CPANEL_STAGING_FTP_MODE: tls` as soon as the provider repairs FTPS.
- **Passive FTP timeout:** plaintext FTP does not fix blocked data ports. If root listing times out,
  ask the provider to configure and open the passive port range (port 33779 was observed).
  The uploader checks listing before any write and fails safely if it is blocked.
- **Authentication denied:** copy the full FTP login, and verify the FTP account's
  actual password and hosting FTP firewall/access policy.
- **FTP 550:** confirm the dedicated account's Directory equals the subdomain
  document root and permits upload.
- **Timeout or data-transfer failure:** ask the provider whether FTP port 21
  and passive data ports are accessible from GitHub-hosted runners.
- **Workflow skipped:** set `CPANEL_STAGING_DEPLOY_ENABLED=true` in the
  `cpanel-staging` GitHub environment, and trigger a new push.
- **Staging page 403 after success:** verify cPanel's document root and the
  FTP account Directory really match; `index.php` should be in that root.
- **Manual workflow button not visible:** GitHub commonly requires a
  `workflow_dispatch` workflow to exist on the default branch before
  manual dispatch is offered. Pushes to `develop` still trigger this workflow.

No database cloning is performed, because the current GoCamp app uses PHP
files as its active catalogs. Keep future staging runtime data separate from
production, and ensure required PHP extensions/version are enabled on cPanel.

## Safety

This workflow relies on the existing tested upload allowlist from
`deploy/infinityfree-deploy.py`, but has separate cPanel credentials and
a separate workflow. The existing InfinityFree settings/workflow are unchanged.
The cPanel catalog reconciliation uses the same merge process, checks for
concurrent admin updates, saves an encrypted rollback backup before applying
changes, and verifies writes.

FTPS uploads are not atomic; avoid concurrent staging admin edits during deployment
and keep independent hosting backups.

## Temporary plaintext FTP exception (October 2026)

The hosting server currently rejects both `AUTH TLS` and `AUTH SSL` with
`500 This security scheme is not implemented`. The staging workflow therefore sets
`CPANEL_STAGING_FTP_MODE: plaintext` **explicitly**; TLS remains the deploy script's
default mode if the variable is omitted. Reconciliation uses the same staging setting;
InfinityFree's separate deployment remains TLS-only.

**Risk:** credentials, uploads, and downloaded catalogs travel without encryption and
can be observed or modified by anyone able to intercept the connection. The encrypted
GitHub rollback artifact protects the stored backup only, not FTP transit.
Use a unique staging-only jailed FTP user with a strong, disposable password.
Never use a cPanel administrator or production account. Rotate that FTP password after
TLS is repaired. Do not use plaintext FTP for production.

**Before enabling any write:** verify the FTP account root `/` is exactly the staging
site's document root, never production. First run the dry-run; it now performs a real
passive directory listing, so blocked data ports are detected even without uploads.
Do not merge into `develop` until this check and the account jail are verified.

**Revert:** change the workflow setting to `CPANEL_STAGING_FTP_MODE: tls`,
then confirm explicit FTPS connection and data-channel success before reenabling writes.
