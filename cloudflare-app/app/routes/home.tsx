import type { Route } from "./+types/home";
export function meta({}: Route.MetaArgs) { return [{ title: "GoCamp International | Migration Preview" }, { name: "robots", content: "noindex,nofollow" }]; }
export function loader({ context }: Route.LoaderArgs) { return { environment: context.cloudflare.env.GOCAMP_ENV, source: context.cloudflare.env.MIGRATION_SOURCE_SHA }; }
export default function Home({ loaderData }: Route.ComponentProps) {
  return <main id="main-content" className="migration-message"><img width="80" height="80" src="/images/logo.webp" alt="GoCamp International" /><h1>GoCamp migration preview</h1><p>React Router is initialized. Public content parity is not yet implemented.</p><p>Environment: {loaderData.environment}</p><small>Source: {loaderData.source}</small></main>;
}
