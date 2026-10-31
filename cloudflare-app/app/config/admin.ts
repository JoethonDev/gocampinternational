export const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/catalog/program", label: "Programs" },
  { href: "/admin/catalog/destination", label: "Destinations" },
  { href: "/admin/catalog/category", label: "Categories" },
  { href: "/admin/documents/site_settings", label: "Visibility & Settings" },
  { href: "/admin/documents/faq", label: "FAQs" },
  { href: "/admin/documents/camp_memories", label: "Memories" },
  { href: "/admin/inquiries", label: "Inquiries" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/trash", label: "Trash" }
] as const;

export const ADMIN_THEME_KEY = "admin-theme";
