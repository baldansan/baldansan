import type { VocabularyWord } from "@/types/lesson";
import type { GameVocabItem } from "@/lib/games/game-types";

export function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function toGameVocabItem(word: VocabularyWord): GameVocabItem {
  return {
    id: word.id,
    chinese: word.chinese,
    pinyin: word.pinyin,
    mongolian: word.mongolian,
    hskLevel: word.hskLevel,
    exampleChinese: word.exampleChinese ?? "",
    exampleMongolian: word.exampleMongolian ?? "",
  };
}

export function isSingleHangulJamo(value: string): boolean {
  return /^[\u3131-\u318E]$/.test(value.trim());
}

export function isHangulSyllable(value: string): boolean {
  return /^[가-힣]+$/.test(value.trim());
}

export function splitKoreanSyllables(word: string): string[] {
  return [...word.replace(/\s/g, "")].filter((ch) => /[가-힣]/.test(ch));
}

export function prioritizePrelessonVocab(
  vocabulary: GameVocabItem[],
  isPrelesson: boolean
): GameVocabItem[] {
  if (!isPrelesson) return vocabulary;
  const jamo = vocabulary.filter((w) => isSingleHangulJamo(w.chinese));
  const syllables = vocabulary.filter(
    (w) => !isSingleHangulJamo(w.chinese) && isHangulSyllable(w.chinese)
  );
  const rest = vocabulary.filter(
    (w) => !isSingleHangulJamo(w.chinese) && !isHangulSyllable(w.chinese)
  );
  return [...jamo, ...syllables, ...rest];
}
