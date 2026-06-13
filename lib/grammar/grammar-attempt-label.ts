import { parseGrammarQuestionId } from "@/lib/lesson/grammar-question-id";

export function formatGrammarAttemptPointLabel(questionId: string): string {
  const { pointSlug } = parseGrammarQuestionId(questionId);
  return pointSlug;
}

export function formatGrammarAttemptQuestionLabel(questionId: string): string {
  const parsed = parseGrammarQuestionId(questionId);
  if (parsed.kind === "check") return "Шалгаад үз";
  if (parsed.exerciseIndex != null) {
    return `Дасгал ${parsed.exerciseIndex}`;
  }
  return questionId;
}
