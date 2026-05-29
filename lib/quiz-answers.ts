import type { QuizQuestion, QuizQuestionType } from "@/types/lesson";

/** Per-question answer saved in user_quiz_attempts.answers JSONB array. */
export type QuizDetailedAnswer = {
  questionId?: string | number;
  dbId?: number;
  orderIndex: number;
  type: QuizQuestionType | string;
  question: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
};

export function buildQuizDetailedAnswer(
  question: QuizQuestion,
  orderIndex: number,
  selectedAnswer: string
): QuizDetailedAnswer {
  const isCorrect = selectedAnswer === question.correctAnswer;
  return {
    ...(question.dbId != null ? { dbId: question.dbId, questionId: question.dbId } : { questionId: question.id }),
    orderIndex,
    type: question.type,
    question: question.question,
    selectedAnswer,
    correctAnswer: question.correctAnswer,
    isCorrect,
  };
}

function isDetailedAnswerItem(value: unknown): value is QuizDetailedAnswer {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.question === "string" &&
    typeof row.selectedAnswer === "string" &&
    typeof row.isCorrect === "boolean"
  );
}

/** Parse answers JSONB from quiz attempts (array, legacy object, or empty). */
export function parseQuizAttemptAnswers(answers: unknown): QuizDetailedAnswer[] {
  if (Array.isArray(answers)) {
    return answers.filter(isDetailedAnswerItem);
  }
  return [];
}

export function questionAnalyticsKey(answer: QuizDetailedAnswer): string {
  if (answer.dbId != null) return `db:${answer.dbId}`;
  if (answer.questionId != null) return `id:${answer.questionId}`;
  return `q:${answer.orderIndex}:${answer.question}`;
}

export function hasDetailedQuizAnswers(answers: unknown): boolean {
  return parseQuizAttemptAnswers(answers).length > 0;
}
