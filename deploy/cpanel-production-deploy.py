#!/usr/bin/env python3
"""Fail-closed cPanel production FTPS deploy with an encrypted pre-deploy backup.

Requires a dedicated FTP login jailed to the exact production website document
root; '/' on that login MUST NOT be the hosting account's shared directory.
Never falls back to unencrypted FTP or deletes live data/uploads.
"""
from __future__ import annotations

import argparse
from collections import defaultdict
from ftplib import FTP_TLS, error_perm
from io import BytesIO
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import secrets
import ssl
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]
STAGE = Path(os.environ.get("RUNNER_TEMP", "/tmp")) / "gocamp-cpanel-production"
ROOT_CODE = frozenset({
    ".htaccess", "404.php", "about_us.php", "contact_us.php", "faq.php",
    "home.php", "index.php", "init.php", "landing.php", "gallery.php",
})
CODE_DIRS = frozenset({
    "admin", "api", "css", "destination", "includes", "js", "program", "sections",
})
CODE_EXTS = frozenset({".php", ".js", ".css"})
DATA_SEEDS = frozenset({
    "data/all_programs.php", "data/programs.php", "data/destinations.php",
    "data/site_settings.php", "data/faq.json", "data/camp_memories.php",
})
IMAGE_EXTS = frozenset({".webp", ".jpg", ".jpeg", ".png", ".svg", ".gif", ".ico"})
MAX_CODE_BYTES = 10 * 1024 * 1024
AAD = b"GoCamp cPanel production backup v1"


def uploads(root: Path = ROOT) -> list[tuple[str, Path, bool]]:
    result = []
    for path in root.rglob("*"):
        if not path.is_file() or path.is_symlink():
            continue
        rel = path.relative_to(root)
        name = rel.as_posix()
        parts = rel.parts
        if len(parts) == 1 and name in ROOT_CODE:
            overwrite = True
        elif name in DATA_SEEDS:
            overwrite = False
        elif parts[0] == "images" and path.suffix.lower() in IMAGE_EXTS:
            overwrite = False
        elif parts[0] in CODE_DIRS and (path.suffix.lower() in CODE_EXTS or
                                         name == "admin/placeholder-image.png"):
            overwrite = name != "admin/placeholder-image.png"
        else:
            continue
        result.append((name, path, overwrite))
    names = {name for name, _, _ in result}
    required = {".htaccess", "index.php", "init.php", "home.php",
                "data/programs.php", "data/destinations.php", "data/all_programs.php"}
    if not required <= names:
        raise RuntimeError("Required app files missing: " + ", ".join(sorted(required - names)))
    return sorted(result)


def configuration() -> tuple[str, str, str]:
    host = os.environ.get("CPANEL_PRODUCTION_FTP_HOST", "").strip()
    user = os.environ.get("CPANEL_PRODUCTION_FTP_USERNAME", "")
    password = os.environ.get("CPANEL_PRODUCTION_FTP_PASSWORD", "")
    if not host or not user or not password:
        raise RuntimeError("Missing production FTPS host, username or password")
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9.-]*", host) or ".." in host:
        raise RuntimeError("Invalid FTP server hostname")
    return host, user, password


def connect() -> FTP_TLS:
    host, user, password = configuration()
    context = ssl.create_default_context()
    context.minimum_version = ssl.TLSVersion.TLSv1_2
    ftp = FTP_TLS(context=context, timeout=45)
    try:
        ftp.connect(host, 21)
        ftp.login(user, password)
        ftp.prot_p()
        ftp.set_pasv(True)
        ftp.cwd("/")
    except Exception:
        ftp.close()
        raise
    return ftp


def remote_read(ftp: FTP_TLS, name: str) -> bytes | None:
    data = bytearray()
    def collect(block: bytes) -> None:
        data.extend(block)
        if len(data) > MAX_CODE_BYTES:
            raise RuntimeError("Remote code file exceeds backup limit: " + name)
    try:
        ftp.retrbinary("RETR /" + name, collect)
    except error_perm as exc:
        if str(exc).startswith("550") and not data:
            return None
        raise
    return bytes(data)


def derive_key(password: str, salt: bytes) -> bytes:
    return hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 500_000, 32)


def encrypted_backup(originals: dict[str, bytes], password: str) -> bytes:
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    buffer = BytesIO()
    with zipfile.ZipFile(buffer, "w", compression=zipfile.ZIP_DEFLATED) as z:
        for path, content in sorted(originals.items()):
            z.writestr(path, content)
    salt, nonce = secrets.token_bytes(16), secrets.token_bytes(12)
    encrypted = AESGCM(derive_key(password, salt)).encrypt(nonce, buffer.getvalue(), AAD)
    return b"GOCAMPPROD1" + salt + nonce + encrypted


def original_hashes(ftp: FTP_TLS, items: list[tuple[str, Path, bool]]):
    hashes = {}
    originals = {}
    for name, _, overwrite in items:
        if not overwrite:
            continue
        content = remote_read(ftp, name)
        hashes[name] = hashlib.sha256(content).hexdigest() if content is not None else None
        if content is not None:
            originals[name] = content
    return hashes, originals


def prepare(items: list[tuple[str, Path, bool]]) -> None:
    _, _, password = configuration()
    STAGE.mkdir(parents=True, exist_ok=True)
    with connect() as ftp:
        hashes, originals = original_hashes(ftp, items)
    manifest = {
        "git_sha": os.environ.get("GITHUB_SHA", ""),
        "hashes": hashes,
        "files": {name: hashlib.sha256(path.read_bytes()).hexdigest()
                  for name, path, _ in items},
    }
    (STAGE / "manifest.json").write_text(json.dumps(manifest), encoding="utf-8")
    (STAGE / "backup.enc").write_bytes(encrypted_backup(originals, password))
    print(f"Encrypted production rollback backup prepared for {len(originals)} "
          "existing code files. Existing catalogs, uploads and images are protected.")


def enter_directory(ftp: FTP_TLS, folder: PurePosixPath) -> None:
    ftp.cwd("/")
    for part in folder.parts:
        if part in ("", "."):
            continue
        if part in ("..", "/"):
            raise ValueError("Unsafe FTP path")
        try:
            ftp.cwd(part)
        except error_perm as exc:
            if not str(exc).startswith("550"):
                raise
            ftp.mkd(part)
            ftp.cwd(part)


def remote_names(ftp: FTP_TLS) -> set[str]:
    try:
        return {PurePosixPath(name.rstrip("/")).name for name in ftp.nlst()
                if name not in (".", "..")}
    except error_perm as exc:
        if str(exc).startswith("550") and "no files" in str(exc).lower():
            return set()
        raise


def apply(items: list[tuple[str, Path, bool]]) -> None:
    manifest_file = STAGE / "manifest.json"
    backup_file = STAGE / "backup.enc"
    if not manifest_file.is_file() or not backup_file.is_file():
        raise RuntimeError("Missing manifest or encrypted backup; refusing production upload")
    manifest = json.loads(manifest_file.read_text(encoding="utf-8"))
    if manifest["git_sha"] != os.environ.get("GITHUB_SHA", ""):
        raise RuntimeError("Deploy commit does not match backup manifest")
    for name, path, _ in items:
        if hashlib.sha256(path.read_bytes()).hexdigest() != manifest["files"].get(name):
            raise RuntimeError("Source files changed since backup preparation: " + name)

    # Keep plaintext only in this isolated, ephemeral runner while applying.
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    _, _, password = configuration()
    cipher = backup_file.read_bytes()
    if not cipher.startswith(b"GOCAMPPROD1"):
        raise RuntimeError("Invalid encrypted rollback artifact")
    offset = len(b"GOCAMPPROD1")
    salt, nonce = cipher[offset:offset+16], cipher[offset+16:offset+28]
    plain = AESGCM(derive_key(password, salt)).decrypt(nonce, cipher[offset+28:], AAD)
    with zipfile.ZipFile(BytesIO(plain)) as zipbuf:
        originals = {n: zipbuf.read(n) for n in zipbuf.namelist()}
    changed = []
    uploaded = preserved = 0
    with connect() as ftp:
        # Check that no one changed production code between backup and deploy.
        for name, expected in manifest["hashes"].items():
            current = remote_read(ftp, name)
            actual = hashlib.sha256(current).hexdigest() if current is not None else None
            if actual != expected:
                raise RuntimeError("Production code changed since backup: " + name)
        groups = defaultdict(list)
        for item in items:
            groups[PurePosixPath(item[0]).parent].append(item)
        try:
            for directory, files in sorted(groups.items(), key=lambda g: str(g[0])):
                enter_directory(ftp, directory)
                existing = remote_names(ftp)
                for name, path, overwrite in files:
                    leaf = PurePosixPath(name).name
                    if not overwrite and leaf in existing:
                        preserved += 1
                        continue
                    # Record before STOR, so partial transfers are restored.
                    if overwrite:
                        changed.append(name)
                    with path.open("rb") as handle:
                        ftp.storbinary("STOR " + leaf, handle, blocksize=256 * 1024)
                    uploaded += 1
                    existing.add(leaf)
                    if overwrite:
                        check = remote_read(ftp, name)
                        if check is None or hashlib.sha256(check).hexdigest() != manifest["files"][name]:
                            raise RuntimeError("Upload verification failed: " + name)
        except Exception:
            restored = 0
            for name in reversed(changed):
                try:
                    if name in originals:
                        ftp.storbinary("STOR /" + name, BytesIO(originals[name]))
                    else:
                        ftp.delete("/" + name)
                    restored += 1
                except Exception as rollback_error:
                    print("URGENT: rollback failed for " + name + ": " +
                          type(rollback_error).__name__, file=sys.stderr)
            print(f"Production deployment failed; rolled back {restored}/{len(changed)} "
                  "changed code files. Verify health before retrying.", file=sys.stderr)
            raise
    print(f"Production deploy complete: uploaded {uploaded}; preserved {preserved} "
          "existing runtime/data/media files. No remote directory synchronization or deletion.")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("operation", choices=("check", "prepare", "apply"))
    args = parser.parse_args()
    items = uploads()
    if args.operation == "check":
        with connect() as ftp:
            ftp.pwd()
        print(f"FTPS preflight succeeded; {len(items)} allowlisted files (no upload).")
    elif args.operation == "prepare":
        prepare(items)
    else:
        apply(items)


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, RuntimeError, KeyError, error_perm, ssl.SSLError,
            zipfile.BadZipFile) as exc:
        print("cPanel production deployment FAILED: " + str(exc).splitlines()[0],
              file=sys.stderr)
        sys.exit(1)
