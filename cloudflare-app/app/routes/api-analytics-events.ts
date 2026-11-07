import { getCloudflare } from "../lib/cloudflare-context";
import type { Route } from "./+types/api-analytics-events";
import { ingestAnalyticsEvents } from "../lib/analytics.server";

export function action({ request, context }: Route.ActionArgs) {
  return ingestAnalyticsEvents(request, getCloudflare(context).env);
}
