import type { Route } from "./+types/not-found";
export function loader({}: Route.LoaderArgs) { throw new Response("Not Found", {status:404}); }
export default function NotFound(){ return null; }
