import { redirect } from "react-router";
import type { Route } from "./+types/destination-alias";
export function loader({ params }: Route.LoaderArgs) {
  return redirect("/destinations/" + encodeURIComponent(params.slug || ""), 301);
}
