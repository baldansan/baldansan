/** Live production deployment URL — no secrets. */
export const PRODUCTION_URL = "https://baldansan.vercel.app";

export const LAUNCH_STORAGE_KEY = "buunduu-launch-candidate";

export type LaunchCheckStatus = "not_checked" | "pass" | "warning" | "fail";

export type LaunchDecisionValue =
  | "not_set"
  | "launch_candidate"
  | "needs_review";

export type LaunchSectionId =
  | "public"
  | "admin"
  | "auth_progress"
  | "supabase_media";

export type LaunchStatusCardDefinition = {
  id: string;
  label: string;
  description: string;
  href?: string;
  productionPath?: string;
};

export type LaunchCheckItemDefinition = {
  id: string;
  section: LaunchSectionId;
  label: string;
  productionPath?: string;
};

export type LaunchItemState = {
  id: string;
  status: LaunchCheckStatus;
  notes: string;
  updatedAt: string;
};

export type LaunchCheckItem = LaunchCheckItemDefinition & LaunchItemState;

export type LaunchCardState = {
  id: string;
  status: LaunchCheckStatus;
  updatedAt: string;
};

export type LaunchDecisionState = {
  value: LaunchDecisionValue;
  updatedAt: string;
};

export const LAUNCH_STATUS_CARDS: LaunchStatusCardDefinition[] = [
  {
    id: "card-deployment-check",
    label: "Байршуулалтын шалгалт",
    description: "Нийтийн /deployment-check хурдан шалгалт",
    href: "/deployment-check",
    productionPath: "/deployment-check",
  },
  {
    id: "card-system-check",
    label: "Системийн шалгалт",
    description: "Админ талын Supabase холболтын шалгалт",
    href: "/admin/system-check",
    productionPath: "/admin/system-check",
  },
  {
    id: "card-production-qa",
    label: "Ажлын орчны чанарын шалгалт",
    description: "Хуудас болон удирдлагын хэсгийн гар шалгалт",
    href: "/admin/production-qa",
    productionPath: "/admin/production-qa",
  },
  {
    id: "card-security-audit",
    label: "Аюулгүй байдлын үзлэг",
    description: "RLS, нэвтрэлт, файл хадгалалт, харагдац",
    href: "/admin/security-audit",
    productionPath: "/admin/security-audit",
  },
  {
    id: "card-supabase-verification",
    label: "Supabase-ийн шалгалт",
    description: "production_verification.sql — алдаатай мөр байхгүй",
  },
  {
    id: "card-admin-cms",
    label: "Удирдлагын хэсгийн бэлэн байдал",
    description: "Үүсгэх, засах, нийтлэх урсгалыг шалгасан",
    href: "/admin/lessons",
    productionPath: "/admin/lessons",
  },
  {
    id: "card-public-routes",
    label: "Нийтийн хуудсуудын бэлэн байдал",
    description: "Суралцагчийн хуудсууд ажлын хаяг дээр",
    productionPath: "/courses/hsk5",
  },
  {
    id: "card-launch-blockers",
    label: "Саад болж буй зүйлийн тоо",
    description: "Доорх шалгалтын амжилтгүй зүйлсийг хянана уу",
  },
];

export const LAUNCH_SMOKE_CHECKLIST: LaunchCheckItemDefinition[] = [
  // Public
  { id: "smoke-home", section: "public", label: "Нүүр хуудас нээгдэнэ", productionPath: "/" },
  { id: "smoke-courses", section: "public", label: "Курсын хуудас нээгдэнэ", productionPath: "/courses" },
  { id: "smoke-hsk5", section: "public", label: "HSK5 курсын хуудас нээгдэнэ", productionPath: "/courses/hsk5" },
  { id: "smoke-lesson-1", section: "public", label: "1-р хичээлийн хуудас нээгдэнэ", productionPath: "/lessons/1" },
  { id: "smoke-lesson-1-watch", section: "public", label: "1-р хичээлийн бичлэг нээгдэнэ", productionPath: "/lessons/1/watch" },
  { id: "smoke-lesson-1-vocab", section: "public", label: "1-р хичээлийн үгсийн сан нээгдэнэ", productionPath: "/lessons/1/vocabulary" },
  { id: "smoke-lesson-1-quiz", section: "public", label: "1-р хичээлийн дасгал нээгдэнэ", productionPath: "/lessons/1/quiz" },
  { id: "smoke-login", section: "public", label: "Нэвтрэх хуудас нээгдэнэ", productionPath: "/login" },
  { id: "smoke-signup", section: "public", label: "Бүртгүүлэх хуудас нээгдэнэ", productionPath: "/signup" },
  { id: "smoke-profile", section: "public", label: "Нэвтэрсний дараа хувийн хуудас ажиллана", productionPath: "/profile" },
  { id: "smoke-review", section: "public", label: "Нэвтэрсний дараа давтлага ажиллана", productionPath: "/review" },
  // Admin
  { id: "smoke-admin-dash", section: "admin", label: "Хяналтын самбар нээгдэнэ", productionPath: "/admin" },
  { id: "smoke-system-check", section: "admin", label: "Системийн шалгалт давна", productionPath: "/admin/system-check" },
  { id: "smoke-production-qa", section: "admin", label: "Чанарын шалгалтын хуудас байна", productionPath: "/admin/production-qa" },
  { id: "smoke-security-audit", section: "admin", label: "Аюулгүй байдлын үзлэгийн хуудас байна", productionPath: "/admin/security-audit" },
  { id: "smoke-final-audit", section: "admin", label: "Эцсийн үзлэгийн хуудас байна", productionPath: "/admin/final-audit" },
  { id: "smoke-lesson-editor", section: "admin", label: "Хичээл засах хуудас нээгдэнэ", productionPath: "/admin/lessons/5/edit" },
  { id: "smoke-tasks", section: "admin", label: "Ажлын төв нээгдэнэ", productionPath: "/admin/tasks" },
  { id: "smoke-activity", section: "admin", label: "Үйлдлийн бүртгэл нээгдэнэ", productionPath: "/admin/activity" },
  { id: "smoke-analytics", section: "admin", label: "Тайлан нээгдэнэ", productionPath: "/admin/analytics" },
  // Auth / progress
  { id: "smoke-auth-login", section: "auth_progress", label: "Нэвтрэлт ажиллана", productionPath: "/login" },
  { id: "smoke-auth-logout", section: "auth_progress", label: "Гарах товч ажиллана" },
  { id: "smoke-quiz-save", section: "auth_progress", label: "Дасгалын оролдлого хадгалагдана", productionPath: "/lessons/1/quiz" },
  { id: "smoke-vocab-save", section: "auth_progress", label: "Сурсан үг хадгалагдана", productionPath: "/lessons/1/vocabulary" },
  { id: "smoke-lesson-progress", section: "auth_progress", label: "Хичээлийн ахиц хадгалагдана", productionPath: "/lessons/1" },
  { id: "smoke-guest-fallback", section: "auth_progress", label: "Нэвтрээгүй хэрэглэгчид ажиллаж байна", productionPath: "/lessons/1" },
  // Supabase / media
  { id: "smoke-public-lessons", section: "supabase_media", label: "Нийтийн хичээлүүд уншигдана", productionPath: "/deployment-check" },
  { id: "smoke-admin-profile", section: "supabase_media", label: "Админы бүртгэл уншигдана", productionPath: "/admin/system-check" },
  { id: "smoke-storage", section: "supabase_media", label: "Файл хадгалах сан ажиллана", productionPath: "/admin/system-check" },
  { id: "smoke-thumbnail", section: "supabase_media", label: "Нүүр зураг/медиа хаяг байвал нээгдэнэ", productionPath: "/lessons/1" },
  { id: "smoke-activity-insert", section: "supabase_media", label: "Үйлдлийн бүртгэл бичигдэнэ", productionPath: "/admin/activity" },
  { id: "smoke-task-persist", section: "supabase_media", label: "Ажил хадгалагдаж үлдэнэ", productionPath: "/admin/tasks" },
];

export const LAUNCH_SECTION_LABELS: Record<LaunchSectionId, string> = {
  public: "Нийтийн хуудсуудын шалгалт",
  admin: "Удирдлагын хэсгийн шалгалт",
  auth_progress: "Нэвтрэлт ба ахиц",
  supabase_media: "Supabase ба медиа",
};

export const KNOWN_LAUNCH_LIMITATIONS = [
  "Төлбөрийн систем алга — 7-р үе шатанд",
  "Гар утасны тусдаа апп алга — 8-р үе шатанд",
  "Нэвтрээгүй үеийн ахицыг хувийн хуудсаар нэвтэрч синк хийнэ",
  "Үйлдлийн бүртгэлийг хөтөч дээр нэвтэрсэн админаар уншина",
  "Бичлэг хөрвүүлэх/CDN алга — гадаад хаяг эсвэл Supabase Storage-ийг шууд ашиглана",
];

export function productionUrl(path: string): string {
  const base = PRODUCTION_URL.replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

export function defaultItemState(id: string): LaunchItemState {
  return {
    id,
    status: "not_checked",
    notes: "",
    updatedAt: new Date(0).toISOString(),
  };
}

export function defaultCardState(id: string): LaunchCardState {
  return {
    id,
    status: "not_checked",
    updatedAt: new Date(0).toISOString(),
  };
}

export function defaultDecision(): LaunchDecisionState {
  return { value: "not_set", updatedAt: new Date(0).toISOString() };
}

export function mergeLaunchItems(
  states: Record<string, LaunchItemState>
): LaunchCheckItem[] {
  return LAUNCH_SMOKE_CHECKLIST.map((def) => ({
    ...def,
    ...(states[def.id] ?? defaultItemState(def.id)),
  }));
}

export function mergeLaunchCards(
  states: Record<string, LaunchCardState>
): LaunchCardState[] {
  return LAUNCH_STATUS_CARDS.map(
    (def) => states[def.id] ?? defaultCardState(def.id)
  );
}
