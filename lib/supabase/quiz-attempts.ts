import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";
import type { QuizDetailedAnswer } from "@/lib/quiz-answers";
import type { QuizResult, QuizResultEntry } from "@/lib/progress";

export type QuizAttemptAnswers =
  | QuizDetailedAnswer[]
  | Record<string, unknown>;

export type UserQuizAttemptRow = {
  id: string;
  user_id: string;
  lesson_id: string;
  score: number;
  total: number;
  percentage: number;
  answers: QuizAttemptAnswers;
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
  answers: QuizAttemptAnswers = []
): Promise<QuizAttemptsResult<UserQuizAttemptRow>> {
  if (!supabase) {
    return notConfigured();
  }

  let writeUserId: string | null = null;

  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();
  writeUserId = sessionData.session?.user?.id ?? null;

  if (!writeUserId) {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    writeUserId = userData.user?.id ?? null;
    if (!writeUserId) {
      return {
        data: null,
        error:
          toErrorMessage(userError) ??
          toErrorMessage(sessionError) ??
          "Not authenticated",
      };
    }
  }

  if (writeUserId !== userId) {
    console.warn(
      "[progress] Quiz insert using session user id (caller id mismatch)."
    );
  }

  const { error } = await supabase.from("user_quiz_attempts").insert({
    user_id: writeUserId,
    lesson_id: lessonId,
    score,
    total,
    percentage,
    answers,
  });

  if (error) {
    return { data: null, error: toErrorMessage(error) };
  }

  return { data: null, error: null };
}

export { hasSupabaseConfig };
