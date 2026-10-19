#!/usr/bin/env python3
"""GoCamp -> InfinityFree development. Explicit FTPS. No deletion of live data."""
from __future__ import annotations

import argparse
from collections import defaultdict
from dataclasses import dataclass
from ftplib import FTP_TLS, error_perm
import os
from pathlib import Path, PurePosixPath
import ssl
import sys

REPO_ROOT = Path(__file__).resolve().parents[1]
ROOT_CODE = frozenset({
    '.htaccess', '404.php', 'about_us.php', 'contact_us.php', 'faq.php',
    'home.php', 'index.php', 'init.php', 'landing.php', 'gallery.php',
})
CODE_DIRS = frozenset({'admin', 'api', 'css', 'destination', 'includes', 'js', 'program', 'sections'})
CODE_EXTENSIONS = frozenset({'.php', '.js', '.css'})
DATA_SEEDS = frozenset({
    'data/all_programs.php', 'data/destinations.php', 'data/faq.json',
    'data/programs.php', 'data/site_settings.php', 'data/camp_memories.php',
})
IMAGE_EXTENSIONS = frozenset({'.webp', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.ico'})


@dataclass(frozen=True)
class Upload:
    relpath: PurePosixPath
    source: Path
    overwrite: bool


def build_uploads(repo_root: Path = REPO_ROOT) -> list[Upload]:
    """Use an explicit web-file allowlist, not recursive git/FTP mirroring."""
    uploads: list[Upload] = []
    for item in repo_root.rglob('*'):
        if not item.is_file() or item.is_symlink():
            continue
        rel = item.relative_to(repo_root)
        name = rel.as_posix()
        parts = rel.parts
        if len(parts) == 1 and name in ROOT_CODE:
            uploads.append(Upload(PurePosixPath(name), item, True))
        elif name in DATA_SEEDS:
            uploads.append(Upload(PurePosixPath(name), item, False))
        elif parts[0] == 'images' and item.suffix.lower() in IMAGE_EXTENSIONS:
            uploads.append(Upload(PurePosixPath(name), item, False))
        elif parts[0] in CODE_DIRS:
            is_asset = name == 'admin/placeholder-image.png'
            if item.suffix.lower() in CODE_EXTENSIONS or is_asset:
                uploads.append(Upload(PurePosixPath(name), item, not is_asset))
    result = sorted(uploads, key=lambda u: str(u.relpath))
    missing = set(ROOT_CODE | DATA_SEEDS) - {u.relpath.as_posix() for u in result}
    if missing:
        raise RuntimeError('Required source file(s) missing: ' + ', '.join(sorted(missing)))
    return result


def remote_entry_names(ftp: FTP_TLS) -> set[str]:
    """Fail closed on FTP listing errors instead of risking content overwrites."""
    try:
        return {PurePosixPath(x.rstrip('/')).name for x in ftp.nlst() if x not in ('.', '..')}
    except error_perm as exc:
        if str(exc).startswith('550') and 'no files' in str(exc).lower():
            return set()
        raise RuntimeError(f'Cannot verify remote files: {exc}') from exc


def enter_dir(ftp: FTP_TLS, site_root: str, relative: PurePosixPath) -> bool:
    """Return True if a segment was just created (and must therefore be empty)."""
    ftp.cwd(site_root)
    created = False
    for part in relative.parts:
        if part in ('', '.'):
            continue
        if part in ('..', '/'):
            raise ValueError('Unsafe deployment path')
        try:
            ftp.cwd(part)
        except error_perm:
            ftp.mkd(part)
            ftp.cwd(part)
            created = True
    return created


def deploy(ftp: FTP_TLS, uploads: list[Upload], base_dir: str,
           dry_run: bool) -> tuple[int, int]:
    if not base_dir.startswith('/') or '..' in PurePosixPath(base_dir).parts:
        raise ValueError('FTPS destination must be an absolute safe path')
    ftp.cwd(base_dir)
    root = ftp.pwd()
    grouped: dict[PurePosixPath, list[Upload]] = defaultdict(list)
    for upload in uploads:
        grouped[upload.relpath.parent].append(upload)
    count = skipped = 0
    for folder, files in sorted(grouped.items(), key=lambda kv: str(kv[0])):
        if dry_run:
            print(f'DRY RUN {folder}: {len(files)} candidate files; no changes')
            continue
        created = enter_dir(ftp, root, folder)
        existing = set() if created else remote_entry_names(ftp)
        for upload in files:
            name = upload.relpath.name
            if not upload.overwrite and name in existing:
                skipped += 1
                continue
            with upload.source.open('rb') as handle:
                ftp.storbinary('STOR ' + name, handle, blocksize=256 * 1024)
            existing.add(name)
            count += 1
            print(f'Uploaded {upload.relpath.as_posix()}')
    return count, skipped


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()
    username = os.environ.get('INFINITYFREE_FTP_USERNAME')
    password = os.environ.get('INFINITYFREE_FTP_PASSWORD')
    hostname = os.environ.get('INFINITYFREE_FTP_HOST', 'ftpupload.net')
    destination = os.environ.get('INFINITYFREE_FTP_DIRECTORY', '/htdocs/')
    port = int(os.environ.get('INFINITYFREE_FTP_PORT', '21'))
    if not username or not password:
        raise RuntimeError('Missing InfinityFree FTPS credentials in GitHub environment secrets.')
    uploads = build_uploads()
    print(f'Prepared {len(uploads)} allowlisted files for development; no remote deletes.')
    if hostname != 'ftpupload.net':
        raise RuntimeError('Host must be ftpupload.net (TLS certificate validation).')
    context = ssl.create_default_context()
    context.minimum_version = ssl.TLSVersion.TLSv1_2
    with FTP_TLS(context=context, timeout=35) as ftp:
        ftp.connect(hostname, port)
        ftp.login(username, password)
        ftp.prot_p()
        ftp.set_pasv(True)
        uploaded, preserved = deploy(ftp, uploads, destination, args.dry_run)
    print(f'Complete: uploaded {uploaded}, preserved {preserved} existing runtime files/assets.')
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except (OSError, ValueError, RuntimeError, error_perm) as exc:
        print(f'InfinityFree deployment FAILED: {exc}', file=sys.stderr)
        sys.exit(1)
