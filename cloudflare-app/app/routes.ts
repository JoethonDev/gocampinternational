import { type RouteConfig, index, route } from "@react-router/dev/routes";
export default [
  index("routes/home.tsx"),
  route("health","routes/health.ts"),
  route("destinations/:slug","routes/destination.tsx"),
  route("destination/:slug","routes/destination-alias.ts"),
  route("program/category","routes/category.tsx"),
  route("program/category.php","routes/category-legacy.ts"),
  route("programs/:slug","routes/category-redirect.ts"),
  route("faq","routes/faq.tsx"),
  route("about","routes/about.tsx"),
  route("contact","routes/contact.tsx"),
  route("api/submit-contact.php","routes/api-contact.ts"),
  route("api/submit-lead.php","routes/api-lead.ts"),
  route("api/subscribe-newsletter.php","routes/api-newsletter.ts"),
  route("programs","routes/hidden-programs.tsx"),
  route("gallery","routes/hidden-gallery.tsx"),
  route("memories","routes/hidden-memories.tsx")
] satisfies RouteConfig;
