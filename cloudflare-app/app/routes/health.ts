import { getCloudflare } from "../lib/cloudflare-context";
import type { Route } from "./+types/health";
export function loader({ context }: Route.LoaderArgs) {
  return Response.json(
    {
      service: "gocamp-migration",
      phase: "scaffold",
      environment: getCloudflare(context).env.GOCAMP_ENV,
      source: getCloudflare(context).env.MIGRATION_SOURCE_SHA
    },
    { headers: { "cache-control": "no-store", "x-robots-tag": "noindex,nofollow" } }
  );
}
