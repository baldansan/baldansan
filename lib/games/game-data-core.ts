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

/**
 * Seed-тэй холилт — ижил seed үргэлж ижил дараалал өгнө. Server render ба
 * hydration хоёрт дараалал зөрөхөөс (React #418) сэргийлэхэд хэрэглэнэ:
 * seed-ийг зөвхөн client дээр `useEffect` дотор сонгоно.
 */
export function seededShuffle<T>(items: T[], seed: number): T[] {
  const copy = [...items];
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(next() * (i + 1));
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
