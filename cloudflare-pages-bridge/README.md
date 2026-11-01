# GoCamp staging: external-DNS HTTPS bridge

This small Cloudflare Pages application uses a `GOCAMP_WORKER` **Service Binding** to invoke the existing `gocamp-migration-staging` Worker. It does **not** duplicate the React app, its static assets, D1 database, or R2 media.

- Pages project name: `gocamp-staging-bridge`
- Pages production branch: `migration/cloudflare-react-workers-pr40`
- Build root: `cloudflare-pages-bridge`; build output: `.`; no build command
- Required Pages **production** binding: `GOCAMP_WORKER` → `gocamp-migration-staging`
- Custom hostname: `new.gocampinternational.net`
- External DNS (Link Data Center): one CNAME `new` → `gocamp-staging-bridge.pages.dev` after Pages custom domain is registered.

Cloudflare Pages automatically manages the TLS certificate once domain validation succeeds. Do not create a Worker custom domain or point a CNAME directly at `*.workers.dev`: the root domain is **not** on Cloudflare authoritative DNS.

The Pages project may need redeployment after changing bindings. Preserve the Service Binding in both preview and production config if previews are used.

This bridge must not be used for production until the separate production cutover has been approved.
