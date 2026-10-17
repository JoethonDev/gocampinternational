# InfinityFree development deployment

Development only. The `develop` branch deploys to InfinityFree over explicit FTPS. The production cPanel checkout is untouched.

## GitHub environment secrets

1. Open the GoCamp GitHub repository -> Settings -> Environments.
2. Create the environment `infinityfree-development`.
3. Inside it add secret `INFINITYFREE_FTP_USERNAME` with the FTP username from the InfinityFree account.
4. Add secret `INFINITYFREE_FTP_PASSWORD` with the FTP password from the InfinityFree account.
5. Credentials must remain in GitHub's encrypted secrets, not checked-in files or chat messages.

## Connection

- Website: https://gocampinternational.freedev.app/
- Host: `ftpupload.net`; port `21`; explicit FTPS with certificate validation.
- Remote directory: `/htdocs/`.
- Only pushes to `develop` run this workflow. By default they check FTPS connectivity WITHOUT uploading until the environment variable or secret below is enabled. No production deployment.

## First test

Back up development runtime content before uploading. The workflow accepts `INFINITYFREE_DEPLOY_ENABLED` from GitHub Settings -> Environments -> `infinityfree-development` -> **Environment variables** OR **Environment secrets** (or repository variables/secrets). The value must be exactly lowercase `true`, without quotes or whitespace. The workflow is fail-closed: if no matching flag is found it runs a dry run. Do not put the enable flag in a different GitHub environment. Adding a variable does not change the outcome of a workflow run that has already started; trigger a new push to `develop`. The action logs now explain the chosen mode. For a manual workflow dispatch, selecting `dry_run=true` explicitly prevents uploads even when enabled. To pause automatic uploads, set the flag to `false` or delete it. GitHub's manual Run workflow button may only appear when the workflow file also exists on the repository's default branch.

## Preserved live files

The deployer overwrites allowlisted application PHP/CSS/JS only. It never deletes remote files. These tracked files are seeded only when absent: `data/all_programs.php`, `data/programs.php`, `data/destinations.php`, `data/faq.json`, `data/site_settings.php`. Both `data/inquiries/` and `uploads/` are excluded entirely. Only missing images are copied into `images/`; existing media is not overwritten.

GitHub edits to an already-present data file do not apply automatically. Import intentional content changes with the admin dashboard or a separately reviewed migration.

To test safety locally: `python -m unittest discover -s tests -p 'test_infinityfree_deploy.py' -v`.

FTPS transfers are not atomic, so keep regular backups and review the first deployment.
