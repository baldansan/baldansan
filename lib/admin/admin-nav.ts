export type AdminNavItem = {
  href: string;
  label: string;
  icon: string;
  match: (pathname: string) => boolean;
};

/** Daily-use sidebar links. */
export const ADMIN_NAV_PRIMARY: AdminNavItem[] = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: "📊",
    match: (p) => p === "/admin",
  },
  {
    href: "/admin/lessons",
    label: "Lessons",
    icon: "📚",
    match: (p) =>
      p.startsWith("/admin/lessons") &&
      p !== "/admin/lessons/new" &&
      !p.startsWith("/admin/import"),
  },
  {
    href: "/admin/import",
    label: "Import ZIP",
    icon: "📦",
    match: (p) => p.startsWith("/admin/import"),
  },
  {
    href: "/admin/bichleg",
    label: "Бичлэг",
    icon: "▶",
    match: (p) => p.startsWith("/admin/bichleg"),
  },
  {
    href: "/admin/lessons/new",
    label: "Create lesson",
    icon: "➕",
    match: (p) => p === "/admin/lessons/new",
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: "⚙️",
    match: (p) => p.startsWith("/admin/settings"),
  },
];

/** Collapsed sidebar / settings — power-user tools. */
export const ADMIN_NAV_ADVANCED: AdminNavItem[] = [
  {
    href: "/admin/activity",
    label: "Activity",
    icon: "📋",
    match: (p) => p.startsWith("/admin/activity"),
  },
  {
    href: "/admin/tasks",
    label: "Tasks",
    icon: "✅",
    match: (p) => p.startsWith("/admin/tasks"),
  },
  {
    href: "/admin/analytics",
    label: "Analytics",
    icon: "📈",
    match: (p) => p.startsWith("/admin/analytics"),
  },
  {
    href: "/admin/system-check",
    label: "System check",
    icon: "🔍",
    match: (p) => p.startsWith("/admin/system-check"),
  },
  {
    href: "/admin/production-qa",
    label: "Production QA",
    icon: "🧪",
    match: (p) => p.startsWith("/admin/production-qa"),
  },
  {
    href: "/admin/prompts",
    label: "Prompts",
    icon: "💬",
    match: (p) => p.startsWith("/admin/prompts"),
  },
  {
    href: "/admin/final-audit",
    label: "Final audit",
    icon: "📝",
    match: (p) => p.startsWith("/admin/final-audit"),
  },
];

/** Extra admin routes (not in main sidebar list). */
export const ADMIN_NAV_EXTRA: AdminNavItem[] = [
  {
    href: "/admin/lesson-builder",
    label: "Lesson Builder",
    icon: "🛠",
    match: (p) => p.startsWith("/admin/lesson-builder"),
  },
  {
    href: "/admin/b2b",
    label: "B2B CRM",
    icon: "🏫",
    match: (p) => p.startsWith("/admin/b2b"),
  },
  {
    href: "/admin/security-audit",
    label: "Security audit",
    icon: "🔒",
    match: (p) => p.startsWith("/admin/security-audit"),
  },
  {
    href: "/admin/launch-candidate",
    label: "Launch candidate",
    icon: "🚀",
    match: (p) => p.startsWith("/admin/launch-candidate"),
  },
  {
    href: "/admin/launch-signoff",
    label: "Launch sign-off",
    icon: "✍️",
    match: (p) => p.startsWith("/admin/launch-signoff"),
  },
];

/** @deprecated Use ADMIN_NAV_PRIMARY — kept for any legacy imports. */
export const ADMIN_NAV_SECTIONS = [
  { title: "Main", items: ADMIN_NAV_PRIMARY },
  { title: "Advanced", items: ADMIN_NAV_ADVANCED },
];

export const ADMIN_NAV_SECONDARY: AdminNavItem[] = [
  {
    href: "/",
    label: "Learner app",
    icon: "🏠",
    match: () => false,
  },
];

export function resolveAdminPageTitle(pathname: string): string {
  if (pathname === "/admin") return "Dashboard";
  if (pathname === "/admin/lessons") return "Lessons";
  if (pathname === "/admin/lessons/new") return "Create Lesson";
  if (pathname === "/admin/import") return "Import ZIP";
  if (pathname.startsWith("/admin/bichleg")) return "Бичлэг";
  if (pathname === "/admin/settings") return "Settings";
  if (pathname.includes("/admin/lessons/") && pathname.includes("/edit")) {
    return "Edit Lesson";
  }
  if (pathname.includes("/admin/lessons/") && pathname.includes("/teacher")) {
    return "Багшийн давхарга";
  }
  if (pathname.startsWith("/admin/activity")) return "Activity Log";
  if (pathname.startsWith("/admin/tasks")) return "Task Center";
  if (pathname.startsWith("/admin/analytics")) return "Analytics";
  if (pathname.startsWith("/admin/system-check")) return "System Check";
  if (pathname.startsWith("/admin/lesson-builder")) return "Lesson Builder";
  return "Admin";
}
