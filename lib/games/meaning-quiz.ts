import { shuffleArray } from "@/lib/games/game-data-core";
import type { HskWord } from "@/lib/hsk";

export type MeaningQuizQuestion = {
  id: number;
  hanzi: string;
  pinyin: string;
  correct: string;
  options: string[];
  hskLevel: string;
};

const QUESTION_SECONDS = 10;
const MAX_LIVES = 3;
const OPTION_COUNT = 4;
const QUESTION_COUNT = 15;

export { QUESTION_SECONDS, MAX_LIVES, QUESTION_COUNT };

function uniqueMeanings(words: HskWord[], exclude: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const w of words) {
    const m = w.meaning_mn?.trim();
    if (!m || m === exclude || seen.has(m)) continue;
    seen.add(m);
    out.push(m);
  }
  return out;
}

/** Build MCQ deck: 1 correct + 3 distractors from same-level pool (getRandomWords-style). */
export function buildMeaningQuizDeck(
  words: HskWord[],
  size = QUESTION_COUNT
): MeaningQuizQuestion[] {
  const pool = words.filter((w) => w.meaning_mn?.trim() && w.simplified);
  if (pool.length < OPTION_COUNT) return [];

  const questions = shuffleArray(pool).slice(0, size);

  return questions.map((word) => {
    const correct = word.meaning_mn!.trim();
    const others = shuffleArray(
      pool.filter((w) => w.id !== word.id && w.meaning_mn?.trim() !== correct)
    );
    const wrong = uniqueMeanings(others, correct).slice(0, OPTION_COUNT - 1);

    while (wrong.length < OPTION_COUNT - 1) {
      const extra = pool.find(
        (w) =>
          w.meaning_mn?.trim() &&
          w.meaning_mn!.trim() !== correct &&
          !wrong.includes(w.meaning_mn!.trim())
      );
      if (!extra?.meaning_mn) break;
      wrong.push(extra.meaning_mn.trim());
    }

    const options = shuffleArray([
      correct,
      ...wrong.slice(0, OPTION_COUNT - 1),
    ]);

    return {
      id: word.id,
      hanzi: word.simplified,
      pinyin: word.pinyin?.trim() ?? "",
      correct,
      options,
      hskLevel: word.hsk_level,
    };
  });
}

export function scoreMeaningQuiz(
  correct: number,
  answered: number,
  livesLeft: number
): number {
  const base = correct * 10;
  const lifeBonus = livesLeft * 5;
  const speedBonus = Math.max(0, answered - correct) === 0 ? 10 : 0;
  return base + lifeBonus + speedBonus;
}
