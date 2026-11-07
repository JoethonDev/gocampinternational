import { getCloudflare } from "../lib/cloudflare-context";
import type { Route } from "./+types/api-newsletter";
import { submitInquiry } from "../lib/inquiries.server";
export function action({ request, context }: Route.ActionArgs) {
  return submitInquiry(request, getCloudflare(context).env.DB, "newsletter");
}
