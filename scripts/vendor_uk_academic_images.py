#!/usr/bin/env python3
"""Vendor academic program CDN images into existing images/ and rewrite references.
Run only when reviewing/updating the UK academic catalog. Does not deploy.
"""
from __future__ import annotations
import io
import re
import sys
import urllib.request
from pathlib import Path
from PIL import Image, ImageOps
import pillow_avif  # noqa: F401 — registers the AVIF codec with Pillow

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "data" / "all_programs.php"
OUT_DIR = ROOT / "images"
PATTERN = re.compile(
    r"(?P<entry>  '(?P<id>uk-academic-[a-z0-9-]+)' =>\\s*array \\([\\s\\S]*?^  \\),)",
    re.MULTILINE,
)
IMAGE = re.compile(r"(?P<prefix>'image' => )'(?P<url>https?://[^']+)'")
ALLOWED_HOSTS = {"cdn.prod.website-files.com"}
OUT_DIR.mkdir(parents=True, exist_ok=True)
source = CATALOG.read_text(encoding="utf-8")
changed = 0
failures: list[str] = []

def replace_entry(match: re.Match) -> str:
    global changed
    block = match.group("entry")
    image_match = IMAGE.search(block)
    if not image_match:
        return block
    url = image_match.group("url")
    from urllib.parse import urlparse
    if urlparse(url).hostname not in ALLOWED_HOSTS:
        failures.append(f"{match.group('id')}: unapproved image source")
        return block
    target = OUT_DIR / f"{match.group('id')}.webp"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (compatible; GoCampImageSync/1.0)", "Accept": "image/avif,image/webp,image/*"})
        with urllib.request.urlopen(req, timeout=30) as response:
            data = response.read(15 * 1024 * 1024 + 1)
            if len(data) > 15 * 1024 * 1024:
                raise ValueError("Source image exceeds 15 MB")
        with Image.open(io.BytesIO(data)) as im:
            im = ImageOps.exif_transpose(im)
            im.thumbnail((1600, 1000), Image.Resampling.LANCZOS)
            if im.mode not in ("RGB", "RGBA"):
                im = im.convert("RGB")
            if im.mode == "RGBA":
                background = Image.new("RGB", im.size, "#ffffff")
                background.paste(im, mask=im.getchannel("A"))
                im = background
            im.save(target, "WEBP", quality=83, method=6)
        if target.stat().st_size < 2048:
            raise ValueError("Image output suspiciously small")
        changed += 1
        print(f"Saved {target.relative_to(ROOT)} ({target.stat().st_size} bytes)")
        return block[:image_match.start("url")] + "/" + target.relative_to(ROOT).as_posix() + block[image_match.end("url"):]
    except Exception as exc:
        target.unlink(missing_ok=True)
        failures.append(f"{match.group('id')}: {exc}")
        return block

updated = PATTERN.sub(replace_entry, source)
if failures:
    for error in failures:
        print(error, file=sys.stderr)
    raise SystemExit("One or more academic images failed; data file unchanged")
if changed == 0:
    print("No remaining external academic cover images")
else:
    CATALOG.write_text(updated, encoding="utf-8")
    print(f"Updated {changed} program cover image references")
