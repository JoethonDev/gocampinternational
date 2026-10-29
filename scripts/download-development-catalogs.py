#!/usr/bin/env python3
"""Read-only FTPS snapshot of public catalog data from the development host.

Never downloads uploads/, inquiries/, credentials or any arbitrary paths.
"""
from ftplib import FTP_TLS
from pathlib import Path
import os
import ssl
import sys

REQUIRED = ("all_programs.php", "programs.php", "destinations.php")
OPTIONAL = ("site_settings.php", "camp_memories.php", "faq.json")

def main() -> None:
    user = os.environ.get("INFINITYFREE_FTP_USERNAME")
    password = os.environ.get("INFINITYFREE_FTP_PASSWORD")
    if not user or not password:
        raise RuntimeError("Development FTPS credentials not available; refusing to sync")
    target = Path(os.environ["GOCAMP_SYNC_DIR"]).resolve()
    target.mkdir(parents=True, exist_ok=True)
    tls = ssl.create_default_context()
    tls.minimum_version = ssl.TLSVersion.TLSv1_2
    with FTP_TLS(context=tls, timeout=45) as ftp:
        ftp.connect("ftpupload.net", 21)
        ftp.login(user, password)
        ftp.prot_p()
        ftp.set_pasv(True)
        ftp.cwd("/htdocs/data")
        for name in REQUIRED + OPTIONAL:
            tmp = target / (name + ".download")
            try:
                with tmp.open("wb") as out:
                    ftp.retrbinary("RETR " + name, out.write, blocksize=131072)
                if tmp.stat().st_size < 4 or tmp.stat().st_size > 15_000_000:
                    raise ValueError("Invalid/oversized public catalog " + name)
                tmp.rename(target / name)
                print("Retrieved hosted data/" + name + " (content withheld)")
            except Exception:
                tmp.unlink(missing_ok=True)
                if name in REQUIRED:
                    raise
                print("Optional hosted catalog unavailable: " + name)
    print("Development hosting catalog snapshot complete (read-only)")

if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print("Hosting sync blocked: " + str(exc), file=sys.stderr)
        sys.exit(1)
