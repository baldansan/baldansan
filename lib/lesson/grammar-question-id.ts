import type { HskPackageGrammarPoint } from "@/types/hsk-lesson-package";

/** Stable slug for question_attempts.question_id (e.g. rúhé → rúhé-ex-1). */
export function grammarPointSlug(
  point: HskPackageGrammarPoint,
  index: number
): string {
  const pin = point.pinyin?.trim();
  if (pin) {
    return pin.replace(/\s+/g, "-").toLowerCase();
  }
  const fromPoint = point.point.trim();
  if (fromPoint) {
    const ascii = fromPoint
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase();
    if (ascii.length >= 2) return ascii.slice(0, 24);
  }
  return `gp${index + 1}`;
}

export function grammarExerciseQuestionId(
  slug: string,
  exerciseIndex: number
): string {
  return `${slug}-ex-${exerciseIndex + 1}`;
}

export function grammarCheckQuestionId(slug: string): string {
  return `${slug}-check`;
}

export function parseGrammarQuestionId(questionId: string): {
  pointSlug: string;
  kind: "exercise" | "check";
  exerciseIndex: number | null;
} {
  if (questionId.endsWith("-check")) {
    return {
      pointSlug: questionId.slice(0, -"-check".length),
      kind: "check",
      exerciseIndex: null,
    };
  }
  const match = questionId.match(/^(.+)-ex-(\d+)$/);
  if (match) {
    return {
      pointSlug: match[1]!,
      kind: "exercise",
      exerciseIndex: Number(match[2]),
    };
  }
  return { pointSlug: questionId, kind: "exercise", exerciseIndex: null };
}
