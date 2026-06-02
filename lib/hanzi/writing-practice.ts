import type { VocabularyWord } from "@/types/lesson";
import type { HskCharacterNote } from "@/lib/lesson/hsk-lesson-content";

/** Mongolian UI copy for hanz handwriting practice. */
export const HANZI_WRITING_LABELS = {
  write: "\u0411\u0438\u0447\u0438\u0445",
  strokeOrder: "\u0417\u0443\u0440\u0430\u0430\u0441\u043d\u044b \u0434\u0430\u0440\u0430\u0430\u043b\u0430\u043b",
  watchStrokes: "\u0417\u0443\u0440\u0430\u0430\u0441 \u0445\u0430\u0440\u0430\u0445",
  traceWrite: "\u0414\u0430\u0433\u0430\u0436 \u0431\u0438\u0447",
  traceWriteLong: "\u0414\u0430\u0433\u0430\u0436 \u0431\u0438\u0447\u0438\u0445",
  retry: "\u0414\u0430\u0445\u0438\u043d \u0431\u0438\u0447\u0438\u0445",
  success: "\u0417\u04e9\u0432 \u0431\u0438\u0447\u043b\u044d\u044d",
  nextCharacter: "\u0414\u0430\u0440\u0430\u0430\u0433\u0438\u0439\u043d \u0445\u0430\u043d\u0437",
  done: "\u0414\u0443\u0443\u0441\u0441\u0430\u043d",
  unavailable:
    "\u042d\u043d\u044d \u0445\u0430\u043d\u0437\u043d\u044b \u0431\u0438\u0447\u0438\u0445 \u0434\u0430\u0441\u0433\u0430\u043b \u0445\u0430\u0440\u0430\u0430\u0445\u0430\u043d \u0431\u044d\u043b\u044d\u043d \u0431\u0430\u0439\u043d\u0430.",
  practiceTitle: "\u0411\u0438\u0447\u0438\u0445 \u0434\u0430\u0441\u0433\u0430\u043b",
  loading: "\u0410\u0447\u0430\u0430\u043b\u043b\u0430\u0436 \u0431\u0430\u0439\u043d\u0430\u2026",
} as const;

const HANZI_RE = /[\u4e00-\u9fff]/;

/** Extract CJK characters from a vocabulary string. */
export function extractHanziCharacters(text: string): string[] {
  return [...text.replace(/\s/g, "")].filter((ch) => HANZI_RE.test(ch));
}

/** All hanz characters taught in a lesson vocabulary list. */
export function getLessonPracticeHanzi(
  vocabulary: Pick<VocabularyWord, "chinese">[]
): string[] {
  const seen = new Set<string>();
  const chars: string[] = [];
  for (const word of vocabulary) {
    for (const char of extractHanziCharacters(word.chinese)) {
      if (seen.has(char)) continue;
      seen.add(char);
      chars.push(char);
    }
  }
  return chars;
}

export function isWritingPracticeEnabled(
  char: string,
  lessonPracticeHanzi: string[]
): boolean {
  return lessonPracticeHanzi.includes(char);
}

/** Practice chars from this word that belong to the current lesson. */
export function resolveWordPracticeChars(
  chinese: string,
  lessonPracticeHanzi: string[]
): string[] {
  const lessonSet = new Set(lessonPracticeHanzi);
  return extractHanziCharacters(chinese).filter((char) => lessonSet.has(char));
}

export function resolveStrokeOrderImageUrl(
  char: string,
  characterNotes: HskCharacterNote[] = []
): string | undefined {
  const note = characterNotes.find((n) => n.chinese === char);
  return note?.strokeImageUrl;
}

export function findNextPracticeChar(
  current: string,
  practiceChars: string[]
): string | null {
  const index = practiceChars.indexOf(current);
  if (index < 0 || index >= practiceChars.length - 1) return null;
  return practiceChars[index + 1] ?? null;
}

/** Lesson 1 intro hanz used when package vocabulary is not yet imported. */
export const LESSON1_WRITING_FALLBACK_HANZI = [
  "一",
  "二",
  "三",
  "十",
  "八",
  "六",
] as const;

export function resolveLessonPracticeHanzi(
  lessonId: string,
  vocabulary: Pick<VocabularyWord, "chinese">[]
): string[] {
  const fromVocab = getLessonPracticeHanzi(vocabulary);
  if (!isHskLessonOne(lessonId)) return fromVocab;

  const merged = new Set<string>([
    ...fromVocab,
    ...LESSON1_WRITING_FALLBACK_HANZI,
  ]);
  return [...merged];
}

function isHskLessonOne(lessonId: string): boolean {
  if (lessonId === "1") return true;
  return /hsk1-l01|hsk1.*l01|l01.*nihao|prelesson.*01/i.test(lessonId);
}
