#!/usr/bin/env python3
"""Import external CDN image references from GoCamp PHP data files.

Works on any checkout (main, develop, or a feature branch); does NOT deploy.
Existing local image references and uploaded admin media are left untouched.
Only approved HTTPS CDN hosts are fetched. Re-running is idempotent.
"""
from __future__ import annotations

import hashlib
import io
import os
import re
import sys
import tempfile
import urllib.request
from pathlib import Path
from urllib.parse import urlparse

from PIL import Image, ImageOps
import pillow_avif  # noqa: F401 - register AVIF decoding

ROOT = Path(__file__).resolve().parents[1]
DATA = [ROOT / "data" / n for n in ("all_programs.php", "destinations.php", "programs.php")]
MEDIA_DIR = ROOT / "images"
ALLOWED_HOSTS = {
    "cdn.prod.website-files.com",
    "images.unsplash.com",
    "images.pexels.com",
}
ALLOWED_HOSTS.update(x.strip().lower() for x in os.environ.get("IMAGE_IMPORT_EXTRA_HOSTS", "").split(",") if x.strip())
MAX_BYTES = 15 * 1024 * 1024
# Limit to known media fields, never import arbitrary links embedded in descriptions.
MEDIA_FIELD = re.compile(r"(?P<key>'(?:image|banner|intro_image)'\s*=>\s*)'(?P<url>https://[^'\r\n]+)'")
GALLERY = re.compile(r"(?P<prefix>'gallery'\s*=>\s*array\s*\()(?P<entries>.*?)(?P<suffix>\n\s*\))", re.DOTALL)
GALLERY_URL = re.compile(r"(?P<prefix>\d+\s*=>\s*)'(?P<url>https://[^'\r\n]+)'")
errors: list[str] = []
cache: dict[str, str] = {}
created = 0
changed = 0

def import_url(url: str) -> str:
    global created
    if url in cache:
        return cache[url]
    parsed = urlparse(url)
    if parsed.scheme != "https" or parsed.hostname not in ALLOWED_HOSTS or parsed.username or parsed.password:
        raise ValueError(f"CDN hostname not approved: {parsed.hostname}")
    digest = hashlib.sha256(url.encode("utf-8")).hexdigest()[:14]
    name = f"imported-{digest}.webp"
    target = MEDIA_DIR / name
    reference = f"/images/{name}"
    if target.is_file():
        cache[url] = reference
        return reference
    request = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (compatible; GoCampMediaImport/1.0)",
        "Accept": "image/avif,image/webp,image/jpeg,image/png,image/*",
    })
    with urllib.request.urlopen(request, timeout=40) as response:
        content_type = response.headers.get_content_type()
        if not content_type.startswith("image/"):
            raise ValueError(f"Unexpected MIME type: {content_type}")
        data = response.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise ValueError("CDN image exceeds 15 MB")
    with Image.open(io.BytesIO(data)) as opened:
        frame = ImageOps.exif_transpose(opened)
        frame.thumbnail((1600, 1100), Image.Resampling.LANCZOS)
        if frame.mode not in ("RGB", "RGBA"):
            frame = frame.convert("RGB")
        if frame.mode == "RGBA":
            background = Image.new("RGB", frame.size, "#ffffff")
            background.paste(frame, mask=frame.getchannel("A"))
            frame = background
        MEDIA_DIR.mkdir(parents=True, exist_ok=True)
        with tempfile.NamedTemporaryFile(dir=MEDIA_DIR, suffix=".webp", delete=False) as fh:
            staged = Path(fh.name)
        try:
            frame.save(staged, "WEBP", quality=82, method=6)
            if staged.stat().st_size < 2048:
                raise ValueError("Optimized image unusually small")
            staged.replace(target)
        finally:
            staged.unlink(missing_ok=True)
    created += 1
    cache[url] = reference
    print(f"Imported {urlparse(url).hostname} -> {reference} ({target.stat().st_size} bytes)")
    return reference

def rewrite(match: re.Match) -> str:
    global changed
    url = match.group("url")
    try:
        reference = import_url(url)
    except Exception as exc:
        errors.append(f"{url}: {exc}")
        return match.group(0)
    changed += 1
    return match.group(0).replace(f"'{url}'", f"'{reference}'", 1)

def rewrite_gallery(match: re.Match) -> str:
    return match.group("prefix") + GALLERY_URL.sub(rewrite, match.group("entries")) + match.group("suffix")

updates: dict[Path, str] = {}
for file in DATA:
    if not file.is_file():
        continue
    current = file.read_text(encoding="utf-8")
    updated = MEDIA_FIELD.sub(rewrite, current)
    updated = GALLERY.sub(rewrite_gallery, updated)
    if updated != current:
        updates[file] = updated

if errors:
    print("\n".join(errors), file=sys.stderr)
    sys.exit("External image import failed; no PHP data files were modified.")
for file, updated in updates.items():
    file.write_text(updated, encoding="utf-8")
    print(f"Updated {file.relative_to(ROOT)}")
print(f"Done: {created} new WebP image(s); {changed} local references; {len(updates)} PHP file(s) updated.")
