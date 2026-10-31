import { redirect } from "react-router";
import type { Route } from "./+types/admin-logout";
import { logout } from "../lib/admin.server";
export async function action({ request, context }: Route.ActionArgs) {
  const cookie = await logout(request, context.cloudflare.env.DB, await request.formData());
  return redirect("/admin/login", {
    headers: { "Set-Cookie": cookie, "Cache-Control": "no-store" }
  });
}
export function loader() {
  throw redirect("/admin");
}
