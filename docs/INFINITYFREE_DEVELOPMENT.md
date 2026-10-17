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
- Only merges/pushes to `develop` automatically deploy. No production deployment.

## First test

Back up existing development runtime content. Once this PR is merged into `develop`, open Actions -> Deploy InfinityFree development (FTPS) -> Run workflow. Choose `develop` and `dry_run=true` to test authentication and directory access without uploading. Then rerun with `dry_run=false` after reviewing the results.

## Preserved live files

The deployer overwrites allowlisted application PHP/CSS/JS only. It never deletes remote files. These tracked files are seeded only when absent: `data/all_programs.php`, `data/programs.php`, `data/destinations.php`, `data/faq.json`, `data/site_settings.php`. Both `data/inquiries/` and `uploads/` are excluded entirely. Only missing images are copied into `images/`; existing media is not overwritten.

GitHub edits to an already-present data file do not apply automatically. Import intentional content changes with the admin dashboard or a separately reviewed migration.

To test safety locally: `python -m unittest discover -s tests -p 'test_infinityfree_deploy.py' -v`.

FTPS transfers are not atomic, so keep regular backups and review the first deployment.
