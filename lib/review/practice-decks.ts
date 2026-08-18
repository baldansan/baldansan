import { shuffleArray } from "@/lib/games/game-data-core";
import type { MatchPair } from "@/lib/games/game-types";
import {
  buildMeaningQuizDeck,
  type MeaningQuizQuestion,
} from "@/lib/games/meaning-quiz";
import type { HskWord } from "@/lib/hsk";
import type { HskWordRow } from "@/lib/supabase/hsk-words";

function rowToHskWord(row: HskWordRow): HskWord {
  return {
    id: row.id,
    simplified: row.simplified,
    traditional: row.traditional,
    pinyin: row.pinyin,
    pos: row.pos ?? [],
    radical: row.radical,
    frequency: row.frequency,
    hsk_level: String(row.hsk_level ?? "1") as HskWord["hsk_level"],
    hsk_old: row.hsk_old ?? [],
    meaning_en: row.meaning_en,
    meaning_mn: row.meaning_mn,
    example_zh: row.example_zh,
    example_pinyin: row.example_pinyin,
    example_mn: row.example_mn,
    is_function_word: row.is_function_word,
  };
}

export function rowsToHskWords(rows: HskWordRow[]): HskWord[] {
  return rows.map(rowToHskWord);
}

const PRACTICE_MIN_SIZE = 6;
const PRACTICE_MAX_SIZE = 8;

function expandList<T>(items: T[], minSize: number, maxSize: number): T[] {
  if (items.length === 0) return [];
  const target = Math.min(maxSize, Math.max(minSize, items.length));
  const out: T[] = [];
  let round = 0;
  while (out.length < target) {
    for (const item of shuffleArray(items)) {
      if (out.length >= target) break;
      out.push(item);
    }
    round += 1;
    if (round > 12) break;
  }
  return out.slice(0, target);
}

/** Ханз ↔ утга хос — 2+ үгтэй, цөөн бол давтана. */
export function buildPracticeMatchPairs(
  words: HskWord[],
  maxPairs = PRACTICE_MAX_SIZE
): MatchPair[] {
  const usable = words.filter((w) => w.simplified && w.meaning_mn?.trim());
  if (usable.length < 2) return [];

  const base = usable.map((w) => ({
    id: String(w.id),
    mongolian: w.meaning_mn!.trim(),
    chinese: w.simplified,
    pinyin: w.pinyin?.trim() ?? "",
  }));

  // NOTE: never pad by repeating pairs — two visually identical cards with
  // different ids make correct matches fail ~50% of the time.
  return shuffleArray(base.slice(0, maxPairs));
}

/** 4 сонголтот утга асуулт — сонгосон үгсээс, цөөн бол давтана. */
export function buildPracticeMeaningDeck(
  words: HskWord[],
  minSize = PRACTICE_MIN_SIZE,
  maxSize = PRACTICE_MAX_SIZE
): MeaningQuizQuestion[] {
  const pool = words.filter((w) => w.meaning_mn?.trim() && w.simplified);
  if (pool.length === 0) return [];

  let base = buildMeaningQuizDeck(pool, pool.length);
  if (base.length === 0 && pool.length >= 1) {
    const fillers = ["өөр утгатай", "буруу хариулт", "сонгох боломж"];
    base = pool.map((word) => {
      const correct = word.meaning_mn!.trim();
      const wrong = pool
        .filter((w) => w.id !== word.id && w.meaning_mn?.trim())
        .map((w) => w.meaning_mn!.trim())
        .filter((m, i, arr) => arr.indexOf(m) === i && m !== correct);
      while (wrong.length < 3) {
        const filler = fillers[wrong.length % fillers.length]!;
        if (!wrong.includes(filler) && filler !== correct) wrong.push(filler);
        else break;
      }
      return {
        id: word.id,
        hanzi: word.simplified,
        pinyin: word.pinyin?.trim() ?? "",
        correct,
        options: shuffleArray([correct, ...wrong.slice(0, 3)]),
        hskLevel: String(word.hsk_level),
      };
    });
  }

  return expandList(base, minSize, maxSize).map((q, i) => ({
    ...q,
    id: q.id * 10_000 + i,
  }));
}
