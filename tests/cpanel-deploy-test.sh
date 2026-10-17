#!/usr/bin/env bash
set -Eeuo pipefail
repo="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd -P)"
tmp="$(mktemp -d)"
trap 'rm -rf -- "$tmp"' EXIT
export HOME="$tmp/home"
site="$HOME/public_html"
mkdir -p "$site/data/inquiries" "$site/images" "$site/uploads" "$site/admin" "$site/css"
printf '%s\n' "$site" > "$HOME/.gocamp-deploy-target"
printf 'ORIGINAL CODE' > "$site/index.php"
printf 'ORIGINAL ADMIN' > "$site/admin/dashboard.php"
printf 'ORIGINAL CSS' > "$site/css/style.css"
printf 'LIVE MEDIA' > "$site/images/england.webp"
printf 'LIVE UPLOAD' > "$site/uploads/photo.webp"
printf 'LEAD RECORD' > "$site/data/inquiries/lead.json"
for file in all_programs.php destinations.php faq.json programs.php site_settings.php; do
  printf 'LIVE ADMIN EDIT: %s' "$file" > "$site/data/$file"
done

# Without an explicit approval marker, deployment MUST fail without changes.
if /bin/bash "$repo/deploy/cpanel-deploy.sh" >/dev/null 2>&1; then
  echo 'Deployment should be rejected without a marker' >&2
  exit 1
fi
[[ "$(cat "$site/index.php")" == "ORIGINAL CODE" ]]

touch "$site/.gocamp-deploy-allowed"
/bin/bash "$repo/deploy/cpanel-deploy.sh"
cmp "$repo/index.php" "$site/index.php"
cmp "$repo/admin/dashboard.php" "$site/admin/dashboard.php"
cmp "$repo/css/style.css" "$site/css/style.css"
cmp "$repo/images/switzerland.webp" "$site/images/switzerland.webp"
[[ "$(cat "$site/images/england.webp")" == "LIVE MEDIA" ]]
[[ "$(cat "$site/uploads/photo.webp")" == "LIVE UPLOAD" ]]
[[ "$(cat "$site/data/inquiries/lead.json")" == "LEAD RECORD" ]]
for file in all_programs.php destinations.php faq.json programs.php site_settings.php; do
  [[ "$(cat "$site/data/$file")" == "LIVE ADMIN EDIT: $file" ]]
done

printf 'NEW FAQ ENTRY' > "$site/data/faq.json"
/bin/bash "$repo/deploy/cpanel-deploy.sh" >/dev/null
[[ "$(cat "$site/data/faq.json")" == "NEW FAQ ENTRY" ]]
[[ "$(find "$HOME/gocamp-deploy-backups" -name 'code-*.tar.gz' | wc -l)" -ge 2 ]]
echo 'Safe cPanel deployment test passed.'
