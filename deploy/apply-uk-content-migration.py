#!/usr/bin/env python3
"""Reviewed catalog migration/reconciliation for isolated development hosts.

prepare: securely download runtime PHP catalogs, merge only reviewed records,
         and create an encrypted rollback archive for GitHub Actions artifacts.
apply:   verify downloaded live content is unchanged, upload staged catalogs,
         roll back on any error, then store a completion marker for one-shot scopes.
Do not copy credentials, backup contents, or runtime data into logs.
"""
from __future__ import annotations

from ftplib import FTP, FTP_TLS, error_perm
from io import BytesIO
import hashlib
import json
import os
from pathlib import Path
import secrets
import ssl
import subprocess
import sys
import tarfile

FILES = ("all_programs.php", "programs.php", "destinations.php")
MIGRATION_SCOPE = os.environ.get("GOCAMP_CATALOG_MIGRATION", "uk-catalog")
FTPS_TARGET = os.environ.get("GOCAMP_FTPS_TARGET", "infinityfree")
if FTPS_TARGET not in ("infinityfree", "cpanel-staging"):
    raise RuntimeError("Unrecognised FTPS deployment target")
if FTPS_TARGET == "cpanel-staging" and MIGRATION_SCOPE != "reconcile":
    raise RuntimeError("cPanel staging supports only reviewed recurring reconciliation")
SCOPES = {
    "uk-catalog": (
        "/htdocs/.gocamp-uk-catalog-migrated-20261017",
        b"uk-catalog-20261017\n",
        "gocamp-uk-catalog",
        "apply-uk-catalog.php",
    ),
    "academic-copy": (
        "/htdocs/.gocamp-academic-copy-migrated-20261017",
        b"academic-copy-20261017\n",
        "gocamp-academic-copy",
        "apply-academic-copy.php",
    ),
    "reconcile": (
        "/htdocs/.gocamp-reconcile-unused",
        b"reconcile-unused\n",
        "gocamp-reconcile",
        "apply-reconcile.php",
    ),
    "germany-language": (
        "/htdocs/.gocamp-germany-language-migrated-20261019",
        b"germany-language-20261019\n",
        "gocamp-germany-language",
        "apply-germany-language.php",
    ),
    "soccer-images": (
        "/htdocs/.gocamp-soccer-images-migrated-20261017",
        b"soccer-images-20261017\n",
        "gocamp-soccer-images",
        "apply-soccer-images.php",
    ),
}
if MIGRATION_SCOPE not in SCOPES:
    raise RuntimeError("Unrecognised reviewed migration scope")
MARKER, MARKER_CONTENT, WORK_NAME, PHP_MIGRATOR = SCOPES[MIGRATION_SCOPE]
DIRECTORY = "/data" if FTPS_TARGET == "cpanel-staging" else "/htdocs/data"
MAX_FILE = 5 * 1024 * 1024
WORK = Path(os.environ.get("RUNNER_TEMP", "/tmp")) / (
    "gocamp-cpanel-reconcile" if FTPS_TARGET == "cpanel-staging" else WORK_NAME
)
ROOT = Path(__file__).resolve().parents[1]
MIGRATOR = ROOT / "deploy" / "migrations" / PHP_MIGRATOR
AAD = b"GoCamp development catalog 2026-10-17"


def connect() -> FTP:
    if FTPS_TARGET == "cpanel-staging":
        user = os.environ.get("CPANEL_STAGING_FTP_USERNAME")
        password = os.environ.get("CPANEL_STAGING_FTP_PASSWORD")
        host = os.environ.get("CPANEL_STAGING_FTP_HOST", "").strip()
        if not user or not password or not host or "/" in host or ":" in host or ".." in host:
            raise RuntimeError("Missing or invalid cPanel staging FTPS credentials")
        port = 21
    else:
        user = os.environ.get("INFINITYFREE_FTP_USERNAME")
        password = os.environ.get("INFINITYFREE_FTP_PASSWORD")
        host = os.environ.get("INFINITYFREE_FTP_HOST", "ftpupload.net")
        if not user or not password or host != "ftpupload.net":
            raise RuntimeError("Missing InfinityFree development FTPS secrets or unexpected FTP host")
        port = int(os.environ.get("INFINITYFREE_FTP_PORT", "21"))
    # Only the cPanel staging target can opt into insecure plaintext FTP.
    mode = (os.environ.get("CPANEL_STAGING_FTP_MODE", "tls").strip().lower()
            if FTPS_TARGET == "cpanel-staging" else "tls")
    if mode not in ("tls", "plaintext"):
        raise RuntimeError("Unrecognised cPanel staging FTP mode")
    if mode == "tls":
        context = ssl.create_default_context()
        context.minimum_version = ssl.TLSVersion.TLSv1_2
        ftp = FTP_TLS(context=context, timeout=50)
    else:
        print("WARNING: staging catalog transfers use unencrypted FTP.", file=sys.stderr)
        ftp = FTP(timeout=50)
    ftp.connect(host, port)
    ftp.login(user, password)
    if mode == "tls":
        ftp.prot_p()
    ftp.set_pasv(True)
    return ftp


def remote_get(ftp: FTP_TLS, path: str) -> bytes:
    data = bytearray()

    def collect(block: bytes) -> None:
        data.extend(block)
        if len(data) > MAX_FILE:
            raise RuntimeError("Oversized remote catalog; aborting")

    ftp.retrbinary("RETR " + path, collect)
    return bytes(data)


def marker_exists(ftp: FTP_TLS) -> bool:
    if MIGRATION_SCOPE == "reconcile":
        return False  # Re-run diff-based reconciliation on every deployment.
    try:
        data = remote_get(ftp, MARKER)
    except error_perm as exc:
        if str(exc).startswith("550"):
            return False
        raise
    if data != MARKER_CONTENT:
        raise RuntimeError("Unexpected migration marker contents; manual review required")
    return True


def store(ftp: FTP_TLS, path: str, data: bytes) -> None:
    ftp.storbinary("STOR " + path, BytesIO(data), blocksize=256 * 1024)


def encrypt_backup(originals: dict[str, bytes], password: str) -> bytes:
    # Public GitHub repositories should NEVER publish unencrypted FTP snapshots.
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM

    plain = BytesIO()
    with tarfile.open(fileobj=plain, mode="w:gz") as archive:
        for name, content in originals.items():
            info = tarfile.TarInfo(name=name)
            info.size = len(content)
            info.mode = 0o600
            archive.addfile(info, BytesIO(content))
    salt = secrets.token_bytes(16)
    nonce = secrets.token_bytes(12)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 500_000, dklen=32)
    return b"GOCAMPFTPS1" + salt + nonce + AESGCM(key).encrypt(nonce, plain.getvalue(), AAD)


def prepare() -> None:
    live = WORK / "live"
    stage = WORK / "staged"
    live.mkdir(parents=True, exist_ok=True)
    stage.mkdir(parents=True, exist_ok=True)
    with connect() as ftp:
        if marker_exists(ftp):
            (WORK / "skip").write_text("already-applied", encoding="ascii")
            print("Reviewed UK catalog migration already applied; no changes made.")
            return
        originals = {}
        for name in FILES:
            contents = remote_get(ftp, DIRECTORY + "/" + name)
            originals[name] = contents
            (live / name).write_bytes(contents)
    proc = subprocess.run(["php", str(MIGRATOR), str(ROOT), str(live), str(stage)],
                          check=True, capture_output=True, text=True)
    plan = json.loads(proc.stdout.strip())
    changed = plan["changed"]
    if not set(changed).issubset(FILES):
        raise RuntimeError("Unexpected migration output paths")
    for name in changed:
        subprocess.run(["php", "-l", str(stage / name)], check=True,
                       capture_output=True, text=True)
    hashes = {name: hashlib.sha256(blob).hexdigest() for name, blob in originals.items()}
    (WORK / "manifest.json").write_text(json.dumps({"changed": changed, "hashes": hashes}), encoding="utf-8")
    (WORK / "backup.enc").write_bytes(encrypt_backup(
        originals,
        os.environ["CPANEL_STAGING_FTP_PASSWORD"] if FTPS_TARGET == "cpanel-staging"
        else os.environ["INFINITYFREE_FTP_PASSWORD"],
    ))
    print(f"Reviewed development catalog merge prepared: {len(changed)} data file(s) changed. "
          "An encrypted rollback artifact must be saved before applying. "
          "Other admin-edited content remains intact.")


def apply() -> None:
    if (WORK / "skip").exists():
        print("Catalog migration previously completed; no upload.")
        return
    manifest = json.loads((WORK / "manifest.json").read_text(encoding="utf-8"))
    changed = manifest["changed"]
    originals = {name: (WORK / "live" / name).read_bytes() for name in FILES}
    stage = {name: (WORK / "staged" / name).read_bytes() for name in changed}
    if not (WORK / "backup.enc").is_file():
        raise RuntimeError("Missing encrypted rollback backup; refusing to upload")
    with connect() as ftp:
        if marker_exists(ftp):
            print("Migration already applied in another run; skipping.")
            return
        # Avoid overwriting changes an admin made after preparation.
        for name in FILES:
            current = remote_get(ftp, DIRECTORY + "/" + name)
            digest = hashlib.sha256(current).hexdigest()
            if digest != manifest["hashes"][name]:
                raise RuntimeError("Admin data changed during migration: " + name + ". No files uploaded.")
        touched = []
        try:
            for name in changed:
                touched.append(name)  # Includes an interrupted STOR for rollback.
                store(ftp, DIRECTORY + "/" + name, stage[name])
                if hashlib.sha256(remote_get(ftp, DIRECTORY + "/" + name)).digest() != hashlib.sha256(stage[name]).digest():
                    raise RuntimeError("Uploaded catalog verification failed for " + name)
            if MIGRATION_SCOPE != "reconcile":
                store(ftp, MARKER, MARKER_CONTENT)
        except Exception:
            restored = []
            for name in reversed(touched):
                try:
                    store(ftp, DIRECTORY + "/" + name, originals[name])
                    restored.append(name)
                except Exception as rollback_error:
                    print(f"URGENT: automatic rollback failed for {name}: {type(rollback_error).__name__}",
                          file=sys.stderr)
            print(f"Migration failed; restored {len(restored)} of {len(touched)} touched files.",
                  file=sys.stderr)
            raise
    print(f"Applied and verified {len(changed)} reviewed catalog changes on {FTPS_TARGET}. "
          "Production remains untouched.")


def main() -> None:
    if len(sys.argv) != 2 or sys.argv[1] not in ("prepare", "apply"):
        raise SystemExit("Usage: python apply-uk-content-migration.py prepare|apply")
    {"prepare": prepare, "apply": apply}[sys.argv[1]]()


if __name__ == "__main__":
    try:
        main()
    except (OSError, RuntimeError, ValueError, subprocess.CalledProcessError,
            error_perm, json.JSONDecodeError) as exc:
        print("Development catalog migration blocked: " + str(exc).splitlines()[0], file=sys.stderr)
        sys.exit(1)
