#!/usr/bin/env bash
# GoCamp: deploy application code while preserving files managed by the live admin.
set -Eeuo pipefail
umask 027

fail() {
  printf 'GoCamp deployment blocked: %s\n' "$*" >&2
  exit 1
}
repo="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd -P)"
home="$(cd -- "${HOME:?HOME is required}" && pwd -P)"
config="$home/.gocamp-deploy-target"

[[ -f "$config" ]] || fail "Create $config containing the absolute document-root path."
IFS= read -r target < "$config" || true
[[ "$target" == /* && -d "$target" ]] || fail "Deployment target must be an existing absolute directory."
target="$(cd -- "$target" && pwd -P)"
[[ "$target" == "$home/"* ]] || fail "Target must be inside your cPanel home directory."
[[ "$target" != "$repo" && "$target" != "$repo/"* && "$repo" != "$target/"* ]] ||
  fail "Git checkout and public document root must be separate."
[[ -f "$target/.gocamp-deploy-allowed" ]] ||
  fail "Create the empty .gocamp-deploy-allowed file inside the intended document root."
[[ -f "$target/index.php" && -d "$target/data" ]] ||
  fail "Expected an existing GoCamp site with index.php and data/."

root_files=(
  .htaccess 404.php about_us.php contact_us.php faq.php home.php
  index.php init.php landing.php
)
code_dirs=(admin api css destination includes js program sections)
protected_data=(all_programs.php destinations.php faq.json programs.php site_settings.php)

for file in "${root_files[@]}"; do
  [[ -f "$repo/$file" ]] || fail "Missing repository file: $file"
done
for dir in "${code_dirs[@]}"; do
  [[ -d "$repo/$dir" ]] || fail "Missing repository directory: $dir"
done

# Back up only code that may be replaced. Live leads/content have separate backups.
backup_dir="$home/gocamp-deploy-backups"
mkdir -p -- "$backup_dir"
chmod 0700 "$backup_dir"
archive="$backup_dir/code-$(date -u +%Y%m%dT%H%M%SZ)-$$.tar.gz"
existing=()
for file in "${root_files[@]}"; do
  [[ -e "$target/$file" || -L "$target/$file" ]] && existing+=("$file")
done
for dir in "${code_dirs[@]}"; do
  [[ -e "$target/$dir" || -L "$target/$dir" ]] && existing+=("$dir")
done
if (( ${#existing[@]} > 0 )); then
  tar -czf "$archive" -C "$target" -- "${existing[@]}" ||
    fail "Could not create application-code backup; deployment stopped."
else
  fail "No existing application code to back up; refusing first deployment."
fi
chmod 0600 "$archive"

# Publish application code. Never recursively sync the data directory.
for file in "${root_files[@]}"; do
  install -m 0644 -- "$repo/$file" "$target/$file"
done
for dir in "${code_dirs[@]}"; do
  while IFS= read -r -d '' src; do
    rel="${src#"$repo/"}"
    dest="$target/$rel"
    mkdir -p -- "$(dirname -- "$dest")"
    install -m 0644 -- "$src" "$dest"
  done < <(find "$repo/$dir" -type f -print0)
done

# Seed missing data only. Never replace edits performed in the live admin panel.
mkdir -p -- "$target/data" "$target/uploads" "$target/images"
for file in "${protected_data[@]}"; do
  if [[ ! -e "$target/data/$file" && ! -L "$target/data/$file" ]]; then
    install -m 0644 -- "$repo/data/$file" "$target/data/$file"
  fi
done

# Repository static images and admin uploads currently share images/.
# Copy new images ONLY, so existing admin-uploaded media remains intact.
while IFS= read -r -d '' src; do
  rel="${src#"$repo/images/"}"
  dest="$target/images/$rel"
  if [[ ! -e "$dest" && ! -L "$dest" ]]; then
    mkdir -p -- "$(dirname -- "$dest")"
    install -m 0644 -- "$src" "$dest"
  fi
done < <(find "$repo/images" -type f -print0)

# Never touch data/inquiries/, uploads/, or other live-only files.
printf 'GoCamp code deployed to %s; live data and existing images preserved.\n' "$target"
printf 'Pre-deployment code backup: %s\n' "$archive"
