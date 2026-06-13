import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/client";

export type QuestionAttemptStageFilter =
  | "all"
  | "grammar_exercise"
  | "quiz"
  | "mock_exam"
  | "word_practice";

export type QuestionAttemptAggregateRow = {
  lessonId: string;
  questionId: string;
  stage: string;
  questionType: string;
  totalAttempts: number;
  wrongCount: number;
  correctCount: number;
  wrongPercent: number;
  correctPercent: number;
};

export type LessonAttemptAggregateRow = {
  lessonId: string;
  totalAttempts: number;
  correctCount: number;
  correctPercent: number;
};

export type QuestionAttemptsAnalyticsOverview = {
  totalAttempts: number;
  questionStats: QuestionAttemptAggregateRow[];
  hardestQuestions: QuestionAttemptAggregateRow[];
  lessonStats: LessonAttemptAggregateRow[];
  warnings: string[];
};

type AttemptRow = {
  lesson_id: string;
  question_id: string;
  stage: string;
  question_type: string;
  is_correct: boolean;
};

function aggregateAttempts(
  rows: AttemptRow[]
): {
  questions: QuestionAttemptAggregateRow[];
  lessons: LessonAttemptAggregateRow[];
  totalAttempts: number;
} {
  const byQuestion = new Map<string, QuestionAttemptAggregateRow>();
  const byLesson = new Map<string, LessonAttemptAggregateRow>();
  let totalAttempts = 0;

  for (const row of rows) {
    totalAttempts += 1;
    const qKey = `${row.lesson_id}\0${row.question_id}\0${row.stage}\0${row.question_type}`;
    const qExisting = byQuestion.get(qKey) ?? {
      lessonId: row.lesson_id,
      questionId: row.question_id,
      stage: row.stage,
      questionType: row.question_type,
      totalAttempts: 0,
      wrongCount: 0,
      correctCount: 0,
      wrongPercent: 0,
      correctPercent: 0,
    };
    qExisting.totalAttempts += 1;
    if (row.is_correct) qExisting.correctCount += 1;
    else qExisting.wrongCount += 1;
    byQuestion.set(qKey, qExisting);

    const lExisting = byLesson.get(row.lesson_id) ?? {
      lessonId: row.lesson_id,
      totalAttempts: 0,
      correctCount: 0,
      correctPercent: 0,
    };
    lExisting.totalAttempts += 1;
    if (row.is_correct) lExisting.correctCount += 1;
    byLesson.set(row.lesson_id, lExisting);
  }

  const questions = [...byQuestion.values()].map((row) => {
    const wrongPercent =
      row.totalAttempts > 0
        ? Math.round((row.wrongCount / row.totalAttempts) * 100)
        : 0;
    const correctPercent =
      row.totalAttempts > 0
        ? Math.round((row.correctCount / row.totalAttempts) * 100)
        : 0;
    return { ...row, wrongPercent, correctPercent };
  });

  const lessons = [...byLesson.values()].map((row) => ({
    ...row,
    correctPercent:
      row.totalAttempts > 0
        ? Math.round((row.correctCount / row.totalAttempts) * 100)
        : 0,
  }));

  return { questions, lessons, totalAttempts };
}

export async function getQuestionAttemptsAnalytics(): Promise<QuestionAttemptsAnalyticsOverview> {
  const warnings: string[] = [];

  if (!hasSupabaseConfig) {
    return {
      totalAttempts: 0,
      questionStats: [],
      hardestQuestions: [],
      lessonStats: [],
      warnings: ["Supabase is not configured."],
    };
  }

  const client = await createServerSupabaseClient();
  if (!client) {
    return {
      totalAttempts: 0,
      questionStats: [],
      hardestQuestions: [],
      lessonStats: [],
      warnings: ["Could not create Supabase server client."],
    };
  }

  let query = client
    .from("question_attempts")
    .select("lesson_id, question_id, stage, question_type, is_correct")
    .order("created_at", { ascending: false })
    .limit(20000);

  const { data, error } = await query;

  if (error) {
    if (
      error.message.includes("question_attempts") ||
      error.code === "42P01"
    ) {
      warnings.push(
        "question_attempts table not found — run migration 045_question_attempts.sql (supabase db push)."
      );
    } else {
      warnings.push(error.message);
    }
    return {
      totalAttempts: 0,
      questionStats: [],
      hardestQuestions: [],
      lessonStats: [],
      warnings,
    };
  }

  const rows = (data ?? []) as AttemptRow[];
  const { questions, lessons, totalAttempts } = aggregateAttempts(rows);

  const hardestQuestions = questions
    .filter((row) => row.totalAttempts >= 1)
    .sort((a, b) => {
      if (b.wrongPercent !== a.wrongPercent) return b.wrongPercent - a.wrongPercent;
      return b.totalAttempts - a.totalAttempts;
    });

  const lessonStats = lessons
    .filter((row) => row.totalAttempts >= 1)
    .sort((a, b) => a.correctPercent - b.correctPercent);

  if (totalAttempts === 0) {
    warnings.push(
      "No question attempts recorded yet. Learners must answer questions after migration is applied."
    );
  }

  return {
    totalAttempts,
    questionStats: questions,
    hardestQuestions: hardestQuestions.slice(0, 50),
    lessonStats: lessonStats.slice(0, 40),
    warnings,
  };
}
