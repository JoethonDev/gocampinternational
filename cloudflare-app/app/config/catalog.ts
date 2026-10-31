export const CATALOG_KIND_META = {
  program: { label: "Programs", singular: "Program", icon: "bi-mortarboard-fill", accent: "blue" },
  destination: {
    label: "Destinations",
    singular: "Destination",
    icon: "bi-geo-alt-fill",
    accent: "green"
  },
  category: {
    label: "Categories",
    singular: "Category",
    icon: "bi-collection-fill",
    accent: "violet"
  }
} as const;

export const CATALOG_STATUS_OPTIONS = {
  program: ["active", "inactive", "trash"],
  destination: ["active", "inactive", "coming-soon", "trash"],
  category: ["active", "inactive", "trash"]
} as const;
