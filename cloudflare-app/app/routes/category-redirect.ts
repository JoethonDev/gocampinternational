import { redirect } from "react-router";
import type { Route } from "./+types/category-redirect";
export function loader({ params }: Route.LoaderArgs) {
  return redirect("/program/category?category=" + encodeURIComponent(params.slug || ""), 301);
}
