import {
  buildSentenceFromTokenIndices,
  normalizeMockSentenceAnswer,
  seqIndicesFromStoredAnswer,
} from "@/lib/mock-test/sentence-order";
import type { QuizQuestion } from "@/types/lesson";

export {
  buildSentenceFromTokenIndices,
  normalizeMockSentenceAnswer,
  seqIndicesFromStoredAnswer,
};

const SENTENCE_ORDER_TAGS = new Set([
  "sk.writing.order",
  "sk.writing.complete",
  "sentence_order",
  "sentenceorder",
  "order_sentence",
]);

const SINGLE_SELECT_TYPES = new Set(["cloze", "multiple_choice"]);

function parseSlashTokensFromText(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed.includes("/")) return [];

  const colonMatch = trimmed.match(/[:：]\s*([\s\S]+)$/);
  const tail = colonMatch ? colonMatch[1].trim() : trimmed;
  if (!tail.includes("/")) {
    const slashLine = trimmed
      .split(/\n/)
      .map((line) => line.trim())
      .find((line) => line.includes("/"));
    if (!slashLine) return [];
    return slashLine
      .split("/")
      .map((part) => part.trim())
      .filter(Boolean);
  }

  return tail
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);
}

function hasSentenceOrderSkillTag(question: QuizQuestion): boolean {
  return (question.skillTags ?? []).some((tag) => SENTENCE_ORDER_TAGS.has(tag));
}

function isExplicitSentenceOrderType(question: QuizQuestion): boolean {
  return question.type === "sentence_order" || hasSentenceOrderSkillTag(question);
}

/** Ordered-token answer stored as JSON array in correct_answer (import / legacy). */
export function parseOrderedCorrectAnswer(
  correctAnswer: string
): string[] | null {
  const trimmed = correctAnswer.trim();
  if (!trimmed.startsWith("[")) return null;

  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (!Array.isArray(parsed) || parsed.length < 2) return null;
    const parts = parsed
      .map((item) => String(item ?? "").trim())
      .filter(Boolean);
    return parts.length >= 2 ? parts : null;
  } catch {
    return null;
  }
}

export function hasOrderedCorrectAnswer(question: QuizQuestion): boolean {
  return parseOrderedCorrectAnswer(question.correctAnswer) != null;
}

export function isQuizSingleSelectQuestion(question: QuizQuestion): boolean {
  if (SINGLE_SELECT_TYPES.has(question.type)) {
    return !hasOrderedCorrectAnswer(question);
  }
  return !isQuizSentenceOrderQuestion(question);
}

export function parseQuizSentenceOrderTokens(question: QuizQuestion): string[] {
  const orderedAnswer = parseOrderedCorrectAnswer(question.correctAnswer);
  if (orderedAnswer) return orderedAnswer;

  const fromQuestion = parseSlashTokensFromText(question.question);
  if (fromQuestion.length >= 2) return fromQuestion;

  if (!isExplicitSentenceOrderType(question)) return [];

  const options = question.options.map((part) => part.trim()).filter(Boolean);
  if (options.length >= 2 && options.every((part) => part.length <= 16)) {
    return options;
  }

  return [];
}

export function isQuizSentenceOrderQuestion(question: QuizQuestion): boolean {
  if (SINGLE_SELECT_TYPES.has(question.type) && !hasOrderedCorrectAnswer(question)) {
    return false;
  }

  return parseQuizSentenceOrderTokens(question).length >= 2;
}

export function quizSentenceOrderInstruction(question: QuizQuestion): string {
  const text = question.question.trim();
  if (!text) return "Үгсийг эвлүүлж зөв өгүүлбэр болго:";

  const withoutSlashTail = text
    .replace(/[:：]\s*[\s\S]*\/[\s\S]*$/, "")
    .trim();
  if (withoutSlashTail && withoutSlashTail !== text) {
    const cleaned = withoutSlashTail.replace(/[:：]\s*$/, "").trim();
    return cleaned.endsWith(":") || cleaned.endsWith("：")
      ? cleaned
      : `${cleaned}:`;
  }

  const lines = text.split(/\n/).map((line) => line.trim()).filter(Boolean);
  const instructionLine = lines.find((line) => !line.includes("/"));
  if (instructionLine) {
    const cleaned = instructionLine.replace(/[:：]\s*$/, "").trim();
    return cleaned.endsWith(":") || cleaned.endsWith("：")
      ? cleaned
      : `${cleaned}:`;
  }

  return "Үгсийг эвлүүлж зөв өгүүлбэр болго:";
}

export function gradeQuizSentenceOrder(
  question: QuizQuestion,
  userAnswer: string
): boolean {
  const ordered = parseOrderedCorrectAnswer(question.correctAnswer);
  if (ordered) {
    const expected = ordered.join("");
    return (
      normalizeMockSentenceAnswer(userAnswer) ===
      normalizeMockSentenceAnswer(expected)
    );
  }

  const correct = question.correctAnswer.trim();
  if (!correct) return false;
  return (
    normalizeMockSentenceAnswer(userAnswer) ===
    normalizeMockSentenceAnswer(correct)
  );
}
