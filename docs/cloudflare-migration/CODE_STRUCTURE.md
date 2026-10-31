# GoCamp Cloudflare app — code structure and conventions

**Scope:** the React Router 7 app in `cloudflare-app/`. The public visual design and content remain the PHP source contract; this document describes how the React implementation is organised so future changes stay small, typed and reviewable.

## 1. Principles

- **Route modules are thin.** A file in `app/routes/` owns its loader/action/meta and composes a feature component. Page markup belongs in `app/features/`.
- **Server-only code is explicit.** Files ending in `.server.ts` may touch D1, R2, cookies or secrets. Never import them from client components.
- **Domain types are shared.** `app/lib/domain.ts` holds catalog/document/media/inquiry types and small narrowing helpers. Avoid re-declaring `Record<string, unknown>` shapes in components.
- **Configuration is not duplicated.** Site identity, contact details, public nav/footer links, hero slides and About copy live in `app/config/site.ts`; admin navigation lives in `app/config/admin.ts`.
- **One concern per component.** Large pages are split into named sections. Shared primitives live in `app/components/ui/`; admin-only primitives live in `app/components/admin/`.
- **Cloudflare-native.** Use bindings (`context.cloudflare.env.DB`, `MEDIA`) directly. No REST calls to Cloudflare services from the Worker. No request-scoped module state.

## 2. Folder map

```text
cloudflare-app/
├─ app/
│  ├─ components/
│  │  ├─ admin/          AdminShell, page header, status badge
│  │  ├─ site/           public header, footer
│  │  ├─ ui/             Breadcrumbs, PageBanner, Pagination, error pages
│  │  └─ *.tsx           reusable public/admin controls (media, repeaters, cards)
│  ├─ config/            site identity, public links, admin navigation
│  ├─ features/
│  │  ├─ home/           HomePage and its sections
│  │  ├─ destination/    DestinationPage, coming-soon state
│  │  ├─ category/       CategoryPage sections
│  │  ├─ about/          AboutPage
│  │  ├─ contact/        ContactPage and form
│  │  ├─ faq/            FaqPage
│  │  ├─ landing/        marketing landing page
│  │  └─ admin/          admin feature modules (catalog, documents, media)
│  ├─ hooks/             useSiteNavigation, useLightbox, useAdminTheme
│  ├─ lib/
│  │  ├─ domain.ts       shared types and narrowing helpers
│  │  ├─ catalog.server.ts        typed catalog/document reads
│  │  ├─ catalog-fields.server.ts form parsing and validation
│  │  ├─ catalog-write.server.ts  saves, renames, duplicates, bulk, documents
│  │  ├─ admin.server.ts          sessions, CSRF, login rate limit
│  │  ├─ inquiries.server.ts      contact/lead/newsletter validation + D1 writes
│  │  ├─ media.server.ts          R2 upload/mutate
│  │  ├─ visibility.ts            global/per-record visibility rules
│  │  ├─ seo.ts                   canonical + Open Graph metadata helper
│  │  └─ logger.server.ts         structured Worker logs
│  ├─ routes.ts          single explicit route map
│  └─ root.tsx           document shell, public nav/footer, error boundary
└─ workers/app.ts        Worker entry, response headers, structured error handling
```

## 3. Data flow

1. `root.tsx` loads only data needed by the public shell (navigation and site settings).
2. A route loader calls typed repository helpers (`listPrograms`, `findDestination`, `loadDocument`, …) from `catalog.server.ts`.
3. The route passes plain typed data to a feature component. Components never query D1 directly.
4. Mutations go through a route action → validation in `catalog-fields.server.ts` / `catalog-write.server.ts` / `inquiries.server.ts` → D1/R2 → redirect/revalidation.
5. Admin routes always call `requireAdmin`; POST routes call `verifyAdminPost` (origin + session + CSRF). Never rely on the UI alone for authorisation.

## 4. Adding a public page

1. Add a route entry in `app/routes.ts`.
2. Add `loader`/`meta` to the route module using typed helpers and `seoMeta`.
3. Create `app/features/<page>/<Page>.tsx` with named section components.
4. Reuse `Breadcrumbs`, `PageBanner`, `ProgramCard`, `FaqAccordion`, `CampMemories` rather than copying markup.
5. Keep original PHP class names and content strings; the public theme is not being redesigned.

## 5. Adding a CMS field

1. Add the type to `app/lib/domain.ts` when it is not a simple string.
2. Add parsing/validation in `catalog-fields.server.ts` (length limits, allowed types).
3. Add the input to the relevant `features/admin/catalog/*Fields.tsx` component.
4. For repeatable data use `Repeater` or `StringList`; both submit a hidden `json_<field>` value, so arrays keep their type when empty.
5. For images use `MediaSelector`. For rich text use `RichTextInput`; never render stored HTML directly.

## 6. Cloudflare conventions

- `wrangler types` owns `Env`; never hand-write binding types.
- Secrets (`ADMIN_PASSWORD_SHA256`, `ADMIN_USERNAME`) live in Cloudflare, not in source.
- `workers/app.ts` adds security headers, staging `noindex`, `Server-Timing`, and structured failure logging.
- `upload_source_maps` and Workers Logs are enabled in `wrangler.json`.
- Static assets are served by Workers Static Assets; uploaded media is served through the immutable `/media/:id` route with R2.
- Do not introduce a global mutable request cache or module-level user state.

## 7. Quality commands

```bash
cd cloudflare-app
npm run typecheck
npm run format:check
npm run build
npx wrangler deploy --dry-run
```

`npm run format` applies the shared Prettier rules. Validation for this migration is performed against the running staging Worker and the source PHP site, not by adding new test suites.
