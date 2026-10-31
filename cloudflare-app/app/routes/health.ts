import type { Route } from "./+types/health";
export function loader({ context }: Route.LoaderArgs) {
  return Response.json(
    {
      service: "gocamp-migration",
      phase: "scaffold",
      environment: context.cloudflare.env.GOCAMP_ENV,
      source: context.cloudflare.env.MIGRATION_SOURCE_SHA
    },
    { headers: { "cache-control": "no-store", "x-robots-tag": "noindex,nofollow" } }
  );
}
