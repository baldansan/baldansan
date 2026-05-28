import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";
import type { QuizResult, QuizResultEntry } from "@/lib/progress";

export type UserQuizAttemptRow = {
  id: string;
  user_id: string;
  lesson_id: string;
  score: number;
  total: number;
  percentage: number;
  answers: Record<string, unknown>;
  created_at: string;
};

export type QuizAttemptsResult<T> = {
  data: T | null;
  error: string | null;
};

const NOT_CONFIGURED_MESSAGE =
  "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.";

function notConfigured<T>(): QuizAttemptsResult<T> {
  return { data: null, error: NOT_CONFIGURED_MESSAGE };
}

function toErrorMessage(error: { message: string } | null): string | null {
  return error?.message ?? null;
}

export function aggregateAttemptsToQuizResult(
  attempts: UserQuizAttemptRow[]
): QuizResult | null {
  if (attempts.length === 0) {
    return null;
  }

  const sorted = [...attempts].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const latest = sorted[0];
  const bestPercentage = Math.max(...attempts.map((row) => row.percentage));

  return {
    score: latest.score,
    total: latest.total,
    percentage: latest.percentage,
    bestPercentage,
    updatedAt: latest.created_at,
  };
}

export function groupQuizAttemptsToEntries(
  attempts: UserQuizAttemptRow[]
): QuizResultEntry[] {
  const byLesson = new Map<string, UserQuizAttemptRow[]>();

  for (const row of attempts) {
    const list = byLesson.get(row.lesson_id) ?? [];
    list.push(row);
    byLesson.set(row.lesson_id, list);
  }

  return [...byLesson.entries()]
    .map(([lessonId, rows]) => {
      const result = aggregateAttemptsToQuizResult(rows);
      if (!result) {
        return null;
      }
      return { lessonId, result };
    })
    .filter((entry): entry is QuizResultEntry => entry != null)
    .sort(
      (a, b) =>
        new Date(b.result.updatedAt).getTime() -
        new Date(a.result.updatedAt).getTime()
    );
}

export async function getUserQuizAttempts(
  userId: string
): Promise<QuizAttemptsResult<UserQuizAttemptRow[]>> {
  if (!supabase) {
    return notConfigured();
  }

  const { data, error } = await supabase
    .from("user_quiz_attempts")
    .select(
      "id, user_id, lesson_id, score, total, percentage, answers, created_at"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return {
    data: (data as UserQuizAttemptRow[] | null) ?? [],
    error: toErrorMessage(error),
  };
}

export async function getUserQuizAttemptsByLesson(
  userId: string,
  lessonId: string
): Promise<QuizAttemptsResult<UserQuizAttemptRow[]>> {
  if (!supabase) {
    return notConfigured();
  }

  const { data, error } = await supabase
    .from("user_quiz_attempts")
    .select(
      "id, user_id, lesson_id, score, total, percentage, answers, created_at"
    )
    .eq("user_id", userId)
    .eq("lesson_id", lessonId)
    .order("created_at", { ascending: false });

  return {
    data: (data as UserQuizAttemptRow[] | null) ?? [],
    error: toErrorMessage(error),
  };
}

export async function saveSupabaseQuizAttempt(
  userId: string,
  lessonId: string,
  score: number,
  total: number,
  percentage: number,
  answers: Record<string, unknown> = {}
): Promise<QuizAttemptsResult<UserQuizAttemptRow>> {
  if (!supabase) {
    return notConfigured();
  }

  const { data, error } = await supabase
    .from("user_quiz_attempts")
    .insert({
      user_id: userId,
      lesson_id: lessonId,
      score,
      total,
      percentage,
      answers,
    })
    .select(
      "id, user_id, lesson_id, score, total, percentage, answers, created_at"
    )
    .single();

  return {
    data: data as UserQuizAttemptRow | null,
    error: toErrorMessage(error),
  };
}

export { hasSupabaseConfig };
