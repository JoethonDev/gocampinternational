import { redirect } from "react-router";
import type { Route } from "./+types/legacy-root";

/**
 * Legacy entrypoint compatibility based on PR #40's index.php/.htaccess.
 * The source has no standalone individual program-detail URLs, and program
 * cards intentionally have no modal click action. Do not invent such routes.
 */
const aliases: Readonly<Record<string, string>> = {
  home: "/",
  index: "/",
  "index.php": "/",
  "home.php": "/",
  about_us: "/about",
  "about_us.php": "/about",
  contact_us: "/contact",
  "contact_us.php": "/contact",
  "faq.php": "/faq",
};

export function loader({ params }: Route.LoaderArgs) {
  const alias = params.legacy ?? "";
  // Unknown paths (including the not-yet-ported marketing landing page)
  // must never be redirected to the homepage or silently reported as success.
  const canonical = Object.hasOwn(aliases, alias) ? aliases[alias] : null;
  if (!canonical) throw new Response("Not Found", { status: 404 });
  return redirect(canonical, 301);
}
