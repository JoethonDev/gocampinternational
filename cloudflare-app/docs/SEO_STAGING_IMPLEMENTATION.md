# GoCamp staging SEO implementation

**Scope:** staging branch and staging Cloudflare Worker only. Production, `main`, and production D1/R2 are not part of this rollout.

## Existing statuses (no new values)

| Entity | Status | Public behavior |
|---|---|---|
| Program, destination, category | `active` | SSR `200` if meaningful content exists; optional SEO override may set `noindex` |
| Destination | `coming-soon` | Real HTTP `404`, `X-Robots-Tag: noindex, nofollow`, no discovery entry |
| All catalog types | `inactive`, `trash` | Real HTTP `404`, no discovery entry |

The staging Worker must always set `X-Robots-Tag: noindex, nofollow`, even on otherwise-public pages. Its `robots.txt` blocks all bots, and its sitemap and llms endpoints are not publicly exposed on staging.

## New program route

`/programs/:slug` is an actual SSR page containing visible program text and structured data. Programs link from existing category and destination cards using regular anchors. Active legacy category slugs on that path redirect in one hop to `/program/category?category=:slug`.

Program titles and descriptions are generated from D1, with optional overrides in the existing admin program editor. If a category is inactive, it is not shown as a breadcrumb or linked.

The content strategy includes short-term camps, language/sport/adventure experiences, and academic exploration without implying that GoCamp is an institute or a formal admission adviser.

## Editorial publishing (R2)

The existing staging R2 bucket stores one nonpublic versioned snapshot at `__seo/editorial-published-v1.json` covering `site_settings` and `faq`. About, Contact, FAQ, header/footer and common editorial copy read from this published snapshot.

1. Save draft changes in their existing CMS screens.
2. Visit `/admin/seo-publish` on staging.
3. Select **Publish / refresh editorial content** to replace the one R2 snapshot atomically.
4. The new published copy is visible on subsequent SSR responses.

**Initialization:** Until the initial publish, pages read existing D1 data. Initialize the snapshot once after deployment. No additional catalog statuses or D1 schema migrations are introduced.

The dynamic program/category/destination state and sitemap are not frozen with editorial content. The Worker does not full-page-cache public HTML, so unpublishing does not wait for an HTML-cache TTL.

## Validation

Run `npm run check` from `cloudflare-app`; verify:

- `/destinations/france` => 404 + noindex, and `/destinations/switzerland` => 200 + noindex (staging).
- `/programs/uk-academic-architecture` => 200, SSR content and JSON-LD; `/programs/unknown` => 404.
- `/programs/kids-camps` => one-hop legacy category redirect.
- Staging `/robots.txt` => `Disallow: /`; `/sitemap.xml` => 404.
- `/about` and `/faq` preserve their published R2 snapshot after an unrelated admin draft save until a publish is performed.

All actions that write to `/admin` retain login, CSRF, same-origin verification and `no-store` responses.
