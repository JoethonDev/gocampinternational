# GoCamp homepage — client proposal

Live preview: https://gocamp.joethon.dev

Four layouts (select in the top demo strip):
- [Current+](https://gocamp.joethon.dev/?layout=1)
- [Discover](https://gocamp.joethon.dev/?layout=2)
- [Experience](https://gocamp.joethon.dev/?layout=3)
- [Parent first](https://gocamp.joethon.dev/?layout=4)

## Data / hosting
- Cloudflare Worker: `gocamp-client-homepage-demo`, isolated from the migration frontend.
- Read-only content queries from **gocamp-staging-db** through D1 binding `DB`.
- Images stream directly from **gocamp-staging-media** R2 through `MEDIA`; the existing D1 `media_assets` and `media_variants` tables resolve WebP responsive variants.
- Reads active destinations, categories and programs, family testimonials, FAQs and camp memories. Updating staging D1 will appear in the demo without data copying.
- No D1 writes, form storage, migrations, tracking, pop-ups or alerts.
- Lead form composes a mailto draft to the company's published contact address. It is intentionally *not* a production lead form.
- `robots.txt` and the `X-Robots-Tag` header prevent demo indexing.

## Deploy
Use Wrangler from this folder or upload `worker.js` to Cloudflare Workers as an ES module with the same D1 and R2 bindings. The Worker and custom domain were initially deployed with the Cloudflare API. This folder is the reviewable source; GitHub edits do not auto-deploy this demo unless a build workflow is later configured.

## Scope
Standalone homepage proposals for client comparison; the existing staging and production applications were not modified.
