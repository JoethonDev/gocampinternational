#!/usr/bin/env python3
"""Deploy the develop branch to an isolated cPanel staging FTP account.

Requires a dedicated FTP account whose home directory is exactly the staging
subdomain's document root. The account must NOT be able to access production.
Reuses the tested InfinityFree allowlist and preservation behavior.
"""
from __future__ import annotations

import argparse
from ftplib import FTP_TLS, error_perm
import importlib.util
import os
from pathlib import Path
import re
import ssl
import sys


def load_deployment_rules():
    path = Path(__file__).with_name("infinityfree-deploy.py")
    spec = importlib.util.spec_from_file_location("gocamp_allowlisted_ftps", path)
    if spec is None or spec.loader is None:
        raise RuntimeError("Unable to load the tested FTPS deployment rules")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def staging_config() -> tuple[str, str, str]:
    host = os.environ.get("CPANEL_STAGING_FTP_HOST", "").strip()
    username = os.environ.get("CPANEL_STAGING_FTP_USERNAME", "")
    password = os.environ.get("CPANEL_STAGING_FTP_PASSWORD", "")
    if not host or not username or not password:
        raise RuntimeError("Missing cPanel staging FTPS host, username or password")
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9.-]*", host) or ".." in host:
        raise RuntimeError("Invalid staging FTP host: use the server hostname without a protocol or path")
    return host, username, password


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true",
                        help="Authenticate and display the upload plan without changing remote files")
    args = parser.parse_args()
    host, username, password = staging_config()
    rules = load_deployment_rules()
    uploads = rules.build_uploads()
    print(f"Prepared {len(uploads)} allowlisted GoCamp files for cPanel staging; no deletions.")
    context = ssl.create_default_context()
    context.minimum_version = ssl.TLSVersion.TLSv1_2
    with FTP_TLS(context=context, timeout=45) as ftp:
        ftp.connect(host, 21)
        ftp.login(username, password)
        ftp.prot_p()
        ftp.set_pasv(True)
        # '/' is the staging subdomain document root for the dedicated jailed account.
        # Do not use a cPanel/primary FTP login here: it may point at production.
        ftp.cwd("/")
        uploaded, preserved = rules.deploy(ftp, uploads, "/", args.dry_run)
    print(f"Staging {'dry-run' if args.dry_run else 'deployment'} complete: "
          f"uploaded {uploaded}, preserved {preserved} existing files.")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (OSError, ValueError, RuntimeError, error_perm) as exc:
        print("cPanel staging FTPS FAILED: " + str(exc).splitlines()[0], file=sys.stderr)
        sys.exit(1)
