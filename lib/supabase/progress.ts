import type { LessonPathStageId } from "@/lib/lesson/build-lesson-path";
import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";
import type { LessonStatus } from "@/lib/progress";

export type UserLessonProgressRow = {
  user_id: string;
  lesson_id: string;
  status: string;
  progress_percent: number;
  completed_stages: LessonPathStageId[];
  completed_at: string | null;
  updated_at: string;
};

const LESSON_PATH_STAGE_IDS = new Set<LessonPathStageId>([
  "goal_warmup",
  "vocabulary",
  "text",
  "grammar",
  "practice",
  "quiz",
  "summary",
]);

export function parseCompletedStagesJson(
  value: unknown,
  allowedStageIds?: readonly LessonPathStageId[]
): LessonPathStageId[] {
  if (!Array.isArray(value)) return [];
  const allowed = allowedStageIds
    ? new Set(allowedStageIds)
    : LESSON_PATH_STAGE_IDS;
  const seen = new Set<LessonPathStageId>();
  const out: LessonPathStageId[] = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    const id = item as LessonPathStageId;
    if (!allowed.has(id) || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

export function lessonPathProgressPercent(
  completedCount: number,
  totalStages: number
): number {
  if (totalStages <= 0) return 0;
  if (completedCount >= totalStages) return 100;
  return Math.round((completedCount / totalStages) * 100);
}

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
    .select(
      "user_id, lesson_id, status, progress_percent, completed_stages, completed_at, updated_at"
    )
    .eq("user_id", userId)
    .order("lesson_id", { ascending: true });

  return {
    data: normalizeLessonProgressRows(data),
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
    .select(
      "user_id, lesson_id, status, progress_percent, completed_stages, completed_at, updated_at"
    )
    .eq("user_id", userId)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  return {
    data: data ? normalizeLessonProgressRow(data) : null,
    error: toErrorMessage(error),
  };
}

function normalizeLessonProgressRow(row: Record<string, unknown>): UserLessonProgressRow {
  return {
    user_id: String(row.user_id),
    lesson_id: String(row.lesson_id),
    status: String(row.status),
    progress_percent: Number(row.progress_percent) || 0,
    completed_stages: parseCompletedStagesJson(row.completed_stages),
    completed_at: (row.completed_at as string | null) ?? null,
    updated_at: String(row.updated_at),
  };
}

function normalizeLessonProgressRows(
  rows: Record<string, unknown>[] | null
): UserLessonProgressRow[] {
  return (rows ?? []).map((row) => normalizeLessonProgressRow(row));
}

export async function upsertUserLessonProgress(
  userId: string,
  lessonId: string,
  status: LessonStatus,
  progressPercent: number,
  completedStages: LessonPathStageId[] = []
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
    completed_stages: completedStages,
    completed_at: status === "completed" ? now : null,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from("user_lesson_progress")
    .upsert(row, { onConflict: "user_id,lesson_id" })
    .select(
      "user_id, lesson_id, status, progress_percent, completed_stages, completed_at, updated_at"
    )
    .single();

  return {
    data: data ? normalizeLessonProgressRow(data as Record<string, unknown>) : null,
    error: toErrorMessage(error),
  };
}

export async function upsertLessonPathStageProgress(
  userId: string,
  lessonId: string,
  completedStageIds: LessonPathStageId[],
  totalStages: number
): Promise<ProgressResult<UserLessonProgressRow>> {
  const progressPercent = lessonPathProgressPercent(
    completedStageIds.length,
    totalStages
  );
  const allDone = totalStages > 0 && completedStageIds.length >= totalStages;
  const status: LessonStatus = allDone
    ? "completed"
    : completedStageIds.length > 0 || progressPercent > 0
      ? "started"
      : "started";

  return upsertUserLessonProgress(
    userId,
    lessonId,
    status,
    allDone ? 100 : progressPercent,
    completedStageIds
  );
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

  const progressPercent = existing.data?.progress_percent ?? 0;
  return upsertUserLessonProgress(
    userId,
    lessonId,
    "started",
    progressPercent > 0 ? progressPercent : 50,
    existing.data?.completed_stages ?? []
  );
}

export async function markSupabaseLessonCompleted(
  userId: string,
  lessonId: string
): Promise<ProgressResult<UserLessonProgressRow>> {
  const existing = await getUserLessonProgressByLesson(userId, lessonId);
  if (existing.error) {
    return { data: null, error: existing.error };
  }

  return upsertUserLessonProgress(
    userId,
    lessonId,
    "completed",
    100,
    existing.data?.completed_stages ?? []
  );
}

export { hasSupabaseConfig };
