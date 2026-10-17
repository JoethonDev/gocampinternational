#!/usr/bin/env python3
"""Non-destructive mapping for five ZIP-only GoCamp WebP images.

If a mapped file has been uploaded to images/, append it to its record's
gallery. Existing primary banners/covers, gallery items and statuses stay
untouched. Skips missing images to avoid broken public references.
Safe to run repeatedly on main, develop and feature branches.
"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MAP = {
    "data/all_programs.php": {
        "italy-fashion": "53774_6ceb90297448b376.webp",
        "switzerland-ski-camp": "53814_bf0ca3d656de44fd.webp",
    },
    "data/destinations.php": {
        "switzerland": "53795_12d48e8ce0e31dc1.webp",
        "germany": "599389_484906048191135_693827616_n_f7da433507459ea3.webp",
        "uk": "53796_759c92161983887e.webp",
    },
}
ENTRY = re.compile(r"(?m)^  '(?P<id>[^']+)' =>\s*\n  array \(")
GALLERY = re.compile(r"(?m)^(?P<head>    'gallery' =>\s*\n    array \(\n)(?P<items>[\s\S]*?)(?P<tail>^    \),)")
INDEX = re.compile(r"(?m)^      (\d+) =>")
updated_count = 0
for relative, images in MAP.items():
    file = ROOT / relative
    if not file.is_file():
        continue
    source = file.read_text(encoding="utf-8")
    matches = list(ENTRY.finditer(source))
    for match in reversed(matches):
        record_id = match.group("id")
        if record_id not in images:
            continue
        image = ROOT / "images" / images[record_id]
        if not image.is_file():
            print(f"Pending upload: {image.relative_to(ROOT)} ({record_id})")
            continue
        start = match.start()
        end = next((m.start() for m in matches if m.start() > start), len(source))
        block = source[start:end]
        gallery = GALLERY.search(block)
        if gallery is None:
            raise RuntimeError(f"Expected gallery array missing: {record_id}")
        ref = "/images/" + image.name
        if f"'{ref}'" in gallery.group("items"):
            continue
        indexes = [int(x) for x in INDEX.findall(gallery.group("items"))]
        next_index = max(indexes, default=-1) + 1
        inner = gallery.group("items") + f"      {next_index} => '{ref}',\n"
        block = block[:gallery.start("items")] + inner + block[gallery.end("items"):]
        source = source[:start] + block + source[end:]
        updated_count += 1
        print(f"Gallery mapping added: {record_id} -> {ref}")
    if source != file.read_text(encoding="utf-8"):
        file.write_text(source, encoding="utf-8")
print(f"Completed ZIP image mapping: {updated_count} added (existing records preserved).")
