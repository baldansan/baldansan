export type AdminNavItem = {
  href: string;
  label: string;
  icon: string;
  /** One line explaining what the page is for — shown in the settings index. */
  hint?: string;
  match: (pathname: string) => boolean;
};

export type AdminNavSection = {
  title: string;
  /** Sub-line under the section heading, so the grouping explains itself. */
  description: string;
  items: AdminNavItem[];
};

/** Daily-use sidebar links — what content work actually touches. */
export const ADMIN_NAV_PRIMARY: AdminNavItem[] = [
  {
    href: "/admin",
    label: "Хяналтын самбар",
    icon: "📊",
    hint: "Өнөөдрийн төлөв, анхаарал шаардсан зүйлс.",
    match: (p) => p === "/admin",
  },
  {
    href: "/admin/lessons",
    label: "Хичээлүүд",
    icon: "📚",
    hint: "Бүх хичээлийн жагсаалт, засвар, нийтлэл.",
    match: (p) =>
      p.startsWith("/admin/lessons") &&
      p !== "/admin/lessons/new" &&
      !p.startsWith("/admin/import"),
  },
  {
    href: "/admin/lessons/new",
    label: "Шинэ хичээл",
    icon: "➕",
    hint: "Гараар шинэ хичээл үүсгэх.",
    match: (p) => p === "/admin/lessons/new",
  },
  {
    href: "/admin/import",
    label: "ZIP импорт",
    icon: "📦",
    hint: "Бэлэн багцаас хичээл оруулах.",
    match: (p) => p.startsWith("/admin/import"),
  },
  {
    href: "/admin/bichleg",
    label: "Бичлэг",
    icon: "▶",
    hint: "Видео контент удирдах.",
    match: (p) => p.startsWith("/admin/bichleg"),
  },
];

/** Reporting and people — reviewed weekly rather than daily. */
export const ADMIN_NAV_INSIGHTS: AdminNavItem[] = [
  {
    href: "/admin/analytics",
    label: "Тайлан",
    icon: "📈",
    hint: "Суралцалтын гүйцэтгэл, хүндрэлтэй асуултууд.",
    match: (p) => p.startsWith("/admin/analytics"),
  },
  {
    href: "/admin/learner",
    label: "Суралцагч",
    icon: "🧑‍🎓",
    hint: "Хэрэглэгч бүрийн ахиц.",
    match: (p) => p.startsWith("/admin/learner"),
  },
  {
    href: "/admin/b2b",
    label: "Байгууллага",
    icon: "🏫",
    hint: "Сургууль, анги, урилга, хүсэлт.",
    match: (p) => p.startsWith("/admin/b2b"),
  },
  {
    href: "/admin/tasks",
    label: "Даалгавар",
    icon: "✅",
    hint: "Контентын ажлын төв.",
    match: (p) => p.startsWith("/admin/tasks"),
  },
];

/** Collapsed by default — power-user and release tooling. */
export const ADMIN_NAV_ADVANCED: AdminNavItem[] = [
  {
    href: "/admin/guide",
    label: "Хэрэглэгчийн заавар",
    icon: "📖",
    hint: "Админы бүх ажлын алхам алхмаар бичсэн заавар.",
    match: (p) => p.startsWith("/admin/guide"),
  },
  {
    href: "/admin/settings",
    label: "Тохиргоо",
    icon: "⚙️",
    hint: "Бүх хэрэгслийн жагсаалт.",
    match: (p) => p.startsWith("/admin/settings"),
  },
  {
    href: "/admin/activity",
    label: "Үйлдлийн лог",
    icon: "📋",
    hint: "Хэн юу өөрчилсөн бүртгэл.",
    match: (p) => p.startsWith("/admin/activity"),
  },
  {
    href: "/admin/system-check",
    label: "Системийн шалгалт",
    icon: "🔍",
    hint: "Холболт, тохиргооны эрүүл мэнд.",
    match: (p) => p.startsWith("/admin/system-check"),
  },
  {
    href: "/admin/production-qa",
    label: "Production QA",
    icon: "🧪",
    hint: "Гаргалтын өмнөх шалгах хуудас.",
    match: (p) => p.startsWith("/admin/production-qa"),
  },
  {
    href: "/admin/prompts",
    label: "Prompt сан",
    icon: "💬",
    hint: "Контент бэлтгэх prompt-ууд.",
    match: (p) => p.startsWith("/admin/prompts"),
  },
  {
    href: "/admin/lesson-builder",
    label: "Хичээл угсрагч",
    icon: "🛠",
    hint: "Багцын бүтэц угсрах хэрэгсэл.",
    match: (p) => p.startsWith("/admin/lesson-builder"),
  },
  {
    href: "/admin/final-audit",
    label: "Эцсийн шалгалт",
    icon: "📝",
    hint: "Бүтээгдэхүүний нэгдсэн үзлэг.",
    match: (p) => p.startsWith("/admin/final-audit"),
  },
  {
    href: "/admin/security-audit",
    label: "Аюулгүй байдал",
    icon: "🔒",
    hint: "RLS болон эрхийн шалгалт.",
    match: (p) => p.startsWith("/admin/security-audit"),
  },
  {
    href: "/admin/launch-candidate",
    label: "Хувилбарын бэлэн байдал",
    icon: "🚀",
    hint: "Гаргахад бэлэн эсэх.",
    match: (p) => p.startsWith("/admin/launch-candidate"),
  },
  {
    href: "/admin/launch-signoff",
    label: "Гаргалтын баталгаа",
    icon: "✍️",
    hint: "Эцсийн зөвшөөрөл.",
    match: (p) => p.startsWith("/admin/launch-signoff"),
  },
];

export const ADMIN_NAV_SECTIONS: AdminNavSection[] = [
  {
    title: "Контент",
    description: "Хичээл, бичлэг, импорт",
    items: ADMIN_NAV_PRIMARY,
  },
  {
    title: "Тайлан ба хэрэглэгч",
    description: "Гүйцэтгэл, суралцагч, байгууллага",
    items: ADMIN_NAV_INSIGHTS,
  },
];

export const ADMIN_NAV_SECONDARY: AdminNavItem[] = [
  {
    href: "/",
    label: "Сурагчийн апп",
    icon: "🏠",
    match: () => false,
  },
];

/** Every navigable admin destination — used for titles and the settings index. */
export const ADMIN_NAV_ALL: AdminNavItem[] = [
  ...ADMIN_NAV_PRIMARY,
  ...ADMIN_NAV_INSIGHTS,
  ...ADMIN_NAV_ADVANCED,
];

export function resolveAdminPageTitle(pathname: string): string {
  if (pathname === "/admin") return "Хяналтын самбар";
  if (pathname === "/admin/lessons/new") return "Шинэ хичээл";

  if (pathname.includes("/admin/lessons/") && pathname.includes("/edit")) {
    return "Хичээл засах";
  }
  if (pathname.includes("/admin/lessons/") && pathname.includes("/teacher")) {
    return "Багшийн давхарга";
  }

  const match = ADMIN_NAV_ALL.find((item) => item.match(pathname));
  return match?.label ?? "Админ";
}
