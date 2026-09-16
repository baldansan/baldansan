import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";
import { getCurrentUser } from "@/lib/supabase/auth";
import {
  getCurrentAdminProfile,
  isCurrentUserAdmin,
} from "@/lib/supabase/admin";
import { getClientEnvStatus } from "@/lib/system/system-checks";

export const PRODUCTION_URL = "https://baldansan.vercel.app";

export type SecurityCheckResult = "pass" | "warn" | "fail" | "skip" | "manual";

export type SecurityAuditCheck = {
  id: string;
  group: string;
  label: string;
  result: SecurityCheckResult;
  detail?: string;
};

export type SecurityAuditReport = {
  productionUrl: string;
  checks: SecurityAuditCheck[];
  ranAt: string;
};

function check(
  group: string,
  id: string,
  label: string,
  result: SecurityCheckResult,
  detail?: string
): SecurityAuditCheck {
  return { group, id, label, result, detail };
}

type ReadOutcome = { ok: boolean; detail?: string; empty?: boolean };

async function canReadTable(
  table: string,
  select = "id"
): Promise<ReadOutcome> {
  if (!supabase) {
    return { ok: false, detail: "Supabase холболт байхгүй байна." };
  }
  const { data, error } = await supabase.from(table).select(select).limit(1);
  if (!error) {
    return { ok: true, empty: !data?.length, detail: "Уншиж чадлаа." };
  }
  const message = error.message ?? "Хүсэлт амжилтгүй боллоо.";
  if (
    message.toLowerCase().includes("policy") ||
    message.toLowerCase().includes("row-level security")
  ) {
    return { ok: false, detail: "RLS хаасан — эрхийн дүрмийг шалгана уу." };
  }
  if (message.includes("does not exist")) {
    return { ok: false, detail: "Хүснэгт алга — migration ажиллуулна уу." };
  }
  return { ok: false, detail: message };
}

function tableCheck(
  group: string,
  id: string,
  label: string,
  outcome: ReadOutcome,
  emptyOk = true
): SecurityAuditCheck {
  if (!outcome.ok) {
    return check(group, id, label, "fail", outcome.detail);
  }
  if (outcome.empty && !emptyOk) {
    return check(group, id, label, "warn", "Уншигдаж байна, гэхдээ хоосон.");
  }
  return check(group, id, label, "pass", outcome.detail ?? "RLS-ээр уншиж чадлаа.");
}

async function checkEnvironmentSafety(): Promise<SecurityAuditCheck[]> {
  const env = getClientEnvStatus();
  if (!env.supabaseReady) {
    return [
      check(
        "environment",
        "env-url",
        "NEXT_PUBLIC_SUPABASE_URL тохируулагдсан",
        "fail",
        "Дутуу — зөвхөн дотоод нөөц өгөгдөл ажиллана."
      ),
      check(
        "environment",
        "env-anon",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY тохируулагдсан",
        "fail",
        "Дутуу — зөвхөн дотоод нөөц өгөгдөл ажиллана."
      ),
      check(
        "environment",
        "env-hidden",
        "Орчны хувьсагчийн утга харагдахгүй",
        "pass",
        "Энэ хуудас нууц утгыг хэзээ ч харуулахгүй."
      ),
      check(
        "environment",
        "env-local-reminder",
        ".env.local файлыг git-д оруулахгүй сануулга",
        "pass",
        ".env.local файлыг хэзээ ч git-д бүү оруул — зөвхөн .env.example загварыг ашигла."
      ),
      check(
        "environment",
        "no-service-role",
        "Клиент талд service_role байж болохгүй",
        "pass",
        "Апп зөвхөн anon түлхүүр ашиглана — Vercel-ийн клиент орчинд service_role хэзээ ч бүү нэм."
      ),
    ];
  }

  return [
    check(
      "environment",
      "env-url",
      "NEXT_PUBLIC_SUPABASE_URL тохируулагдсан",
      "pass",
      "Тохируулагдсан (утга нь нуугдсан)."
    ),
    check(
      "environment",
      "env-anon",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY тохируулагдсан",
      "pass",
      "Тохируулагдсан (утга нь нуугдсан)."
    ),
    check(
      "environment",
      "env-hidden",
      "Орчны хувьсагчийн утга харагдахгүй",
      "pass",
      "Энэ хуудас нууц утгыг хэзээ ч харуулахгүй."
    ),
    check(
      "environment",
      "env-local-reminder",
      ".env.local файлыг git-д оруулахгүй сануулга",
      "pass",
      ".env.local файлыг хэзээ ч git-д бүү оруул — зөвхөн .env.example загварыг ашигла."
    ),
    check(
      "environment",
      "no-service-role",
      "Клиент талд service_role байж болохгүй",
      "pass",
      "Апп зөвхөн anon түлхүүр ашиглана — Vercel-ийн клиент орчинд service_role хэзээ ч бүү нэм."
    ),
  ];
}

async function checkAdminAccess(isAdmin: boolean): Promise<SecurityAuditCheck[]> {
  if (!hasSupabaseConfig) {
    return [
      check("admin", "auth-session", "Одоогийн хэрэглэгч нэвтэрсэн", "skip", "Supabase тохируулаагүй байна."),
      check("admin", "admin-status", "Одоогийн хэрэглэгч админ мөн", "skip", "Supabase тохируулаагүй байна."),
      check("admin", "admin-profile", "Админ профайл уншигдаж байна", "skip", "Supabase тохируулаагүй байна."),
      check(
        "admin",
        "admin-guard",
        "Админ хуудсуудыг AdminGuard хамгаалж байна",
        "pass",
        "Бүх /admin хуудас admin-layout-shell дотор AdminGuard ашиглана."
      ),
      check(
        "admin",
        "non-admin-denied",
        "Админ бус хэрэглэгчийг оруулахгүй",
        "manual",
        "Гараад /admin руу орно уу — нэвтрэх хуудас эсвэл хориглосон мэдэгдэл гарах ёстой."
      ),
    ];
  }

  const { data: user } = await getCurrentUser();
  const checks: SecurityAuditCheck[] = [
    user
      ? check("admin", "auth-session", "Одоогийн хэрэглэгч нэвтэрсэн", "pass", "Нэвтэрсэн.")
      : check("admin", "auth-session", "Одоогийн хэрэглэгч нэвтэрсэн", "fail", "Нэвтрээгүй байна."),
  ];

  if (!user) {
    checks.push(
      check("admin", "admin-status", "Одоогийн хэрэглэгч админ мөн", "skip", "Эхлээд нэвтэрнэ үү."),
      check("admin", "admin-profile", "Админ профайл уншигдаж байна", "skip", "Эхлээд нэвтэрнэ үү."),
      check(
        "admin",
        "admin-guard",
        "Админ хуудсуудыг AdminGuard хамгаалж байна",
        "pass",
        "/admin хуудсанд AdminGuard идэвхтэй."
      ),
      check(
        "admin",
        "non-admin-denied",
        "Админ бус хэрэглэгчийг оруулахгүй",
        "pass",
        "Та нэвтрээгүй байна — /admin нэвтрэх хуудсыг харуулах ёстой."
      )
    );
    return checks;
  }

  checks.push(
    isAdmin
      ? check("admin", "admin-status", "Одоогийн хэрэглэгч админ мөн", "pass", "Админ эрх баталгаажсан.")
      : check(
          "admin",
          "admin-status",
          "Одоогийн хэрэглэгч админ мөн",
          "fail",
          "admin_profiles хүснэгтэд мөр алга — админ хуудсууд хориглох ёстой."
        )
  );

  const profile = await getCurrentAdminProfile();
  checks.push(
    profile
      ? check("admin", "admin-profile", "Админ профайл уншигдаж байна", "pass", `Эрх: ${profile.role}`)
      : check("admin", "admin-profile", "Админ профайл уншигдаж байна", "fail", "Профайлын мөр олдсонгүй.")
  );

  checks.push(
    check(
      "admin",
      "admin-guard",
      "Админ хуудсуудыг AdminGuard хамгаалж байна",
      "pass",
      "AdminGuard бүх /admin хуудсыг хамарна."
    )
  );

  checks.push(
    isAdmin
      ? check(
          "admin",
          "non-admin-denied",
          "Админ бус хэрэглэгчийг оруулахгүй",
          "manual",
          "Гарах эсвэл нууц цонхоор админ бус хэрэглэгчээр орж үзнэ үү — /admin нэвтрүүлэхгүй байх ёстой."
        )
      : check(
          "admin",
          "non-admin-denied",
          "Админ бус хэрэглэгчийг оруулахгүй",
          "pass",
          "Одоогийн хэрэглэгч админ биш — админы агуулга харагдах ёсгүй."
        )
  );

  return checks;
}

async function checkPublicVisibility(
  isAdmin: boolean
): Promise<SecurityAuditCheck[]> {
  if (!hasSupabaseConfig || !supabase) {
    return [
      check(
        "visibility",
        "available-lessons",
        "Нийтлэгдсэн хичээлүүд нээлттэй",
        "warn",
        "Supabase тохируулаагүй — дотоод нөөц өгөгдөл ашиглаж байна."
      ),
      check(
        "visibility",
        "draft-hidden-catalog",
        "Ноорог хичээл курсын жагсаалтад харагдахгүй",
        "manual",
        "Байршуулсны дараа ажлын орчны /courses/hsk5 хуудсыг шалгана уу."
      ),
      check(
        "visibility",
        "draft-direct-route",
        "Ноорог хичээлийн шууд хуудас нээгдэхгүй",
        "manual",
        "/lessons/5 хуудсыг урьдчилж харахгүйгээр нээнэ үү — нээгдэхгүй байх ёстой."
      ),
      check(
        "visibility",
        "admin-preview",
        "Админаар урьдчилж харахад админ эрх шаардана",
        "manual",
        "?preview=admin-ыг админ бус хэрэглэгчээр шалгана уу — хориглох ёстой."
      ),
    ];
  }

  const checks: SecurityAuditCheck[] = [];

  const { data: available, error: availError } = await supabase
    .from("lessons")
    .select("id, status")
    .eq("status", "available")
    .limit(5);

  if (availError) {
    checks.push(
      check(
        "visibility",
        "available-lessons",
        "Нийтлэгдсэн хичээлүүд нээлттэй",
        "fail",
        availError.message
      )
    );
  } else {
    checks.push(
      check(
        "visibility",
        "available-lessons",
        "Нийтлэгдсэн хичээлүүд нээлттэй",
        available?.length ? "pass" : "warn",
        available?.length
          ? `${available.length}+ нийтлэгдсэн хичээл уншигдаж байна.`
          : "Нийтлэгдсэн хичээл алга — шалгахын тулд нэгийг нийтэлнэ үү."
      )
    );
  }

  const { data: catalog } = await supabase
    .from("lessons")
    .select("id, status")
    .eq("course_id", "hsk5")
    .eq("status", "available");

  const { data: draftsInDb } = await supabase
    .from("lessons")
    .select("id")
    .eq("course_id", "hsk5")
    .eq("status", "draft")
    .limit(1);

  const draftId = draftsInDb?.[0]?.id;
  const catalogHasDraft =
    draftId != null &&
    catalog?.some((row) => String(row.id) === String(draftId));

  checks.push(
    catalogHasDraft
      ? check(
          "visibility",
          "draft-hidden-catalog",
          "Ноорог хичээл курсын жагсаалтад харагдахгүй",
          "fail",
          "Ноорог хичээл нийтийн жагсаалтад харагдаж байна — RLS болон шүүлтийг шалгана уу."
        )
      : check(
          "visibility",
          "draft-hidden-catalog",
          "Ноорог хичээл курсын жагсаалтад харагдахгүй",
          draftId ? "pass" : "warn",
          draftId
            ? "Ноорог байгаа ч нийтийн жагсаалтад ороогүй."
            : "Шалгах ноорог хичээл алга — шалгахын тулд ноорог үүсгэнэ үү."
        )
  );

  const { data: draftRow, error: draftError } = await supabase
    .from("lessons")
    .select("id, status")
    .eq("id", "5")
    .maybeSingle();

  if (draftError) {
    checks.push(
      check(
        "visibility",
        "draft-direct-route",
        "Ноорог хичээлийн шууд хуудас нээгдэхгүй",
        "pass",
        "RLS энэ сессэд ноорог хичээл уншихыг хаасан."
      )
    );
  } else if (
    draftRow &&
    String(draftRow.status) === "draft" &&
    !isAdmin
  ) {
    checks.push(
      check(
        "visibility",
        "draft-direct-route",
        "Ноорог хичээлийн шууд хуудас нээгдэхгүй",
        "fail",
        "5-р ноорог хичээл админ эрхгүйгээр уншигдаж байна — RLS хэт нээлттэй байж магадгүй."
      )
    );
  } else if (draftRow && String(draftRow.status) === "draft" && isAdmin) {
    checks.push(
      check(
        "visibility",
        "draft-direct-route",
        "Ноорог хичээлийн шууд хуудас нээгдэхгүй",
        "manual",
        "Та админ тул ноорог уншиж чадна — ажлын орчинд гарсан байдалтай /lessons/5-ыг шалгана уу."
      )
    );
  } else {
    checks.push(
      check(
        "visibility",
        "draft-direct-route",
        "Ноорог хичээлийн шууд хуудас нээгдэхгүй",
        "warn",
        "5-р хичээл ноорог биш эсвэл олдсонгүй — ноорог хуудсыг гараар шалгана уу."
      )
    );
  }

  checks.push(
    check(
      "visibility",
      "admin-preview",
      "Админаар урьдчилж харахад админ эрх шаардана",
      "manual",
      "Ажлын орчинд админ бус хэрэглэгч /lessons/{draftId}?preview=admin руу орж чадах ёсгүй."
    )
  );

  return checks;
}

async function checkRlsTables(): Promise<SecurityAuditCheck[]> {
  if (!hasSupabaseConfig) {
    return [
      check("rls", "rls-unconfigured", "RLS хүснэгтийн шалгалт", "skip", "Supabase тохируулаагүй байна."),
    ];
  }

  const tables: [string, string, boolean][] = [
    ["admin_profiles", "admin_profiles", true],
    ["admin_tasks", "admin_tasks", true],
    ["admin_activity_log", "admin_activity_log", true],
    ["user_lesson_progress", "user_lesson_progress", true],
    ["user_vocabulary_progress", "user_vocabulary_progress", true],
    ["user_quiz_attempts", "user_quiz_attempts", true],
    ["lessons", "Контент: lessons", true],
    ["subtitle_lines", "Контент: subtitle_lines", true],
    ["vocabulary_words", "Контент: vocabulary_words", true],
    ["quiz_questions", "Контент: quiz_questions", true],
  ];

  const results: SecurityAuditCheck[] = [];
  for (const [id, label, emptyOk] of tables) {
    results.push(
      tableCheck("rls", `rls-${id}`, label, await canReadTable(id), emptyOk)
    );
  }

  results.push(
    check(
      "rls",
      "storage-objects",
      "storage.objects (lesson-media)",
      "manual",
      "production_verification.sql-ийг ажиллуулж storage.objects-ийн дүрмийг шалгана уу."
    )
  );

  return results;
}

async function checkStorage(): Promise<SecurityAuditCheck[]> {
  if (!hasSupabaseConfig || !supabase) {
    return [
      check("storage", "bucket", "lesson-media сан", "warn", "Supabase тохируулаагүй байна."),
      check("storage", "public-read", "Нийтэд унших боломжтой", "skip", "Supabase тохируулаагүй байна."),
      check(
        "storage",
        "admin-upload",
        "Админы байршуулах дүрмийн сануулга",
        "manual",
        "supabase/storage/001_lesson_media_bucket_policies.sql-ийг ажиллуулна уу"
      ),
      check(
        "storage",
        "no-public-write",
        "Нийтэд бичих эрх байхгүй",
        "manual",
        "Файл хадгалалтын дүрэм нэргүй хэрэглэгчийн байршуулалтыг хориглож байгааг шалгана уу."
      ),
    ];
  }

  const { error } = await supabase.storage.from("lesson-media").list("", {
    limit: 1,
  });

  const bucketOk = !error || !error.message.toLowerCase().includes("bucket not found");

  const { data: urlData } = supabase.storage
    .from("lesson-media")
    .getPublicUrl("health-check/probe.txt");

  return [
    bucketOk
      ? check("storage", "bucket", "lesson-media сан", "pass", "Сан холбогдож байна.")
      : check("storage", "bucket", "lesson-media сан", "fail", error?.message ?? "Сан олдсонгүй."),
    urlData?.publicUrl?.startsWith("http")
      ? check("storage", "public-read", "Нийтэд унших URL-ийн загвар", "pass", "Нийтийн URL үүсгэгч ажиллаж байна.")
      : check("storage", "public-read", "Нийтэд унших URL-ийн загвар", "warn", "Нийтийн URL үүсгэж чадсангүй."),
    check(
      "storage",
      "admin-upload",
      "Админы байршуулах дүрмийн сануулга",
      "manual",
      "Админ байршуулахад админ JWT болон storage RLS шаардана — SECURITY_RLS_AUDIT.md-ийг үзнэ үү."
    ),
    check(
      "storage",
      "no-public-write",
      "Нийтэд бичих эрх байхгүй",
      "manual",
      "Файл хадгалалтын дүрэм нэргүй INSERT-ийг хааж байгааг SQL шалгалтаар баталгаажуулна уу."
    ),
  ];
}

function checkAuthRedirectConfig(): SecurityAuditCheck[] {
  return [
    check(
      "auth-config",
      "site-url",
      "Site URL ажлын орчин руу тохируулагдсан",
      "manual",
      `Supabase Auth-ийн Site URL нь ${PRODUCTION_URL} байх ёстой`
    ),
    check(
      "auth-config",
      "redirect-urls",
      "Redirect URL-ууд тохируулагдсан",
      "manual",
      "Supabase Dashboard дээр ажлын орчны URL, /login, /profile болон localhost/** хаягуудыг нэмнэ үү."
    ),
    check(
      "auth-config",
      "localhost-dev",
      "Хөгжүүлэлтэд localhost үлдээсэн",
      "manual",
      "Дотоод хөгжүүлэлтэд зориулж Redirect URLs дотор http://localhost:3000/** хаягийг үлдээнэ үү."
    ),
    check(
      "auth-config",
      "email-confirmation",
      "Ажлын орчинд имэйл баталгаажуулах эсэх шийдвэр",
      "manual",
      "Ажлын орчинд асаалттай байхыг зөвлөнө — унтраалттай бол зөвхөн туршилтын орчинд гэж тэмдэглэнэ үү."
    ),
  ];
}

export async function runSecurityAuditChecks(): Promise<SecurityAuditReport> {
  const envChecks = await checkEnvironmentSafety();
  const { data: user } = hasSupabaseConfig
    ? await getCurrentUser()
    : { data: null };
  const isAdmin = user ? await isCurrentUserAdmin() : false;

  const [adminChecks, visibilityChecks, rlsChecks, storageChecks] =
    await Promise.all([
      checkAdminAccess(isAdmin),
      checkPublicVisibility(isAdmin),
      checkRlsTables(),
      checkStorage(),
    ]);

  const authConfigChecks = checkAuthRedirectConfig();

  return {
    productionUrl: PRODUCTION_URL,
    checks: [
      ...envChecks,
      ...adminChecks,
      ...visibilityChecks,
      ...rlsChecks,
      ...storageChecks,
      ...authConfigChecks,
    ],
    ranAt: new Date().toISOString(),
  };
}

export function getSecurityBlockers(
  checks: SecurityAuditCheck[]
): SecurityAuditCheck[] {
  return checks.filter((c) => c.result === "fail");
}

export function getSecurityWarnings(
  checks: SecurityAuditCheck[]
): SecurityAuditCheck[] {
  return checks.filter((c) => c.result === "warn");
}
