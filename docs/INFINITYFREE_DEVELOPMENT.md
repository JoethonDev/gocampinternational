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
- Only pushes to `develop` run this workflow. By default they check FTPS connectivity WITHOUT uploading until the environment variable below is enabled. No production deployment.

## First test

Back up existing development runtime content. Once this PR is merged into `develop`, the first push-triggered workflow automatically runs as a DRY RUN because auto-deployment is disabled by default. Check its Actions logs for successful FTPS authentication and directory access. In GitHub Settings -> Environments -> infinityfree-development -> Environment variables, add `INFINITYFREE_DEPLOY_ENABLED` with value `true` **only after that dry run succeeds**. Trigger a new push to `develop` (or rerun the workflow from Actions if available) to upload. Later pushes to `develop` deploy automatically. To pause uploads, set the variable back to `false` or delete it. GitHub's manual Run workflow button may only appear when the workflow file also exists on the repository's default branch; the automatic dry-run/enable flow does not depend on that button.

## Preserved live files

The deployer overwrites allowlisted application PHP/CSS/JS only. It never deletes remote files. These tracked files are seeded only when absent: `data/all_programs.php`, `data/programs.php`, `data/destinations.php`, `data/faq.json`, `data/site_settings.php`. Both `data/inquiries/` and `uploads/` are excluded entirely. Only missing images are copied into `images/`; existing media is not overwritten.

GitHub edits to an already-present data file do not apply automatically. Import intentional content changes with the admin dashboard or a separately reviewed migration.

To test safety locally: `python -m unittest discover -s tests -p 'test_infinityfree_deploy.py' -v`.

FTPS transfers are not atomic, so keep regular backups and review the first deployment.
