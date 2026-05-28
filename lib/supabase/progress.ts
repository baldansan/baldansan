import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";
import type { LessonStatus } from "@/lib/progress";

export type UserLessonProgressRow = {
  user_id: string;
  lesson_id: string;
  status: string;
  progress_percent: number;
  completed_at: string | null;
  updated_at: string;
};

export type ProgressResult<T> = {
  data: T | null;
  error: string | null;
};

const NOT_CONFIGURED_MESSAGE =
  "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.";

function notConfigured<T>(): ProgressResult<T> {
  return { data: null, error: NOT_CONFIGURED_MESSAGE };
}

function toErrorMessage(error: { message: string } | null): string | null {
  return error?.message ?? null;
}

export function statusToProgressPercent(status: LessonStatus): number {
  switch (status) {
    case "completed":
      return 100;
    case "started":
      return 50;
    default:
      return 0;
  }
}

export function normalizeLessonStatus(status: string): LessonStatus {
  if (status === "completed" || status === "started") {
    return status;
  }
  return "not_started";
}

export async function getUserLessonProgress(
  userId: string
): Promise<ProgressResult<UserLessonProgressRow[]>> {
  if (!supabase) {
    return notConfigured();
  }

  const { data, error } = await supabase
    .from("user_lesson_progress")
    .select("user_id, lesson_id, status, progress_percent, completed_at, updated_at")
    .eq("user_id", userId)
    .order("lesson_id", { ascending: true });

  return {
    data: (data as UserLessonProgressRow[] | null) ?? [],
    error: toErrorMessage(error),
  };
}

export async function getUserLessonProgressByLesson(
  userId: string,
  lessonId: string
): Promise<ProgressResult<UserLessonProgressRow | null>> {
  if (!supabase) {
    return notConfigured();
  }

  const { data, error } = await supabase
    .from("user_lesson_progress")
    .select("user_id, lesson_id, status, progress_percent, completed_at, updated_at")
    .eq("user_id", userId)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  return {
    data: (data as UserLessonProgressRow | null) ?? null,
    error: toErrorMessage(error),
  };
}

export async function upsertUserLessonProgress(
  userId: string,
  lessonId: string,
  status: LessonStatus,
  progressPercent: number
): Promise<ProgressResult<UserLessonProgressRow>> {
  if (!supabase) {
    return notConfigured();
  }

  const now = new Date().toISOString();
  const row = {
    user_id: userId,
    lesson_id: lessonId,
    status,
    progress_percent: progressPercent,
    completed_at: status === "completed" ? now : null,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from("user_lesson_progress")
    .upsert(row, { onConflict: "user_id,lesson_id" })
    .select("user_id, lesson_id, status, progress_percent, completed_at, updated_at")
    .single();

  return {
    data: data as UserLessonProgressRow | null,
    error: toErrorMessage(error),
  };
}

export async function markSupabaseLessonStarted(
  userId: string,
  lessonId: string
): Promise<ProgressResult<UserLessonProgressRow>> {
  const existing = await getUserLessonProgressByLesson(userId, lessonId);
  if (existing.error) {
    return { data: null, error: existing.error };
  }
  if (existing.data?.status === "completed") {
    return { data: existing.data, error: null };
  }

  return upsertUserLessonProgress(userId, lessonId, "started", 50);
}

export async function markSupabaseLessonCompleted(
  userId: string,
  lessonId: string
): Promise<ProgressResult<UserLessonProgressRow>> {
  return upsertUserLessonProgress(userId, lessonId, "completed", 100);
}

export { hasSupabaseConfig };
