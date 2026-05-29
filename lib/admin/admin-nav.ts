export type AdminNavItem = {
  href: string;
  label: string;
  icon: string;
  match: (pathname: string) => boolean;
};

export type AdminNavSection = {
  title: string;
  items: AdminNavItem[];
};

export const ADMIN_NAV_SECTIONS: AdminNavSection[] = [
  {
    title: "Content",
    items: [
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
        match: (p) => p.startsWith("/admin/lessons"),
      },
      {
        href: "/admin/lesson-builder",
        label: "Lesson Builder",
        icon: "🛠",
        match: (p) => p.startsWith("/admin/lesson-builder"),
      },
      {
        href: "/admin/lessons/new",
        label: "Create lesson",
        icon: "➕",
        match: (p) => p === "/admin/lessons/new",
      },
    ],
  },
  {
    title: "Operations",
    items: [
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
    ],
  },
  {
    title: "System",
    items: [
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
    ],
  },
];

export const ADMIN_NAV_SECONDARY: AdminNavItem[] = [
  {
    href: "/admin/final-audit",
    label: "Final audit",
    icon: "📝",
    match: (p) => p.startsWith("/admin/final-audit"),
  },
  {
    href: "/",
    label: "Learner app",
    icon: "🏠",
    match: () => false,
  },
];

export function resolveAdminPageTitle(pathname: string): string {
  if (pathname === "/admin") return "Dashboard";
  if (pathname === "/admin/lessons") return "Lesson Management";
  if (pathname === "/admin/lessons/new") return "Create Lesson";
  if (pathname.includes("/admin/lessons/") && pathname.includes("/edit")) {
    return "Edit Lesson";
  }
  if (pathname.startsWith("/admin/activity")) return "Activity Log";
  if (pathname.startsWith("/admin/tasks")) return "Task Center";
  if (pathname.startsWith("/admin/analytics")) return "Learning Analytics";
  if (pathname.startsWith("/admin/system-check")) return "System Check";
  if (pathname.startsWith("/admin/lesson-builder")) return "Lesson Builder";
  return "Admin";
}
