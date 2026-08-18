import { NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  hasServerSupabaseConfig,
} from "@/lib/supabase/server";
import {
  createServiceRoleSupabaseClient,
  hasServiceRoleSupabaseConfig,
} from "@/lib/supabase/service-role-server";

/**
 * Permanently deletes the signed-in user's account and all their data.
 * Required for Google Play / App Store compliance (account deletion).
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY on the server (Vercel env) because
 * deleting the auth user needs admin privileges. RLS-protected rows in
 * newer tables cascade via FK; older tables are cleaned explicitly.
 */

/** Tables whose rows belong to the user via a `user_id` column. */
const USER_ID_TABLES = [
  "user_lesson_progress",
  "user_vocabulary_progress",
  "user_quiz_attempts",
  "user_daily_activity",
  "user_daily_goals",
  "user_streaks",
  "user_achievements",
  "user_notifications",
  "user_study_reminders",
  "user_saved_words",
  "user_word_srs",
  "user_video_progress",
  "user_mock_attempts",
  "user_test_attempts",
  "question_attempts",
  "reviews",
  "feedback",
  "student_profiles",
  "teacher_profiles",
] as const;

/** Tables whose rows belong to the user via a `student_user_id` column. */
const STUDENT_USER_ID_TABLES = ["classroom_students", "assignment_results"] as const;

export async function POST() {
  if (!hasServerSupabaseConfig) {
    return NextResponse.json(
      { ok: false, message: "Supabase тохируулагдаагүй." },
      { status: 503 }
    );
  }

  const sessionClient = await createServerSupabaseClient();
  if (!sessionClient) {
    return NextResponse.json(
      { ok: false, message: "Server client үүсгэж чадсангүй." },
      { status: 503 }
    );
  }

  const { data: auth } = await sessionClient.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) {
    return NextResponse.json(
      { ok: false, message: "Нэвтэрсэн байх шаардлагатай." },
      { status: 401 }
    );
  }

  if (!hasServiceRoleSupabaseConfig) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Бүртгэл устгах боломж түр идэвхгүй байна. Та санал хүсэлтээр " +
          "(эсвэл имэйлээр) устгуулах хүсэлт илгээнэ үү.",
        adminHint:
          "Vercel → Settings → Environment Variables дээр SUPABASE_SERVICE_ROLE_KEY нэмнэ үү.",
      },
      { status: 503 }
    );
  }

  const service = createServiceRoleSupabaseClient();
  if (!service) {
    return NextResponse.json(
      { ok: false, message: "Service client үүсгэж чадсангүй." },
      { status: 503 }
    );
  }

  // Best-effort data cleanup. Missing tables/columns are ignored —
  // the auth user delete below cascades FK-linked rows anyway.
  const cleanupErrors: string[] = [];
  for (const table of USER_ID_TABLES) {
    const { error } = await service.from(table).delete().eq("user_id", userId);
    if (error && !isIgnorableCleanupError(error.message)) {
      cleanupErrors.push(`${table}: ${error.message}`);
    }
  }
  for (const table of STUDENT_USER_ID_TABLES) {
    const { error } = await service
      .from(table)
      .delete()
      .eq("student_user_id", userId);
    if (error && !isIgnorableCleanupError(error.message)) {
      cleanupErrors.push(`${table}: ${error.message}`);
    }
  }

  const { error: deleteUserError } = await service.auth.admin.deleteUser(userId);
  if (deleteUserError) {
    return NextResponse.json(
      {
        ok: false,
        message: `Бүртгэл устгахад алдаа гарлаа: ${deleteUserError.message}`,
        cleanupErrors,
      },
      { status: 500 }
    );
  }

  // Clear the (now invalid) session cookies.
  await sessionClient.auth.signOut();

  return NextResponse.json({ ok: true, message: "Бүртгэл бүрмөсөн устлаа.", cleanupErrors });
}

function isIgnorableCleanupError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("does not exist") ||
    lower.includes("could not find") ||
    lower.includes("relation") ||
    lower.includes("column")
  );
}
