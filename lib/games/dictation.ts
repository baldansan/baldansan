import { shuffleArray } from "@/lib/games/game-data-core";
import { toPinyinSortKey } from "@/lib/hsk/pinyin-sort";
import type { HskWord } from "@/lib/hsk";

export const DICTATION_QUESTIONS = 10;
const MIN_TILES = 6;
const MAX_TILES = 8;

export type DictationQuestion = {
  id: number;
  /** Зөв хариулт — сонссон үгийн ханз. */
  hanzi: string;
  pinyin: string;
  meaning: string;
  /** Угсрах сонголтын ханзнууд (зөв үгийн бүх тэмдэгт + distractor). */
  tiles: string[];
};

/** Аялгагүй, зай/тэмдэггүй пиньинь харьцуулах түлхүүр. */
export function toDictationPinyinKey(value: string | null | undefined): string {
  return toPinyinSortKey(value).replace(/[\s'’\-·.]/g, "");
}

/** Хэрэглэгчийн бичсэн пиньинь зөв эсэх (аялгагүй латин ok). */
export function isDictationPinyinMatch(
  input: string,
  pinyin: string | null | undefined
): boolean {
  const key = toDictationPinyinKey(input);
  return key.length > 0 && key === toDictationPinyinKey(pinyin);
}

/**
 * «Диктант»: аудио сонсоод үгийг ханзаар угсарна (эсвэл пиньинь бичнэ).
 * Tiles = зөв үгийн тэмдэгтүүд + бусад үгсээс авсан distractor ханз (6–8).
 */
export function buildDictationDeck(
  words: HskWord[],
  size = DICTATION_QUESTIONS
): DictationQuestion[] {
  const pool = words.filter(
    (w) =>
      w.simplified &&
      w.simplified.length >= 1 &&
      w.simplified.length <= 4 &&
      w.pinyin?.trim() &&
      w.meaning_mn?.trim()
  );
  if (pool.length < 4) return [];

  // Distractor тэмдэгтийн сан — сангийн бүх үгийн тэмдэгтүүд.
  const allChars = [
    ...new Set(pool.flatMap((w) => w.simplified.split(""))),
  ];

  const questions: DictationQuestion[] = [];

  for (const word of shuffleArray(pool).slice(0, size)) {
    const chars = word.simplified.split("");
    const inWord = new Set(chars);
    const tileTarget = Math.min(
      MAX_TILES,
      Math.max(MIN_TILES, chars.length + 4)
    );

    const distractors: string[] = [];
    for (const ch of shuffleArray(allChars)) {
      if (chars.length + distractors.length >= tileTarget) break;
      if (inWord.has(ch) || distractors.includes(ch)) continue;
      distractors.push(ch);
    }
    // Distractor дутвал (жижиг custom сан) байгаагаараа үргэлжилнэ —
    // угсрах дасгал 4+ tile-тай л бол утгатай.
    if (chars.length + distractors.length < 4) continue;

    questions.push({
      id: word.id,
      hanzi: word.simplified,
      pinyin: word.pinyin!.trim(),
      meaning: word.meaning_mn!.trim(),
      tiles: shuffleArray([...chars, ...distractors]),
    });
  }

  return questions;
}
