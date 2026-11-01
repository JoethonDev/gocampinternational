# GoCamp — Media requests received 2026-11-01 after 14:40

## Strict scope

Only the WhatsApp messages **after 14:40 Cairo time on November 1, 2026** are in scope. The author's latest outgoing message in the supplied export was at 11:51, so there is no later sender reply that supersedes this boundary. Messages before 14:41, including the 14:37–14:40 photo pair, are context **not new tasks**.

Source archive and private media are **not committed to this public repository**.

## Editorial inventory (17 unique photos)

| Image filename suffix | Site area | Intended handling |
| --- | --- | --- |
| WA0033, WA0031 | Fashion | Compare with currently published workshop photography; use if clearer, associate with correct UK/Switzerland content |
| WA0027 | Austria memories / testimonial candidate | Sent twice (14:46 and 15:00); retain only once, check existing records first |
| WA0032 | Italy adventure | Rafting image; associate with appropriate adventure content, not the Italy destination hero unless explicitly selected |
| WA0025 | About Us | School presentation; sent twice (14:54 and 15:03); keep best original once |
| WA0030, WA0029, WA0028 | Memories / genuine testimonial candidates | London / young-leader historical photographs; do not create testimonials without their exact words |
| WA0026 | About Us | Original conference photo; placement requires comparison |
| WA0017 | Brand logo | Compare against current R2 logo before replacing; no automatic downgrade |
| WA0024 | About Us | Original photograph; check if already displayed |
| WA0019 | Reference only | Website screenshot, not publishable editorial photo |
| WA0018 | About Us | Berlin workshop with educators |
| WA0020 | Reference only | Screenshot of a photo; original requested, so do not publish the screenshot |
| WA0021, WA0022, WA0023 | About Us | DEO school-presentation alternatives; choose strongest photo instead of posting all |

**Voice notes:** 14:51, 15:20 and 15:21 are part of the requested scope. Their original OPUS attachments are available in the private import package, but were not transcribed; do not infer requirements from them.

## Staging cross-check

- Target: `migration/cloudflare-react-workers-pr40` and `gocamp-staging-db` + `gocamp-staging-media` only.
- The existing `media_assets` table returned **zero byte-identical SHA-256 matches** for these 17 JPEGs. That does not prove no photos were previously uploaded with different encoding.
- Existing Camp Memories and text-only homepage Testimonials were inspected for semantics; photographs should not be represented as fabricated customer quotes.
- Original image dimensions range from phone/screenshot sizes to 1600px wide. Preserve the highest real resolution; do not upscale arbitrary screenshots or replace existing higher-quality photos blindly.
- Existing production resources must stay untouched.

## Execution checklist and current status

- [x] Restrict to messages after cutoff
- [x] Inventory original images and voice attachments
- [x] Eliminate repeated WA0025 / WA0027 submissions
- [x] Compute dimensions, checksums and intended placement
- [x] Check for exact existing D1 media checksum matches
- [ ] Listen to and transcribe all 3 voice notes; resolve any changed instructions
- [ ] Compare visual duplicate candidates with current R2 media and destination/program images
- [ ] Upload selected originals to staging R2 through existing admin media pipeline
- [ ] Update staging D1 CMS references with revision checks; preserve original metadata and avoid duplicates
- [ ] Verify staging rendering on mobile and desktop

**No media upload, D1 mutation, deployment, or production change is claimed by this document.** The complete original-photo/media manifest bundle is maintained privately, not in git.
