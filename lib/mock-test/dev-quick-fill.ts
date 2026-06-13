import type { MockTestAnswers, MockTestQuestionRow } from "@/lib/mock-test/types";
import {
  isMockSentenceOrderQuestion,
  parseSentenceOrderTokens,
} from "@/lib/mock-test/sentence-order";

const JUDGE_VALUES = ["√", "×"] as const;
const FILL_SAMPLES = ["测", "试", "好", "的", "我", "是"];
const ESSAY_SAMPLES = ["Dev хариулт.", "这是测试答案。"];
const FALLBACK_KEYS = ["A", "B", "C", "D"];

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

function randomOptionKey(question: MockTestQuestionRow): string {
  const opts = question.options ?? [];
  if (opts.length > 0) return pickRandom(opts).key;
  return pickRandom(FALLBACK_KEYS);
}

function randomOrderAnswer(question: MockTestQuestionRow): string {
  const keys = (question.options ?? []).map((o) => o.key).filter(Boolean);
  if (keys.length === 0) return "ABCD";
  return [...keys].sort(() => Math.random() - 0.5).join("");
}

/** Dev-only: random answers for every question in a mock test. */
export function buildRandomMockTestAnswers(
  questions: MockTestQuestionRow[]
): MockTestAnswers {
  const answers: MockTestAnswers = {};

  for (const question of questions) {
    const key = String(question.q_no);
    switch (question.q_type) {
      case "judge":
        answers[key] = pickRandom(JUDGE_VALUES);
        break;
      case "order":
        answers[key] = randomOrderAnswer(question);
        break;
      case "complete":
      case "fill_char":
        if (isMockSentenceOrderQuestion(question)) {
          const tokens = parseSentenceOrderTokens(question);
          answers[key] = [...tokens].sort(() => Math.random() - 0.5).join("");
        } else {
          answers[key] = pickRandom(FILL_SAMPLES);
        }
        break;
      case "picture_sentence":
      case "essay":
      case "summary":
        answers[key] = pickRandom(ESSAY_SAMPLES);
        break;
      default:
        answers[key] = randomOptionKey(question);
        break;
    }
  }

  return answers;
}

export function isMockTestDevToolsEnabled(): boolean {
  return process.env.NODE_ENV === "development";
}
