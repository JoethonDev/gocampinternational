#!/usr/bin/env bash
# Optional scheduled pull: run via cPanel Cron Jobs after a manual test.
set -Eeuo pipefail
repo="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd -P)"

command -v git >/dev/null || { echo 'Git command not available in Cron Jobs' >&2; exit 1; }
command -v flock >/dev/null || { echo 'flock command not available in Cron Jobs' >&2; exit 1; }

# Prevent concurrent pulls and deployments.
exec 9>"${HOME:?}/.gocamp-deployment-cron.lock"
flock -n 9 || exit 0
cd -- "$repo"
[[ -z "$(git status --porcelain)" ]] || { echo 'Uncommitted repo changes; stopping' >&2; exit 1; }
[[ "$(git branch --show-current)" == "main" ]] || { echo 'Expected main branch' >&2; exit 1; }

before="$(git rev-parse HEAD)"
git fetch --quiet origin main
upstream="$(git rev-parse origin/main)"
[[ "$before" != "$upstream" ]] || exit 0

# Refuse to discard local changes or rewrite history.
git merge --ff-only origin/main
[[ -z "$(git status --porcelain)" ]] || { echo 'Working tree is dirty; stopping' >&2; exit 1; }

# Use cPanel's normal deployment task (keeps its deployment history).
if command -v uapi >/dev/null 2>&1; then
  uapi VersionControlDeployment create "repository_root=$repo"
elif [[ -x /usr/local/cpanel/bin/uapi ]]; then
  /usr/local/cpanel/bin/uapi VersionControlDeployment create "repository_root=$repo"
else
  echo 'cPanel UAPI not available to Cron Jobs' >&2
  exit 1
fi
