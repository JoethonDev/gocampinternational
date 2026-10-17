# ZIP-only image mapping (uploaded `htdoc.zip`)

These are **five exact original images from the uploaded ZIP**, not generated assets. They were not previously in the repository.

| Entity | Record ID | ZIP image path | Current GitHub primary image |
| --- | --- | --- | --- |
| Program | `italy-fashion` | `/images/53774_6ceb90297448b376.webp` | `/images/Fashion_85.webp` |
| Program | `switzerland-ski-camp` | `/images/53814_bf0ca3d656de44fd.webp` | `/images/Winter-2.webp` |
| Destination | `switzerland` | `/images/53795_12d48e8ce0e31dc1.webp` | `/images/swiss_banner.webp` |
| Destination | `germany` | `/images/599389_484906048191135_693827616_n_f7da433507459ea3.webp` | `/images/germany_banner.webp` |
| Destination | `uk` | `/images/53796_759c92161983887e.webp` | `/images/england_banner.webp` |

## Import behavior

- **Preserve both versions:** leave every primary banner/cover untouched, and add the ZIP image as an extra `gallery` item.
- **No broken URLs:** `scripts/map_zip_media.py` only maps files that are actually present in the repository's existing `images/` directory.
- **No duplication:** re-running the script does not create duplicate gallery entries.
- Upload the five files from `gocamp_zip_images_with_mapping.zip` to `images/` and push to `main` or `develop`. The branch-aware GitHub Actions image workflow will map them, then commit the data updates to the same branch.
- Statuses (including `coming-soon`) are never changed. Destination gallery display still follows existing admin section visibility switches.
- CDN image imports are handled separately by `scripts/vendor_uk_academic_images.py`.
- This image mapping is not a deployment mechanism and does not overwrite content on InfinityFree/cPanel.
