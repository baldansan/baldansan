import type { QuizQuestion } from "@/types/lesson";

export function parseOptionFeedback(
  value: unknown
): Record<string, string> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const out: Record<string, string> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    const trimmedKey = key.trim();
    const text = String(raw ?? "").trim();
    if (trimmedKey && text) {
      out[trimmedKey] = text;
    }
  }

  return Object.keys(out).length > 0 ? out : undefined;
}

export type QuizFeedbackTexts = {
  primary: string;
  secondary: string | null;
  usesOptionFeedback: boolean;
};

export function resolveQuizFeedbackTexts(
  question: QuizQuestion,
  selected: string | null,
  isCorrect: boolean
): QuizFeedbackTexts {
  const optionText =
    selected != null ? question.optionFeedback?.[selected]?.trim() : undefined;

  if (optionText) {
    return {
      primary: optionText,
      secondary: isCorrect ? null : question.explanation.trim() || null,
      usesOptionFeedback: true,
    };
  }

  return {
    primary: question.explanation.trim(),
    secondary: null,
    usesOptionFeedback: false,
  };
}
