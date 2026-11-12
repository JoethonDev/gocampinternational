# GoCamp staging SEO implementation — no individual program pages

**Scope:** GoCamp staging only. Production, `main`, and production D1/R2 remain unchanged.

## Existing catalog statuses (no new values)

| Catalog type | State | HTTP and SEO |
|---|---|---|
| Category, destination | `active` | Public server-rendered page (`200` when found), with D1-generated SEO metadata and optional editor overrides |
| Destination | `coming-soon` | HTTP `404`, `X-Robots-Tag: noindex, nofollow`, excluded from sitemap |
| Category, destination, program | `inactive`, `trash` | Not publicly listed; no public SEO landing page; excluded from sitemap |
| Program | `active` | Visible within existing category/destination pages; **no separate program detail page** |

The staging Worker always uses site-wide `noindex, nofollow`. Staging `robots.txt` has `Disallow: /`; `sitemap.xml` and `llms.txt` are inaccessible on staging.

## Program presentation (restored)

**There are no individual program detail pages** and no program-specific SEO editor fields or program sitemap entries. The existing cards display programs within category and destination pages.

The historical `/programs/:slug` URL pattern retains the **original one-hop 301 redirect** to `/program/category?category=:slug`; it must not render an independent page. Only categories and destinations have their own catalog SEO landing pages. Program content can support metadata and visible descriptions on those existing pages.

GoCamp represents short-term student camps and experiences across languages, sports, adventure, culture, and academic exploration, not an institute or education-advisory service.

## Editorial publishing and cache semantics

The existing staging R2 bucket stores a private, versioned snapshot at `__seo/editorial-published-v1.json` covering `site_settings` and `faq`. This drives About, Contact, FAQ, header/footer and shared editorial content.

1. Save drafts in the current admin content screens.
2. Visit `/admin/seo-publish` in staging.
3. Choose **Publish / refresh editorial content** to atomically replace the R2 snapshot.
4. New editorial copy appears on subsequent SSR responses.

The snapshot was initialized from staging D1. It persists until explicitly republished; it is **not** an indefinite Cloudflare edge cache entry. Catalog categories and destinations remain dynamic from D1, so a status change does not wait for an editorial publish or an HTML-cache TTL.

## Verification

Run `npm run check` from `cloudflare-app`, then staging HTTP smoke tests:

- `/destinations/france` => `404` and noindex; active destinations => `200`.
- `/programs/uk-academic-architecture` => legacy `301` (not a detail page).
- `/programs/kids-camps` => `301` to the category, as before.
- Program cards render their original non-linked presentation.
- `/program/category?category=kids-camps` => `200` with correct metadata and JSON-LD.
- The production-enabled sitemap generator includes only indexed categories/destinations; **never** individual program slugs.
- Staging `/robots.txt` => `Disallow: /`; `/sitemap.xml` => `404`.
- Shared editorial content stays at the published R2 version until the admin publishes again.

Do not introduce new program pages, `archived` or `disabled` catalog statuses, or changes to production.
