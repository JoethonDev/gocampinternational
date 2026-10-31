import { redirect } from "react-router";
import type { Route } from "./+types/category-legacy";
export function loader({ request }: Route.LoaderArgs) {
  return redirect("/program/category" + new URL(request.url).search, 301);
}
