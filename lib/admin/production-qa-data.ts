/** Live production deployment URL — no secrets. */
export const PRODUCTION_URL = "https://baldansan.vercel.app";

export type QaCheckStatus = "not_checked" | "pass" | "warning" | "fail";

export type QaCheckSectionId =
  | "public"
  | "v1"
  | "admin"
  | "auth"
  | "supabase"
  | "cms";

export type QaCheckItemDefinition = {
  id: string;
  section: QaCheckSectionId;
  label: string;
  route?: string;
  purpose: string;
  expected: string;
  /** Path on production (opens in new tab). */
  productionPath?: string;
};

export type QaCheckItemState = {
  id: string;
  status: QaCheckStatus;
  notes: string;
  updatedAt: string;
};

export type QaCheckItem = QaCheckItemDefinition & QaCheckItemState;

export const QA_STORAGE_KEY = "buunduu-production-qa";

export const QA_CHECKLIST: QaCheckItemDefinition[] = [
  // Public routes
  {
    id: "public-home",
    section: "public",
    label: "Нүүр хуудас",
    route: "/",
    purpose: "Нүүр хуудас нээгдэнэ",
    expected: "Хуудас алдаагүй харагдана",
    productionPath: "/",
  },
  {
    id: "public-deployment-check",
    section: "public",
    label: "Байршуулалтын шалгалт",
    route: "/deployment-check",
    purpose: "Нийтэд нээлттэй байршуулалтын шалгалт",
    expected: "Шалгалтууд давсан; нууц мэдээлэл харагдахгүй",
    productionPath: "/deployment-check",
  },
  {
    id: "public-courses",
    section: "public",
    label: "Курсууд",
    route: "/courses",
    purpose: "Курсын жагсаалт",
    expected: "Курсууд харагдана",
    productionPath: "/courses",
  },
  {
    id: "public-hsk5",
    section: "public",
    label: "HSK5 курс",
    route: "/courses/hsk5",
    purpose: "Зөвхөн нийтлэгдсэн хичээлүүд",
    expected: "Зөвхөн нийтлэгдсэн хичээл жагсаана",
    productionPath: "/courses/hsk5",
  },
  {
    id: "public-lesson-1",
    section: "public",
    label: "1-р хичээлийн хуудас",
    route: "/lessons/1",
    purpose: "Хичээлийн дэлгэрэнгүй хуудас",
    expected: "Хичээлийн агуулга ачаална",
    productionPath: "/lessons/1",
  },
  {
    id: "public-lesson-1-watch",
    section: "public",
    label: "1-р хичээлийн бичлэг",
    route: "/lessons/1/watch",
    purpose: "Бичлэг ба хадмал",
    expected: "Бичлэг, хадмалын хэсэг нээгдэнэ",
    productionPath: "/lessons/1/watch",
  },
  {
    id: "public-lesson-1-vocab",
    section: "public",
    label: "1-р хичээлийн үгсийн сан",
    route: "/lessons/1/vocabulary",
    purpose: "Үгсийн жагсаалт",
    expected: "Үгс харагдана",
    productionPath: "/lessons/1/vocabulary",
  },
  {
    id: "public-lesson-1-quiz",
    section: "public",
    label: "1-р хичээлийн дасгал",
    route: "/lessons/1/quiz",
    purpose: "Дасгалын урсгал",
    expected: "Дасгал нээгдэж, хариу илгээгдэнэ",
    productionPath: "/lessons/1/quiz",
  },
  {
    id: "public-login",
    section: "public",
    label: "Нэвтрэх",
    route: "/login",
    purpose: "Нэвтрэх хуудас",
    expected: "Маягт харагдана; redirect URL тохируулсны дараа нэвтрэлт ажиллана",
    productionPath: "/login",
  },
  {
    id: "public-signup",
    section: "public",
    label: "Бүртгүүлэх",
    route: "/signup",
    purpose: "Бүртгүүлэх хуудас",
    expected: "Маягт харагдана; бүртгэл үүснэ",
    productionPath: "/signup",
  },
  {
    id: "public-profile",
    section: "public",
    label: "Хувийн хуудас",
    route: "/profile",
    purpose: "Хэрэглэгчийн самбар",
    expected: "Нэвтэрсэн үед нээгдэнэ",
    productionPath: "/profile",
  },
  {
    id: "public-review",
    section: "public",
    label: "Давтлага",
    route: "/review",
    purpose: "Сурсан үгийн давтлага",
    expected: "Хуудас харагдана",
    productionPath: "/review",
  },
  {
    id: "public-feedback",
    section: "public",
    label: "Санал хүсэлт",
    route: "/feedback",
    purpose: "Санал хүсэлтийн хуудас",
    expected: "Маягт нээгдэнэ",
    productionPath: "/feedback",
  },
  // v1.0 learner launch
  {
    id: "v1-public-routes",
    section: "v1",
    label: "Нийтийн хуудсууд давсан",
    purpose: "Үндсэн суралцагчийн хуудсууд ажлын орчинд нээгдэнэ",
    expected: "Нүүр, курсууд, HSK5, 1-р хичээлийн урсгал — 500 алдаагүй",
    productionPath: "/courses/hsk5",
  },
  {
    id: "v1-auth",
    section: "v1",
    label: "Нэвтрэлт давсан",
    purpose: "Нэвтрэх, бүртгүүлэх, сешн хадгалагдах",
    expected: "Нэвтрэлт ажиллана; нэвтэрсний дараа хувийн самбар нээгдэнэ",
    productionPath: "/login",
  },
  {
    id: "v1-progress",
    section: "v1",
    label: "Ахиц давсан",
    purpose: "Үг, дасгал, хичээлийн ахиц хадгалагдана",
    expected: "Нэвтрээгүй үед төхөөрөмж дээр, нэвтэрсэн үед бүртгэлд синк хийгдэнэ",
    productionPath: "/lessons/1/quiz",
  },
  {
    id: "v1-mobile",
    section: "v1",
    label: "Гар утас давсан",
    purpose: "Үндсэн хуудсууд 375px өргөнд",
    expected: "Цэс эвдрээгүй, товчнууд уншигдана, хичээлийн алхмын мөр ажиллана",
    productionPath: "/",
  },
  {
    id: "v1-draft-hidden",
    section: "v1",
    label: "Ноорог хичээл нуугдсан",
    purpose: "Нийтийн жагсаалтад ноорог орохгүй",
    expected: "HSK5 жагсаалтад ноорог байхгүй; шууд хаягаар орвол байхгүй гэж гарна",
    productionPath: "/courses/hsk5",
  },
  {
    id: "v1-no-blockers",
    section: "v1",
    label: "Саад болох зүйл байхгүй",
    purpose: "V1_LAUNCH_BLOCKERS.md дахь ноцтой саадууд",
    expected: "Ноцтой зүйлс бүгд давсан; V1_STABILIZATION_REPORT.md-ийг үзнэ үү",
    productionPath: "/deployment-check",
  },
  // Admin routes
  {
    id: "admin-dashboard",
    section: "admin",
    label: "Хяналтын самбар",
    route: "/admin",
    purpose: "Админы нүүр",
    expected: "Тоон үзүүлэлт, картууд ачаална",
    productionPath: "/admin",
  },
  {
    id: "admin-system-check",
    section: "admin",
    label: "Системийн шалгалт",
    route: "/admin/system-check",
    purpose: "Supabase холболтын шалгалт",
    expected: "Админаар нэвтэрсэн үед амжилтгүй мөр байхгүй",
    productionPath: "/admin/system-check",
  },
  {
    id: "admin-final-audit",
    section: "admin",
    label: "Эцсийн үзлэг",
    route: "/admin/final-audit",
    purpose: "5-р үе шатны бэлэн байдлын жагсаалт",
    expected: "Шалгах жагсаалт харагдана",
    productionPath: "/admin/final-audit",
  },
  {
    id: "admin-lesson-builder",
    section: "admin",
    label: "Хичээл угсрах хэсэг",
    route: "/admin/lesson-builder",
    purpose: "Алхам алхмаар хичээл үүсгэх",
    expected: "Хэсэг нээгдэнэ",
    productionPath: "/admin/lesson-builder",
  },
  {
    id: "admin-lessons",
    section: "admin",
    label: "Хичээлийн жагсаалт",
    route: "/admin/lessons",
    purpose: "Контентын чанарын хүснэгт",
    expected: "Чанарын тэмдэгтэй хичээлийн жагсаалт гарна",
    productionPath: "/admin/lessons",
  },
  {
    id: "admin-lessons-new",
    section: "admin",
    label: "Шинэ хичээл",
    route: "/admin/lessons/new",
    purpose: "Ноорог үүсгэх",
    expected: "Үүсгэх маягт нээгдэнэ",
    productionPath: "/admin/lessons/new",
  },
  {
    id: "admin-lessons-5-edit",
    section: "admin",
    label: "5-р хичээлийг засах",
    route: "/admin/lessons/5/edit",
    purpose: "Ноорог/агуулга засах",
    expected: "Засах хуудас нээгдэнэ (эсвэл хичээл олдсонгүй гэж гарна)",
    productionPath: "/admin/lessons/5/edit",
  },
  {
    id: "admin-tasks",
    section: "admin",
    label: "Ажлын төв",
    route: "/admin/tasks",
    purpose: "Шалгах ажлын дараалал",
    expected: "Ажлууд ачаална",
    productionPath: "/admin/tasks",
  },
  {
    id: "admin-activity",
    section: "admin",
    label: "Үйлдлийн бүртгэл",
    route: "/admin/activity",
    purpose: "Хийсэн үйлдлийн түүх",
    expected: "Бүртгэл ачаална (хөтчийн сешнээр)",
    productionPath: "/admin/activity",
  },
  {
    id: "admin-analytics",
    section: "admin",
    label: "Тайлан",
    route: "/admin/analytics",
    purpose: "Сургалтын үзүүлэлт",
    expected: "Тайлангийн самбар нээгдэнэ",
    productionPath: "/admin/analytics",
  },
  {
    id: "admin-prompts",
    section: "admin",
    label: "Prompt-ын сан",
    route: "/admin/prompts",
    purpose: "AI prompt-ын загварууд",
    expected: "Prompt-ын сан нээгдэнэ",
    productionPath: "/admin/prompts",
  },
  {
    id: "admin-production-qa",
    section: "admin",
    label: "Ажлын орчны чанарын шалгалт",
    route: "/admin/production-qa",
    purpose: "Гаргалтын шалгах жагсаалт",
    expected: "Энэ хуудас нээгдэнэ",
    productionPath: "/admin/production-qa",
  },
  // Auth
  {
    id: "auth-signup-opens",
    section: "auth",
    label: "Бүртгүүлэх хуудас нээгдэнэ",
    purpose: "Бүртгэл рүү орох боломжтой",
    expected: "Ажлын орчинд бүртгүүлэх маягт харагдана",
    productionPath: "/signup",
  },
  {
    id: "auth-login-opens",
    section: "auth",
    label: "Нэвтрэх хуудас нээгдэнэ",
    purpose: "Нэвтрэх рүү орох боломжтой",
    expected: "Ажлын орчинд нэвтрэх маягт харагдана",
    productionPath: "/login",
  },
  {
    id: "auth-admin-login",
    section: "auth",
    label: "Админ нэвтэрч чадна",
    purpose: "Админы нэвтрэх мэдээлэл ажиллана",
    expected: "Ажлын хаяг дээр админ нэвтэрнэ",
  },
  {
    id: "auth-logout",
    section: "auth",
    label: "Гарах ажиллана",
    purpose: "Сешн цэвэрлэгдэнэ",
    expected: "Гарсны дараа нэвтрээгүй төлөвт шилжинэ",
  },
  {
    id: "auth-profile-user",
    section: "auth",
    label: "Хувийн хуудсанд хэрэглэгч харагдана",
    purpose: "Нэвтэрсэн хэрэглэгчийн хуудас",
    expected: "Нэвтэрсэн үед и-мэйл/хэрэглэгч харагдана",
    productionPath: "/profile",
  },
  {
    id: "auth-admin-blocked-logged-out",
    section: "auth",
    label: "Нэвтрээгүй үед админ хаагдана",
    purpose: "AdminGuard хамгаалалт",
    expected: "/admin нь админ биш хэрэглэгчийг оруулахгүй",
    productionPath: "/admin",
  },
  {
    id: "auth-admin-works-logged-in",
    section: "auth",
    label: "Нэвтэрсэн үед админ ажиллана",
    purpose: "Админы хандалт",
    expected: "Админ хэрэглэгчид админы хуудсууд нээгдэнэ",
    productionPath: "/admin",
  },
  {
    id: "auth-supabase-redirect",
    section: "auth",
    label: "Supabase redirect URL тохируулсан",
    purpose: "Нэвтрэлтийн буцах хаяг",
    expected: "Ажлын хаяг Supabase Auth Redirect URL-д байна",
  },
  {
    id: "auth-security-audit",
    section: "auth",
    label: "Аюулгүй байдлын үзлэг дууссан",
    purpose: "Аюулгүй байдал / RLS-ийн эцсийн үзлэг",
    expected: "/admin/security-audit дээр автомат алдаа байхгүй; гар шалгалтуудыг хянасан",
    productionPath: "/admin/security-audit",
  },
  // Supabase
  {
    id: "supabase-public-content",
    section: "supabase",
    label: "Нийтийн контент уншигдана",
    purpose: "Суралцагчийн контент",
    expected: "/deployment-check эсвэл /courses/hsk5 өгөгдөл харуулна",
    productionPath: "/deployment-check",
  },
  {
    id: "supabase-lessons-read",
    section: "supabase",
    label: "Хичээлийн хүснэгт уншигдана",
    purpose: "Контент татах",
    expected: "Системийн эсвэл байршуулалтын шалгалт давна",
    productionPath: "/admin/system-check",
  },
  {
    id: "supabase-admin-profile",
    section: "supabase",
    label: "Админы бүртгэл уншигдана",
    purpose: "Админы эрх",
    expected: "Системийн шалгалтын админы бүртгэл давна",
    productionPath: "/admin/system-check",
  },
  {
    id: "supabase-progress-tables",
    section: "supabase",
    label: "Нэвтэрсний дараа ахицын хүснэгтүүд",
    purpose: "Хэрэглэгчийн ахицын RLS",
    expected: "Нэвтэрсэн үед хувийн хуудас, ахиц ажиллана",
    productionPath: "/profile",
  },
  {
    id: "supabase-admin-tasks",
    section: "supabase",
    label: "Админы ажлын хүснэгт нээгдэнэ",
    purpose: "Ажлын төвийн өгөгдөл",
    expected: "/admin/tasks ажлуудыг ачаална",
    productionPath: "/admin/tasks",
  },
  {
    id: "supabase-admin-activity",
    section: "supabase",
    label: "Админы үйлдлийн хүснэгт нээгдэнэ",
    purpose: "Үйлдлийн бүртгэлийн өгөгдөл",
    expected: "Нэвтэрсэн үед /admin/activity мөрүүд харуулна",
    productionPath: "/admin/activity",
  },
  {
    id: "supabase-storage-url",
    section: "supabase",
    label: "Файл хадгалах нийтийн хаяг ажиллана",
    purpose: "lesson-media сан",
    expected: "Системийн шалгалтын хадгалалт давна",
    productionPath: "/admin/system-check",
  },
  {
    id: "supabase-media-thumbnail",
    section: "supabase",
    label: "Медиа нүүр зураг нээгдэнэ",
    purpose: "Хичээлийн медиа харагдац",
    expected: "Байршуулсан бол хичээл дээр нүүр зураг харагдана",
    productionPath: "/lessons/1",
  },
  // CMS workflow
  {
    id: "cms-create-draft",
    section: "cms",
    label: "Ноорог хичээл үүсгэх",
    purpose: "Шинэ контент",
    expected: "Ноорог Supabase-д хадгалагдана",
    productionPath: "/admin/lessons/new",
  },
  {
    id: "cms-edit-metadata",
    section: "cms",
    label: "Ерөнхий мэдээлэл засах",
    purpose: "Хичээлийн талбарууд",
    expected: "Ерөнхий мэдээлэл амжилттай хадгалагдана",
    productionPath: "/admin/lessons/5/edit",
  },
  {
    id: "cms-bulk-import",
    section: "cms",
    label: "JSON-оор бөөнөөр оруулах",
    purpose: "Контент оруулах",
    expected: "Оруулсан өгөгдөл шалгагдаж хадгалагдана",
    productionPath: "/admin/lessons/5/edit",
  },
  {
    id: "cms-subtitle-add",
    section: "cms",
    label: "Хадмал гараар нэмэх",
    purpose: "Хадмал засварлагч",
    expected: "Хадмалын мөр хадгалагдана",
    productionPath: "/admin/lessons/5/edit",
  },
  {
    id: "cms-vocab-add",
    section: "cms",
    label: "Үг гараар нэмэх",
    purpose: "Үгсийн сангийн засварлагч",
    expected: "Үгийн мөр хадгалагдана",
    productionPath: "/admin/lessons/5/edit",
  },
  {
    id: "cms-quiz-add",
    section: "cms",
    label: "Дасгал гараар нэмэх",
    purpose: "Дасгалын засварлагч",
    expected: "Асуултын мөр хадгалагдана",
    productionPath: "/admin/lessons/5/edit",
  },
  {
    id: "cms-media-upload",
    section: "cms",
    label: "Медиа байршуулах",
    purpose: "Файл байршуулах",
    expected: "Файл lesson-media руу байршина",
    productionPath: "/admin/lessons/5/edit",
  },
  {
    id: "cms-export-backup",
    section: "cms",
    label: "Нөөц хуулбар гаргах",
    purpose: "JSON гаргах",
    expected: "JSON файл татагдана",
    productionPath: "/admin/lessons/5/edit",
  },
  {
    id: "cms-publish-unpublish",
    section: "cms",
    label: "Нийтлэх / нийтлэхээ болих",
    purpose: "Харагдац",
    expected: "Төлөв өөрчлөгдөхөд /courses/hsk5 дээр тусна",
    productionPath: "/admin/lessons/5/edit",
  },
  {
    id: "cms-activity-log",
    section: "cms",
    label: "Үйлдлийн бүртгэл үүснэ",
    purpose: "Хийсэн үйлдлийн түүх",
    expected: "Үйлдэл /admin/activity дээр гарч ирнэ",
    productionPath: "/admin/activity",
  },
  {
    id: "cms-task-dismiss",
    section: "cms",
    label: "Ажил хаах / шийдэх",
    purpose: "Ажлын урсгал",
    expected: "Ажлын төлвийн өөрчлөлт хадгалагдана",
    productionPath: "/admin/tasks",
  },
  {
    id: "cms-rollback-preview",
    section: "cms",
    label: "Буцаах урьдчилсан харагдац байна",
    purpose: "Аюулгүй буцаалт",
    expected: "Үйлдлийн дэлгэрэнгүйд буцаах урьдчилсан харагдац гарна",
    productionPath: "/admin/activity",
  },
];

export const QA_SECTION_LABELS: Record<QaCheckSectionId, string> = {
  public: "Нийтийн хуудсуудын жагсаалт",
  v1: "v1.0 суралцагчийн гаргалтын жагсаалт",
  admin: "Удирдлагын хуудсуудын жагсаалт",
  auth: "Нэвтрэлтийн жагсаалт",
  supabase: "Supabase-ийн жагсаалт",
  cms: "Удирдлагын хэсгийн урсгалын жагсаалт",
};

export function productionUrl(path: string): string {
  const base = PRODUCTION_URL.replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

export function defaultItemState(id: string): QaCheckItemState {
  return {
    id,
    status: "not_checked",
    notes: "",
    updatedAt: new Date(0).toISOString(),
  };
}

export function mergeChecklistWithState(
  states: Record<string, QaCheckItemState>
): QaCheckItem[] {
  return QA_CHECKLIST.map((def) => ({
    ...def,
    ...(states[def.id] ?? defaultItemState(def.id)),
  }));
}
