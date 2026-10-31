import type { Route } from "./+types/legacy-program";

/**
 * PR #40 deliberately hides the all-programs listing at /program/index.
 * /program/category remains a separate, active route in routes.ts.
 * Individual program pages do not exist in the PHP routing contract.
 */
export function loader({ params }: Route.LoaderArgs) {
  // All unmatched /program/* routes are unavailable by design.
  // Using a dedicated handler avoids accidental category-list disclosure.
  void params;
  throw new Response("Not Found", { status: 404 });
}
