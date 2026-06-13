import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/client";

export type LearnerOption = {
  userId: string;
  attemptCount: number;
  lastActiveAt: string | null;
};

export type LearnerAttemptRow = {
  id: string;
  lessonId: string;
  stage: string;
  questionId: string;
  questionType: string;
  isCorrect: boolean;
  attemptNumber: number;
  timeSpentMs: number | null;
  selectedAnswer: string | null;
  correctAnswer: string | null;
  createdAt: string;
};

export type LearnerFeedbackRow = {
  id: string;
  lessonId: string | null;
  stage: string;
  questionId: string | null;
  rating: string | null;
  note: string | null;
  pagePath: string | null;
  createdAt: string;
};

export type LearnerHardSpot = {
  lessonId: string;
  questionId: string;
  stage: string;
  wrongCount: number;
  totalAttempts: number;
  avgTimeMs: number | null;
};

export type LearnerDetailData = {
  userId: string;
  completedLessons: number;
  srsWordCount: number;
  mockAttempts: Array<{
    id: string;
    testId: string;
    score: number | null;
    maxScore: number | null;
    finishedAt: string | null;
  }>;
  recentAttempts: LearnerAttemptRow[];
  hardSpots: LearnerHardSpot[];
  feedback: LearnerFeedbackRow[];
  warnings: string[];
};

function resolveDefaultUserId(
  candidates: LearnerOption[],
  requested?: string | null
): string | null {
  if (requested) return requested;
  const envId = process.env.BETA_TESTER_USER_ID?.trim();
  if (envId) return envId;
  if (candidates.length === 0) return null;
  return candidates[0]?.userId ?? null;
}

export async function listLearnerOptions(): Promise<LearnerOption[]> {
  if (!hasSupabaseConfig) return [];
  const client = await createServerSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from("question_attempts")
    .select("user_id, created_at")
    .not("user_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error || !data) return [];

  const byUser = new Map<string, LearnerOption>();
  for (const row of data) {
    const userId = String(row.user_id);
    const existing = byUser.get(userId);
    const createdAt = String(row.created_at);
    if (!existing) {
      byUser.set(userId, {
        userId,
        attemptCount: 1,
        lastActiveAt: createdAt,
      });
    } else {
      existing.attemptCount += 1;
    }
  }

  return [...byUser.values()].sort((a, b) => b.attemptCount - a.attemptCount);
}

export async function getLearnerDetail(
  requestedUserId?: string | null
): Promise<LearnerDetailData | null> {
  const warnings: string[] = [];
  if (!hasSupabaseConfig) {
    return null;
  }

  const client = await createServerSupabaseClient();
  if (!client) return null;

  const options = await listLearnerOptions();
  const userId = resolveDefaultUserId(options, requestedUserId);
  if (!userId) {
    return {
      userId: "",
      completedLessons: 0,
      srsWordCount: 0,
      mockAttempts: [],
      recentAttempts: [],
      hardSpots: [],
      feedback: [],
      warnings: ["Одоогоор бүртгэгдсэн суралцагчийн оролдлого байхгүй."],
    };
  }

  const [progressRes, srsRes, mockRes, attemptsRes, feedbackRes] =
    await Promise.all([
      client
        .from("user_lesson_progress")
        .select("lesson_id, status")
        .eq("user_id", userId),
      client
        .from("user_word_srs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      client
        .from("user_test_attempts")
        .select("id, test_id, score, max_score, finished_at")
        .eq("user_id", userId)
        .order("finished_at", { ascending: false })
        .limit(10),
      client
        .from("question_attempts")
        .select(
          "id, lesson_id, stage, question_id, question_type, is_correct, attempt_number, time_spent_ms, selected_answer, correct_answer, created_at"
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(80),
      client
        .from("feedback")
        .select(
          "id, lesson_id, stage, question_id, rating, note, page_path, created_at"
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

  if (progressRes.error) warnings.push(progressRes.error.message);
  if (srsRes.error) warnings.push(srsRes.error.message);
  if (mockRes.error) warnings.push(mockRes.error.message);
  if (attemptsRes.error) warnings.push(attemptsRes.error.message);
  if (feedbackRes.error) warnings.push(feedbackRes.error.message);

  const completedLessons = (progressRes.data ?? []).filter(
    (r) => r.status === "completed"
  ).length;

  const recentAttempts: LearnerAttemptRow[] = (attemptsRes.data ?? []).map(
    (r) => ({
      id: String(r.id),
      lessonId: String(r.lesson_id),
      stage: String(r.stage),
      questionId: String(r.question_id),
      questionType: String(r.question_type),
      isCorrect: Boolean(r.is_correct),
      attemptNumber: Number(r.attempt_number ?? 1),
      timeSpentMs:
        r.time_spent_ms != null ? Number(r.time_spent_ms) : null,
      selectedAnswer: r.selected_answer ? String(r.selected_answer) : null,
      correctAnswer: r.correct_answer ? String(r.correct_answer) : null,
      createdAt: String(r.created_at),
    })
  );

  const hardMap = new Map<string, LearnerHardSpot & { timeSum: number; timeN: number }>();
  for (const row of attemptsRes.data ?? []) {
    const key = `${row.lesson_id}\0${row.question_id}\0${row.stage}`;
    const existing = hardMap.get(key) ?? {
      lessonId: String(row.lesson_id),
      questionId: String(row.question_id),
      stage: String(row.stage),
      wrongCount: 0,
      totalAttempts: 0,
      avgTimeMs: null,
      timeSum: 0,
      timeN: 0,
    };
    existing.totalAttempts += 1;
    if (!row.is_correct) existing.wrongCount += 1;
    if (row.time_spent_ms != null) {
      existing.timeSum += Number(row.time_spent_ms);
      existing.timeN += 1;
    }
    hardMap.set(key, existing);
  }

  const hardSpots: LearnerHardSpot[] = [...hardMap.values()]
    .map(({ timeSum, timeN, ...rest }) => ({
      ...rest,
      avgTimeMs: timeN > 0 ? Math.round(timeSum / timeN) : null,
    }))
    .sort((a, b) => {
      if (b.wrongCount !== a.wrongCount) return b.wrongCount - a.wrongCount;
      return (b.avgTimeMs ?? 0) - (a.avgTimeMs ?? 0);
    })
    .slice(0, 15);

  const feedback: LearnerFeedbackRow[] = (feedbackRes.data ?? []).map((r) => ({
    id: String(r.id),
    lessonId: r.lesson_id ? String(r.lesson_id) : null,
    stage: String(r.stage),
    questionId: r.question_id ? String(r.question_id) : null,
    rating: r.rating ? String(r.rating) : null,
    note: r.note ? String(r.note) : null,
    pagePath: r.page_path ? String(r.page_path) : null,
    createdAt: String(r.created_at),
  }));

  return {
    userId,
    completedLessons,
    srsWordCount: srsRes.count ?? 0,
    mockAttempts: (mockRes.data ?? []).map((r) => ({
      id: String(r.id),
      testId: String(r.test_id),
      score: r.score != null ? Number(r.score) : null,
      maxScore: r.max_score != null ? Number(r.max_score) : null,
      finishedAt: r.finished_at ? String(r.finished_at) : null,
    })),
    recentAttempts,
    hardSpots,
    feedback,
    warnings,
  };
}
