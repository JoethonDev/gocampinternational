import { getCloudflare } from "../lib/cloudflare-context";
import type { Route } from "./+types/api-analytics-traffic";
import { ingestTrafficEvent } from "../lib/analytics.server";

export function action({ request, context }: Route.ActionArgs) {
  return ingestTrafficEvent(request, getCloudflare(context).env);
}
