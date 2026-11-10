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
    hint: "Бүх зүйл хувиар нэг харцаар: хичээл, шалгалт, суралцагч, алдаа.",
    match: (p) => p === "/admin",
  },
  {
    href: "/admin/lessons",
    label: "Хичээлүүд",
    icon: "📚",
    hint: "Бүх курсын хичээл: жагсаалт, засвар, нийтлэх, шинэ хичээл нэмэх.",
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
    label: "Багц импорт (ZIP)",
    icon: "📦",
    hint: "Бэлэн ZIP багцаас хичээл, шалгалт, бичлэг оруулах.",
    match: (p) => p.startsWith("/admin/import"),
  },
  {
    href: "/admin/source",
    label: "Номын эх",
    icon: "📖",
    hint: "HSK номын хичээл бүрийн агуулга — номд байгаагаар.",
    match: (p) => p.startsWith("/admin/source"),
  },
  {
    href: "/admin/bichleg",
    label: "Бичлэг",
    icon: "▶",
    hint: "Видео контент удирдах.",
    match: (p) => p.startsWith("/admin/bichleg"),
  },
  {
    href: "/admin/mock-tests/tutor-notes",
    label: "Загвар шалгалт (真题)",
    icon: "📝",
    hint: "Оруулсан шалгалтууд, асуулт бүрийн тайлбар ба «хувийн багш» тэмдэглэл.",
    match: (p) => p.startsWith("/admin/mock-tests"),
  },
];

/** Reporting and people — reviewed weekly rather than daily. */
export const ADMIN_NAV_INSIGHTS: AdminNavItem[] = [
  {
    href: "/admin/analytics",
    label: "Сурах тайлан",
    icon: "📈",
    hint: "Хичээл бүрийн гүйцэтгэл, хүндрэлтэй асуулт, үг.",
    match: (p) => p.startsWith("/admin/analytics"),
  },
  {
    href: "/admin/feedback",
    label: "Алдааны мэдээлэл",
    icon: "🐞",
    hint: "Хэрэглэгч/багшийн илгээсэн алдаа — дэлгэцийн зурагтай.",
    match: (p) => p.startsWith("/admin/feedback"),
  },
  {
    href: "/admin/learners",
    label: "Суралцагчид",
    icon: "🎓",
    hint: "Бүх суралцагч A–F үнэлгээтэй; нэг дээр нь дарвал дэлгэрэнгүй.",
    match: (p) => p.startsWith("/admin/learners"),
  },
  {
    href: "/admin/learner",
    label: "Нэг суралцагч",
    icon: "🧑‍🎓",
    hint: "Нэг хүний ахиц, гацсан цэг, сурсан үг.",
    match: (p) => p === "/admin/learner" || p.startsWith("/admin/learner?"),
  },
  {
    href: "/admin/center",
    label: "Сургалтын төв",
    icon: "🏢",
    hint: "Бүлгүүдийг багш, түвшин, үнэлгээгээр харьцуулах.",
    match: (p) => p === "/admin/center",
  },
  {
    href: "/admin/center/report",
    label: "Төвийн тайлан (хэвлэх)",
    icon: "🖨",
    hint: "Хэвлэхэд бэлэн нэгдсэн тайлан.",
    match: (p) => p.startsWith("/admin/center/report"),
  },
  {
    href: "/admin/center/certificate",
    label: "Гэрчилгээ",
    icon: "🎖",
    hint: "Курсээ дүүргэсэн сурагчид олгох бичиг.",
    match: (p) => p.startsWith("/admin/center/certificate"),
  },
  {
    href: "/admin/b2b",
    label: "Сургууль, анги",
    icon: "🏫",
    hint: "Байгууллага, анги, багшийн урилга, хамтрах хүсэлт.",
    match: (p) => p.startsWith("/admin/b2b"),
  },
  {
    href: "/admin/tasks",
    label: "Ажлын жагсаалт",
    icon: "✅",
    hint: "Контентын хийх ажил, хэн юу хариуцаж байгаа.",
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
    label: "Үйлдлийн түүх",
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
    href: "/admin/chat",
    label: "Чатын мэдээлэл",
    icon: "💬",
    hint: "Мэдээлсэн мессеж, түгжих.",
    match: (p) => p.startsWith("/admin/chat"),
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

function pick(items: AdminNavItem[], hrefs: string[]): AdminNavItem[] {
  return hrefs
    .map((h) => items.find((i) => i.href === h))
    .filter((i): i is AdminNavItem => Boolean(i));
}

/** Цэс 4 ойлгомжтой бүлэгт: Самбар → Контент → Суралцагчид → Тайлан. */
export const ADMIN_NAV_SECTIONS: AdminNavSection[] = [
  {
    title: "Самбар",
    description: "Бүгд нэг харцаар, хувиар",
    items: pick(ADMIN_NAV_PRIMARY, ["/admin"]),
  },
  {
    title: "Контент",
    description: "Хичээл, шалгалт, бичлэг, импорт",
    items: pick(ADMIN_NAV_PRIMARY, [
      "/admin/lessons",
      "/admin/mock-tests/tutor-notes",
      "/admin/bichleg",
      "/admin/source",
      "/admin/import",
    ]),
  },
  {
    title: "Суралцагчид",
    description: "Хүмүүс, бүлэг, сургууль",
    items: pick(ADMIN_NAV_INSIGHTS, [
      "/admin/learners",
      "/admin/learner",
      "/admin/b2b",
      "/admin/center",
      "/admin/center/report",
      "/admin/center/certificate",
    ]),
  },
  {
    title: "Тайлан ба ажил",
    description: "Гүйцэтгэл, алдаа, хийх ажил",
    items: [
      ...pick(ADMIN_NAV_INSIGHTS, ["/admin/analytics", "/admin/feedback", "/admin/tasks"]),
      ...pick(ADMIN_NAV_ADVANCED, ["/admin/activity"]),
    ],
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
