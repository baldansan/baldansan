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

export function parseQuizSentenceOrderTokens(question: QuizQuestion): string[] {
  const fromQuestion = parseSlashTokensFromText(question.question);
  if (fromQuestion.length >= 2) return fromQuestion;

  const options = question.options.map((part) => part.trim()).filter(Boolean);
  if (options.length >= 2 && options.every((part) => part.length <= 16)) {
    return options;
  }

  return [];
}

export function isQuizSentenceOrderQuestion(question: QuizQuestion): boolean {
  if (question.type === "sentence_order") {
    return parseQuizSentenceOrderTokens(question).length >= 2;
  }

  const tags = question.skillTags ?? [];
  if (tags.some((tag) => SENTENCE_ORDER_TAGS.has(tag))) {
    return parseQuizSentenceOrderTokens(question).length >= 2;
  }

  if (parseQuizSentenceOrderTokens(question).length < 2) return false;

  if (question.options.length === 0) return true;

  return question.type === "cloze";
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
  const correct = question.correctAnswer.trim();
  if (!correct) return false;
  return (
    normalizeMockSentenceAnswer(userAnswer) ===
    normalizeMockSentenceAnswer(correct)
  );
}
