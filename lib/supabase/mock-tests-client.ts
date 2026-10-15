import {
  toAttemptScoreMetadata,
  type HskScoreBreakdown,
  type WritingSelfGrade,
} from "@/lib/mock-test/hsk-scoring";
import type { MockTestExamMode, MockTestScoreResult } from "@/lib/mock-test/types";
import { awardPoints } from "@/lib/points/award";
import { examPoints } from "@/lib/points/points-config";
import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";

export async function saveCheckpointAttempt(
  testId: string,
  scored: MockTestScoreResult,
  hsk: HskScoreBreakdown,
  examMode: MockTestExamMode,
  writingGrades: Record<number, WritingSelfGrade> = {}
): Promise<{ ok: boolean; error?: string }> {
  if (!supabase || !hasSupabaseConfig) {
    return { ok: false, error: "Supabase тохируулагдаагүй." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Нэвтрээгүй хэрэглэгч." };
  }

  const metadata = toAttemptScoreMetadata(hsk, writingGrades);

  const { data: attempt, error: attemptErr } = await supabase
    .from("user_test_attempts")
    .insert({
      user_id: user.id,
      test_id: testId,
      mode: examMode,
      status: "completed",
      finished_at: new Date().toISOString(),
      raw_score: hsk.totalScore,
      max_score: hsk.maxTotal,
      score_metadata: metadata,
    })
    .select("id")
    .single();

  if (attemptErr || !attempt) {
    return { ok: false, error: attemptErr?.message ?? "Оролдлого хадгалахад алдаа." };
  }

  const responses = scored.details.map((d) => ({
    attempt_id: attempt.id,
    question_id: d.questionId,
    user_answer: d.userAnswer,
    is_correct: d.isCorrect,
  }));

  if (responses.length) {
    const { error: respErr } = await supabase
      .from("user_question_responses")
      .insert(responses);
    if (respErr) return { ok: false, error: respErr.message };
  }

  // Оноо: шалгалт бүр нэг удаа (тэнцсэн бол 100 + оноо%).
  const percent = hsk.maxTotal > 0 ? (hsk.totalScore / hsk.maxTotal) * 100 : 0;
  awardPoints("exam", String(attempt.id), examPoints(percent, percent >= 60), {
    label: testId,
    testId,
    percent: Math.round(percent),
  });

  return { ok: true };
}

export async function fetchCompletedLessonIdsClient(
  lessonIds: string[]
): Promise<Set<string>> {
  if (!supabase || !hasSupabaseConfig || lessonIds.length === 0) {
    return new Set();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Set();

  const { data, error } = await supabase
    .from("user_lesson_progress")
    .select("lesson_id")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .in("lesson_id", lessonIds);

  if (error || !data) return new Set();
  return new Set(data.map((row) => String(row.lesson_id)));
}
