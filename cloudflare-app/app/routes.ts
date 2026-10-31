import { type RouteConfig, index, route } from "@react-router/dev/routes";
export default [index("routes/home.tsx"), route("health", "routes/health.ts"), route("programs", "routes/hidden-programs.tsx"), route("gallery", "routes/hidden-gallery.tsx"), route("memories", "routes/hidden-memories.tsx")] satisfies RouteConfig;
