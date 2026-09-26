import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Хэрэглэгчийн хувийн өгөгдлийг (auth user устгахаас өмнө) цэвэрлэнэ.
 * Бүртгэл устгах (/api/account/delete) болон хүүхдийн бүртгэл устгах
 * (/api/kids/delete) хоёулаа ашиглана.
 */

/** Tables whose rows belong to the user via a `user_id` column. */
export const USER_ID_TABLES = [
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
  "organization_members",
] as const;

/** Tables whose rows belong to the user via a `student_user_id` column. */
export const STUDENT_USER_ID_TABLES = ["classroom_students", "assignment_results"] as const;

/**
 * Best-effort data cleanup with a service-role client. Missing tables/columns
 * are ignored — the auth user delete cascades FK-linked rows anyway.
 * Returns the list of non-ignorable errors (empty = all clean).
 */
export async function deleteUserOwnedRows(
  service: SupabaseClient,
  userId: string
): Promise<string[]> {
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
  return cleanupErrors;
}

export function isIgnorableCleanupError(message: string): boolean {
  const lower = message.toLowerCase();
  // Only "table/column missing" style errors are ignorable — permission
  // or RLS errors must surface, otherwise deletion silently leaves data.
  return (
    lower.includes("does not exist") ||
    lower.includes("could not find") ||
    lower.includes("schema cache")
  );
}
