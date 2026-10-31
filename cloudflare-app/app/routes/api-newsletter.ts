import type { Route } from "./+types/api-newsletter";
import { submitInquiry } from "../lib/inquiries.server";
export function action({ request, context }: Route.ActionArgs) {
  return submitInquiry(request, context.cloudflare.env.DB, "newsletter");
}
