#!/usr/bin/env python3
"""Run the ZIP-gallery mapper against real data copies in an isolated directory."""
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

root = Path(__file__).resolve().parents[1]
mapped = {
    "all_programs.php": {
        "italy-fashion": "53774_6ceb90297448b376.webp",
        "switzerland-ski-camp": "53814_bf0ca3d656de44fd.webp",
    },
    "destinations.php": {
        "switzerland": "53795_12d48e8ce0e31dc1.webp",
        "germany": "599389_484906048191135_693827616_n_f7da433507459ea3.webp",
        "uk": "53796_759c92161983887e.webp",
    },
}
with tempfile.TemporaryDirectory() as tmp:
    path = Path(tmp)
    (path / "data").mkdir()
    (path / "images").mkdir()
    (path / "scripts").mkdir()
    for name in mapped:
        shutil.copy2(root / "data" / name, path / "data" / name)
    shutil.copy2(root / "scripts" / "map_zip_media.py", path / "scripts" / "map_zip_media.py")
    originals = {n: (path / "data" / n).read_text() for n in mapped}
    for group in mapped.values():
        for img in group.values():
            (path / "images" / img).write_bytes(b"image-presence-fixture")
    script = [sys.executable, str(path / "scripts" / "map_zip_media.py")]
    subprocess.run(script, check=True)
    first = {n: (path / "data" / n).read_text() for n in mapped}
    for filename, group in mapped.items():
        for record, image in group.items():
            assert f"'/images/{image}'" in first[filename], record
        assert first[filename] != originals[filename]
    subprocess.run(script, check=True)
    for filename in mapped:
        assert (path / "data" / filename).read_text() == first[filename], "Non-idempotent mapping"
    print("ZIP media mapping tests passed: five mapped gallery images, no duplicate writes.")
