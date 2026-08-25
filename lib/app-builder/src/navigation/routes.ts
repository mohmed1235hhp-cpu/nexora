export const AB_ROUTES = {
  home: "/app-builder",
  section: (name: string) => `/app-builder/${name}`,
  timeline: "/app-builder/timeline",
  preview: "/app-builder/preview",
  reports: "/app-builder/reports",
  settings: "/app-builder/settings",
} as const;
