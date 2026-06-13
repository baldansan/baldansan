import type { MockTestQuestionRow } from "@/lib/mock-test/types";

/** Scoring-тай ижил: зай, тэмдэглэгээг хасна. */
export function normalizeMockSentenceAnswer(value: string): string {
  return value
    .trim()
    .replace(/[\s.,，。、；;：:！!？?"""''「」『』]/g, "");
}

const SENTENCE_ORDER_TAGS = new Set([
  "sk.writing.order",
  "sk.writing.complete",
]);

/** 排序成句 — stem дээр "/" тусгаарласан үгстэй бичих хэсгийн асуулт. */
export function parseSentenceOrderTokens(
  question: MockTestQuestionRow
): string[] {
  const stem = question.stem?.trim() ?? "";
  if (!stem) return [];

  const match = stem.match(/[:：]\s*([\s\S]+)$/);
  if (!match) return [];

  const tail = match[1].trim();
  if (!tail.includes("/")) return [];

  return tail
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function sentenceOrderInstruction(stem: string | null): string {
  const text = stem?.trim() ?? "";
  if (!text) return "Үгсийг зөв дарааллаар эвлүүлнэ үү.";
  return text.replace(/[:：]\s*[\s\S]+$/, "").trim() || text;
}

export function isMockSentenceOrderQuestion(
  question: MockTestQuestionRow
): boolean {
  if (question.q_type !== "complete") return false;

  const tags = question.tags ?? [];
  if (tags.some((tag) => SENTENCE_ORDER_TAGS.has(tag))) {
    return parseSentenceOrderTokens(question).length >= 2;
  }

  return parseSentenceOrderTokens(question).length >= 2;
}

export function buildSentenceFromTokenIndices(
  tokens: string[],
  indices: number[]
): string {
  return indices.map((i) => tokens[i] ?? "").join("");
}

export function gradeMockSentenceOrder(
  question: MockTestQuestionRow,
  userAnswer: string
): boolean {
  const correct = question.correct_answer?.trim() ?? "";
  if (!correct) return false;
  return (
    normalizeMockSentenceAnswer(userAnswer) ===
    normalizeMockSentenceAnswer(correct)
  );
}

/** Хадгалсан хариултаас индекс дарааллыг сэргээнэ. */
export function seqIndicesFromStoredAnswer(
  tokens: string[],
  answer: string
): number[] {
  const target = normalizeMockSentenceAnswer(answer);
  if (!target) return [];

  const used = new Set<number>();
  const seq: number[] = [];
  let rest = target;

  while (rest.length > 0 && seq.length < tokens.length) {
    let matched = false;
    for (let i = 0; i < tokens.length; i += 1) {
      if (used.has(i)) continue;
      const norm = normalizeMockSentenceAnswer(tokens[i] ?? "");
      if (!norm || !rest.startsWith(norm)) continue;
      seq.push(i);
      used.add(i);
      rest = rest.slice(norm.length);
      matched = true;
      break;
    }
    if (!matched) return [];
  }

  return seq.length === tokens.length && rest.length === 0 ? seq : [];
}
