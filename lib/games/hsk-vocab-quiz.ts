import type { HskLevel } from "@/lib/hsk";
import {
  buildSrsMarathonDeck,
  type HskQuizKind,
  type HskQuizQuestion,
} from "@/lib/games/hsk-quiz-builders";
import type { HskWord } from "@/lib/hsk";

export type VocabQuizLevelConfig = {
  questions: number;
  passPct: number;
  secondsPerQuestion: number;
  poolSize: number;
};

/** Vocabulary practice quiz sizing per catalog level. */
export const HSK_VOCAB_QUIZ_CONFIG: Record<HskLevel, VocabQuizLevelConfig> = {
  "1": { questions: 20, passPct: 60, secondsPerQuestion: 15, poolSize: 120 },
  "2": { questions: 25, passPct: 60, secondsPerQuestion: 15, poolSize: 150 },
  "3": { questions: 30, passPct: 60, secondsPerQuestion: 12, poolSize: 180 },
  "4": { questions: 35, passPct: 60, secondsPerQuestion: 12, poolSize: 220 },
  "5": { questions: 40, passPct: 60, secondsPerQuestion: 12, poolSize: 260 },
  "6": { questions: 40, passPct: 60, secondsPerQuestion: 10, poolSize: 280 },
  "7-9": { questions: 40, passPct: 60, secondsPerQuestion: 10, poolSize: 300 },
};

export function getVocabQuizConfig(level: HskLevel): VocabQuizLevelConfig {
  return HSK_VOCAB_QUIZ_CONFIG[level] ?? HSK_VOCAB_QUIZ_CONFIG["1"];
}

export function buildHskVocabQuizDeck(
  words: HskWord[],
  level: HskLevel,
  kinds?: HskQuizKind[]
): HskQuizQuestion[] {
  const { questions } = getVocabQuizConfig(level);
  return buildSrsMarathonDeck(words, questions, kinds);
}

export function evaluateVocabQuiz(
  correct: number,
  total: number,
  level: HskLevel
): {
  passed: boolean;
  accuracy: number;
  passPct: number;
  correct: number;
  total: number;
} {
  const { passPct } = getVocabQuizConfig(level);
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  return {
    passed: accuracy >= passPct,
    accuracy,
    passPct,
    correct,
    total,
  };
}

export function formatVocabQuizLevelLabel(level: HskLevel): string {
  if (level === "7-9") return "HSK 7–9";
  return `HSK ${level}`;
}
