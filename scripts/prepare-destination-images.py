#!/usr/bin/env python3
"""Improve locally hosted original destination images for public destination banners.

Sources are committed, existing /images/*.webp assets (not external hotlinks).
Destination display images are generated as optimized WebP with a modest
Lanczos upscale and sharpening pass; originals are preserved.
"""
from pathlib import Path
from PIL import Image, ImageOps, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SOURCES = {
    "england.webp": "uk-destination-upscaled.webp",
    "italy.webp": "italy-destination-upscaled.webp",
    "france.webp": "france-destination-upscaled.webp",
}

def main() -> None:
    folder = ROOT / "images"
    for source, dest in SOURCES.items():
        filename = folder / source
        if not filename.is_file():
            raise FileNotFoundError(f"Missing committed destination image: {source}")
        with Image.open(filename) as original:
            image = ImageOps.exif_transpose(original).convert("RGB")
            width, height = image.size
            if width < 200 or height < 200:
                raise RuntimeError(f"Source resolution too low for a reliable upscale: {source}")
            if width > 9000 or height > 9000:
                raise RuntimeError(f"Unexpected oversized source: {source}")
            # Maintain source composition/aspect; do not hallucinate new landmarks.
            scale = max(1, min(3, 1400 / max(width, height)))
            new_size = (round(width * scale), round(height * scale))
            if new_size != image.size:
                image = image.resize(new_size, Image.Resampling.LANCZOS)
            image = image.filter(ImageFilter.UnsharpMask(radius=1.1, percent=105, threshold=3))
            result = folder / dest
            image.save(result, format="WEBP", quality=88, method=6)
            print(f"Prepared {result.relative_to(ROOT)} ({width}x{height} -> {image.width}x{image.height}; {result.stat().st_size} bytes)")

if __name__ == "__main__":
    main()
