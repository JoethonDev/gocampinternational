export type AdminNavItem = {
  href: string;
  label: string;
  icon: string;
};

export type AdminNavGroup = {
  label: string;
  items: AdminNavItem[];
};

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    label: "Overview",
    items: [{ href: "/admin", label: "Dashboard", icon: "bi-grid-1x2-fill" }]
  },
  {
    label: "Content",
    items: [
      { href: "/admin/catalog/program", label: "Programs", icon: "bi-mortarboard-fill" },
      { href: "/admin/catalog/destination", label: "Destinations", icon: "bi-geo-alt-fill" },
      { href: "/admin/catalog/category", label: "Categories", icon: "bi-collection-fill" },
      { href: "/admin/media", label: "Media", icon: "bi-images" }
    ]
  },
  {
    label: "Experience",
    items: [
      { href: "/admin/documents/site_settings", label: "Visibility", icon: "bi-toggles" },
      { href: "/admin/documents/faq", label: "FAQs", icon: "bi-question-circle" },
      { href: "/admin/documents/camp_memories", label: "Memories", icon: "bi-camera" }
    ]
  },
  {
    label: "Engagement",
    items: [
      { href: "/admin/inquiries", label: "Inquiries", icon: "bi-inbox-fill" },
      { href: "/admin/trash", label: "Trash", icon: "bi-trash3" }
    ]
  }
];

export const ADMIN_NAV: AdminNavItem[] = ADMIN_NAV_GROUPS.flatMap((group) => group.items);

export const ADMIN_THEME_KEY = "admin-theme";
