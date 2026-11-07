# GoCamp production: external-DNS HTTPS bridge

This Pages project is only a TLS/custom-domain entrypoint. All application logic and state remain in the Cloudflare Worker, D1 and R2.

- Pages project: `gocamp-production-bridge`
- GitHub repository: `JoethonDev/gocampinternational`
- Pages production branch: `production` (**never `main` or `staging`**)
- Pages build root: `cloudflare-pages-bridge`; output: `.`; no build command
- Pages `GOCAMP_WORKER` Service Binding: `gocamp-migration-production` (both production and preview, if enabled)
- Default URL: `https://gocamp-production-bridge.pages.dev`
- External DNS CNAME after creating/validating a Pages custom domain: your chosen hostname -> `gocamp-production-bridge.pages.dev`.

Do not point the DNS record directly at `*.workers.dev`, or change live DNS until cutover is approved.
Cloudflare Pages manages the browser-facing TLS certificate after the custom domain is attached and validated.

No staging or production D1/R2 data is copied or accessed directly by this bridge; only the bound Worker receives requests.
