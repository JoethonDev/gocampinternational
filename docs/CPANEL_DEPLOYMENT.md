# GoCamp International — protected cPanel deployment

This PHP website writes admin-edited content directly to the filesystem. **Do not use recursive full-site overwrites or a sync with delete enabled.** Production data is authoritative.

## Protected runtime files

| Path | Purpose | Deployment behavior |
| --- | --- | --- |
| `data/all_programs.php` | Individual programs | Seed if missing, never overwrite |
| `data/programs.php` | Program categories | Seed if missing, never overwrite |
| `data/destinations.php` | Destination content | Seed if missing, never overwrite |
| `data/faq.json` | Frequently asked questions | Seed if missing, never overwrite |
| `data/site_settings.php` | Visibility switches | Seed if missing, never overwrite |
| `data/inquiries/` | New leads and contact messages | Never touch |
| `uploads/` | Uploaded media | Never touch |
| `images/` | Static repo imagery AND media uploaded through the admin | Copy new images; never replace existing files |

GitHub changes to existing `data/*` entries WILL NOT automatically update the live website; import them through a separate approved content-migration process after reconciling against current live data. This prevents accidental loss of live edits. For an image replacement, use a new/versioned filename and update the reference (via admin or reviewed migration). Never assume GitHub has the newest live content.

## Step 1: Backup production

Before the first deploy, take a **full cPanel account backup**, including the entire `data/` directory and `images/`. Keep a copy off the hosting server. The deployment script also makes code-only snapshots, but **those exclude customer data**.

## Step 2: Clone using cPanel Git Version Control

Go to **Files > Git Version Control > Create**. Set:

- **Clone a Repository:** enabled.
- **Clone URL:** `https://github.com/JoethonDev/gocampinternational.git`
- **Repository Path:** a path OUTSIDE the public document root, for example `/home/ACCOUNT/repositories/gocampinternational`.
- **Repository Name:** `gocampinternational`.
- Use the `main` branch.

Never clone a Git repository directly into `public_html`. If the repository already exists, manage that checkout instead of creating a second clone.

## Step 3: Explicitly authorize the correct live directory

Use **Files > File Manager** and enable **Show Hidden Files** under Settings.

1. In the cPanel account home directory (`/home/ACCOUNT/`), create a text file named `.gocamp-deploy-target`. Its ONLY line is the absolute document-root directory, such as `/home/ACCOUNT/public_html`. This file must NOT be in the public website.
2. In that exact live document root, create an **empty** file named `.gocamp-deploy-allowed`.
3. Confirm the document root already has a real `index.php` and `data/` directory. The deployment script fails without these.

The absolute path may differ for an addon domain; use cPanel's **Domains > Document Root** value rather than guessing.

## Step 4: Perform one controlled deployment

Once this PR is merged to `main`:

1. Navigate to **Git Version Control > Manage > Pull or Deploy**.
2. Click **Update from Remote**.
3. Click **Deploy HEAD Commit**. This runs the top-level `.cpanel.yml`, which invokes `deploy/cpanel-deploy.sh`.
4. Test the homepage, destinations, program pages, CSS, admin login, and media.
5. Edit one safe FAQ or visibility switch using the live admin. Deploy the same commit again and confirm the edit is **still present**.
6. Inspect the cPanel deployment status/logs. Code backups live under `/home/ACCOUNT/gocamp-deploy-backups/` and must be periodically rotated by an administrator to avoid filling hosting storage.

The script updates PHP/CSS/JS and adds missing images. It never deletes production files. A backup failure or missing approval marker prevents changes.

## Step 5: Enable automation only AFTER manual validation

### Choice A — Scheduled GitHub pull from cPanel

If the hosting plan provides **Cron Jobs**, Git CLI, `flock`, and UAPI to cron processes, create a cron entry (every 15 minutes):

```cron
*/15 * * * * /bin/bash /home/ACCOUNT/repositories/gocampinternational/deploy/cron-pull-and-deploy.sh >> /home/ACCOUNT/gocamp-deploy-cron.log 2>&1
```

Replace `ACCOUNT` and the checkout path with your real values. The script runs only from the checked-out `main` branch, acquires a lock, fetches GitHub, fast-forwards (without destructive reset), and requests a native cPanel deployment ONLY when there is a new commit. This is scheduled polling, **not immediate GitHub push-to-live**. Inspect the log and cPanel deployment status after the first cron execution. If Git CLI/UAPI are disabled, do not enable this cron.

### Choice B — Direct SSH push to the cPanel-managed repository

If hosting enables SSH, GitHub Actions can securely push a reviewed `main` commit to the cPanel-managed Git remote using a restricted SSH key stored in **GitHub Actions Secrets**. cPanel's post-receive hook will deploy it automatically. This variant requires your specific SSH host, port, and cPanel-managed repository clone URL and is not enabled by this PR. Do NOT put SSH passwords or private keys into the repository.

## Limitations / rollback

- No automatic deletion and no atomic release swap. Plan initial deployments for low-traffic periods.
- Old code-only backups do not include live data or necessarily remove files introduced by a later release.
- Do not overwrite an existing static image in-place via GitHub; the current design deliberately preserves all existing `images/` filenames.
- Roll back application code from the saved code archive as needed; restore the full cPanel backup separately only if production data is damaged.
- Keep sensitive `data/inquiries/`, `.env`, uploaded media, Git metadata and secrets outside any external source-control sync.
- Content schema changes require separately reviewed migrations, because the admin's PHP data files are protected.

## Automated safety test

Run `bash tests/cpanel-deploy-test.sh`. It checks that deployments change code, copy new images, preserve existing images and uploads, preserve live PHP/JSON/admin data and leads, block unapproved paths, and preserve the next admin edit across a subsequent deployment.

Official reference: https://docs.cpanel.net/knowledge-base/web-services/guide-to-git-deployment/
