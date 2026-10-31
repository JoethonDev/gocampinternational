import { type RouteConfig, index, route } from "@react-router/dev/routes";
export default [index("routes/home.tsx"),route("health", "routes/health.ts"),route("programs", "routes/not-found.tsx"),route("gallery", "routes/not-found.tsx"),route("memories", "routes/not-found.tsx")] satisfies RouteConfig;
