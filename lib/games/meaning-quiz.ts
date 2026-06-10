import { shuffleArray } from "@/lib/games/game-data-core";
import {
  activeLevelMatchesNumeric,
  type ActiveHskLevel,
} from "@/lib/hsk/active-hsk-level";
import type { HskWordRow } from "@/lib/supabase/hsk-words";

export type MeaningQuizQuestion = {
  id: number;
  hanzi: string;
  pinyin: string;
  correct: string;
  options: string[];
  hskLevel: number | null;
};

const QUESTION_SECONDS = 10;
const MAX_LIVES = 3;
const OPTION_COUNT = 4;

export { QUESTION_SECONDS, MAX_LIVES };

function pickDistractors(
  pool: HskWordRow[],
  correct: HskWordRow,
  count: number
): string[] {
  const level = correct.hsk_level;
  const candidates = pool.filter(
    (w) =>
      w.id !== correct.id &&
      w.meaning_mn?.trim() &&
      w.meaning_mn !== correct.meaning_mn &&
      (level == null || w.hsk_level === level)
  );
  return shuffleArray(candidates)
    .slice(0, count)
    .map((w) => w.meaning_mn!.trim());
}

export function buildMeaningQuizDeck(
  words: HskWordRow[],
  activeLevel: ActiveHskLevel,
  size = 20
): MeaningQuizQuestion[] {
  const pool = words.filter(
    (w) =>
      w.meaning_mn?.trim() &&
      w.simplified &&
      w.hsk_level != null &&
      activeLevelMatchesNumeric(activeLevel, w.hsk_level)
  );
  const picked = shuffleArray(pool).slice(0, size);

  return picked
    .filter((w) => w.id != null)
    .map((word) => {
      const correct = word.meaning_mn!.trim();
      const wrong = pickDistractors(pool, word, OPTION_COUNT - 1);
      while (wrong.length < OPTION_COUNT - 1) {
        const extra = pool.find(
          (w) =>
            w.meaning_mn?.trim() &&
            w.meaning_mn !== correct &&
            !wrong.includes(w.meaning_mn.trim())
        );
        if (!extra?.meaning_mn) break;
        wrong.push(extra.meaning_mn.trim());
      }
      const options = shuffleArray([correct, ...wrong.slice(0, OPTION_COUNT - 1)]);
      return {
        id: word.id!,
        hanzi: word.simplified,
        pinyin: word.pinyin?.trim() ?? "",
        correct,
        options,
        hskLevel: word.hsk_level ?? null,
      };
    });
}

export function scoreMeaningQuiz(
  correct: number,
  total: number,
  livesLeft: number
): number {
  const base = correct * 10;
  const lifeBonus = livesLeft * 5;
  return base + lifeBonus;
}
