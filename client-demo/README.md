# GoCamp — Four full-site client design concepts

**Live gallery:** https://gocamp.joethon.dev/layouts

| Layout | All-page directory | Homepage |
| --- | --- | --- |
| Current+ | https://gocamp.joethon.dev/layout/1 | https://gocamp.joethon.dev/layout/1/home |
| Discover | https://gocamp.joethon.dev/layout/2 | https://gocamp.joethon.dev/layout/2/home |
| Experience | https://gocamp.joethon.dev/layout/3 | https://gocamp.joethon.dev/layout/3/home |
| Parent first | https://gocamp.joethon.dev/layout/4 | https://gocamp.joethon.dev/layout/4/home |

## All page types

Each layout has these 12 client-review pages: Home, Destinations, an Italy destination detail, Program Categories, a Kids Camps category detail, Programs, an AC Milan program detail, About, Go Camper Memories, Testimonials, FAQs, and Contact. All active destination, category, and program slugs have their own preview detail routes, too.

- `/layout/{n}/home`
- `/layout/{n}/destinations` and `/layout/{n}/destinations/{slug}`
- `/layout/{n}/categories` and `/layout/{n}/categories/{slug}`
- `/layout/{n}/programs` and `/layout/{n}/programs/{slug}`
- `/layout/{n}/about`, `/layout/{n}/memories`, `/layout/{n}/testimonials`
- `/layout/{n}/faq`, `/layout/{n}/contact`

## Cloudflare

- The standalone Worker `gocamp-client-homepage-demo` serves the custom hostname `gocamp.joethon.dev`.
- Staging D1 `gocamp-staging-db` is queried read-only for the active catalog and site documents.
- Staging R2 `gocamp-staging-media` provides images with existing mobile/tablet/desktop WebP variants.
- Data and images are shared across all four layout variations. The preview makes no changes to staging or production data.
- Contact form launches a prefilled email; it does not store leads in D1.
- The demo uses robots.txt, meta noindex, and X-Robots-Tag to discourage indexing.

## Client/demo limits

The root (without a layout query) redirects to the visual gallery. Existing homepage URLs `/?layout=1` through `/?layout=4` remain available. Some cross-site links still lead to the staging environment where intentionally indicated. The demo is not a replacement for the live booking or enquiry flow.

## If staging supports four layouts later — not implemented

Preserve one React Router application and one canonical URL per content page. Share D1 loaders, media resolver, SEO metadata, and accessibility behavior. Define four layout templates / page compositions and use a site_settings JSON `layout_id` setting for the active public variant; alternative layouts should be private or noindex preview-only routes. Add an admin preview/publish/rollback workflow, responsive regression tests, and Core Web Vitals checks. Four duplicate databases or four standalone production sites are unnecessary.

> GitHub is the source of the Cloudflare demo Worker. The demo is deployed separately through the Cloudflare API; source commits do not auto-publish.
