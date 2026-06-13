import {
  nextAttemptNumber,
} from "@/lib/analytics/attempt-metrics";
import { HELZUI_COURSE_ID } from "@/lib/helzui/question-lookup";
import { HSK30_DUREM_COURSE_ID } from "@/lib/hsk30-durem/load-course";
import { getAuthenticatedUserId } from "@/lib/supabase/auth";
import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";

export type QuestionAttemptStage =
  | "grammar"
  | "grammar_exercise"
  | "quiz"
  | "mock_exam"
  | "word_practice"
  | "order"
  | "subject"
  | "predicate"
  | "hsk1"
  | "hsk2"
  | "hsk3"
  | "hsk4"
  | "hsk5"
  | "hsk6";

export type QuestionAttemptType = "choice" | "judge" | "order" | "fill";

export type RecordQuestionAttemptInput = {
  lessonId: string;
  stage: QuestionAttemptStage;
  questionId: string;
  questionType: QuestionAttemptType;
  isCorrect: boolean;
  selectedAnswer?: string | null;
  correctAnswer?: string | null;
  attemptNumber?: number;
  timeSpentMs?: number | null;
};

/** Fire-and-forget: never throws; failures are ignored. */
export function recordQuestionAttempt(input: RecordQuestionAttemptInput): void {
  if (!hasSupabaseConfig || !supabase) return;

  void (async () => {
    try {
      const { userId } = await getAuthenticatedUserId();
      const attemptNumber =
        input.attemptNumber ??
        nextAttemptNumber(input.lessonId, input.questionId);
      const { error } = await supabase.from("question_attempts").insert({
        user_id: userId,
        lesson_id: input.lessonId.trim(),
        stage: input.stage,
        question_id: input.questionId,
        question_type: input.questionType,
        is_correct: input.isCorrect,
        selected_answer: input.selectedAnswer ?? null,
        correct_answer: input.correctAnswer ?? null,
        attempt_number: attemptNumber,
        time_spent_ms: input.timeSpentMs ?? null,
      });
      if (error) return;
    } catch {
      // silent — analytics must not affect learner UX
    }
  })();
}

export function mapGrammarExerciseType(
  type: string
): QuestionAttemptType {
  if (type === "judge") return "judge";
  if (type === "fill") return "fill";
  return "choice";
}

export function mapExerciseKind(
  kind: string
): QuestionAttemptType {
  if (kind === "tf") return "judge";
  if (kind === "order" || kind === "scramble") return "order";
  return "choice";
}

export function mapExerciseStage(kind: string): QuestionAttemptStage {
  if (kind === "order" || kind === "scramble") return "order";
  return "grammar_exercise";
}

export function mapQuizQuestionType(
  type: string,
  sentenceOrder = false
): QuestionAttemptType {
  if (sentenceOrder || type === "sentence_order") return "order";
  if (type === "cloze") return "fill";
  return "choice";
}

export function mapQuizStage(sentenceOrder = false): QuestionAttemptStage {
  return sentenceOrder ? "order" : "quiz";
}

export function mapMockQuestionType(qType: string): QuestionAttemptType {
  if (qType === "judge") return "judge";
  if (qType === "order") return "order";
  if (
    qType === "complete" ||
    qType === "fill_char" ||
    qType === "fill_blank"
  ) {
    return "fill";
  }
  return "choice";
}

/** Helzui grammar self-assessment after answer reveal (lesson_id = helzui-suuri). */
export function recordHelzuiSelfAssessment(input: {
  moduleId: string;
  questionId: string;
  isCorrect: boolean;
}): void {
  recordQuestionAttempt({
    lessonId: HELZUI_COURSE_ID,
    stage: input.moduleId as QuestionAttemptStage,
    questionId: input.questionId,
    questionType: "order",
    isCorrect: input.isCorrect,
    selectedAnswer: input.isCorrect ? "self_correct" : "self_wrong",
  });
}

/** HSK 3.0 grammar review (lesson_id = hsk30-durem, stage = levelId). */
export function recordHsk30Attempt(input: {
  levelId: string;
  questionId: string;
  questionType: QuestionAttemptType;
  isCorrect: boolean;
  selectedAnswer?: string | null;
  correctAnswer?: string | null;
  timeSpentMs?: number | null;
}): void {
  recordQuestionAttempt({
    lessonId: HSK30_DUREM_COURSE_ID,
    stage: input.levelId as QuestionAttemptStage,
    questionId: input.questionId,
    questionType: input.questionType,
    isCorrect: input.isCorrect,
    selectedAnswer: input.selectedAnswer ?? null,
    correctAnswer: input.correctAnswer ?? null,
    timeSpentMs: input.timeSpentMs ?? null,
  });
}
