import "server-only";

export type LessonLoadFailureKind =
  | "supabase_config_missing"
  | "supabase_fetch_failed"
  | "lesson_not_found"
  | "permission_denied"
  | "server_error";

export type LessonLoadFetchSource = "supabase" | "local" | "none";

export type LessonLoadDebugInfo = {
  lessonId: string;
  fetchSource: LessonLoadFetchSource;
  supabaseUrlPresent: boolean;
  supabaseAnonKeyPresent: boolean;
  errorMessage?: string;
};

export function buildLessonLoadDebugInfo(
  lessonId: string,
  overrides: Partial<LessonLoadDebugInfo> = {}
): LessonLoadDebugInfo {
  return {
    lessonId,
    fetchSource: "none",
    supabaseUrlPresent: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseAnonKeyPresent: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    ...overrides,
  };
}

export function lessonLoadFailureTitle(kind: LessonLoadFailureKind): string {
  switch (kind) {
    case "supabase_config_missing":
      return "Supabase тохиргоо дутуу байна";
    case "supabase_fetch_failed":
      return "Supabase-аас хичээл татахад алдаа гарлаа";
    case "lesson_not_found":
      return "Хичээл олдсонгүй";
    case "permission_denied":
      return "Хандах эрхгүй";
    case "server_error":
      return "Серверийн алдаа";
  }
}

export function lessonLoadFailureDescription(kind: LessonLoadFailureKind): string {
  switch (kind) {
    case "supabase_config_missing":
      return "NEXT_PUBLIC_SUPABASE_URL болон NEXT_PUBLIC_SUPABASE_ANON_KEY .env.local файлд тохируулсан эсэхийг шалгана уу.";
    case "supabase_fetch_failed":
      return "Сүлжээ эсвэл Supabase холболтыг шалгаад дахин оролдоно уу.";
    case "lesson_not_found":
      return "Энэ хичээлийн ID олдсонгүй. Импорт хийсэн эсэх, ID зөв эсэхийг шалгана уу.";
    case "permission_denied":
      return "Хичээл байж магадгүй ч RLS эсвэл нэвтрэлтийн эрх хангалтгүй байна.";
    case "server_error":
      return "Хичээл ачаалах үед сервер дээр алдаа гарлаа.";
  }
}

export function shouldShowLessonLoadDebugDetails(): boolean {
  return process.env.NODE_ENV === "development";
}
