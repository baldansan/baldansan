import type { LessonContent } from "@/types/lesson-content";
import type { VocabularyWord } from "@/types/lesson";

export type KanjiEntry = {
  key: string;
  chinese: string;
  pinyin: string;
  mongolian: string;
  hskLevel: string;
  lessonIds: string[];
};

export function aggregateKanjiFromLessons(
  lessons: LessonContent[]
): KanjiEntry[] {
  const map = new Map<string, KanjiEntry>();

  for (const lesson of lessons) {
    for (const word of lesson.vocabulary) {
      const chinese = word.chinese.trim();
      if (!chinese) continue;
      const key = chinese;
      const existing = map.get(key);
      if (existing) {
        if (!existing.lessonIds.includes(lesson.id)) {
          existing.lessonIds.push(lesson.id);
        }
        continue;
      }
      map.set(key, {
        key,
        chinese,
        pinyin: word.pinyin,
        mongolian: word.mongolian,
        hskLevel: word.hskLevel,
        lessonIds: [lesson.id],
      });
    }
  }

  return [...map.values()].sort((a, b) =>
    a.chinese.localeCompare(b.chinese, "zh")
  );
}

export function groupKanjiByHsk(entries: KanjiEntry[]): Map<string, KanjiEntry[]> {
  const groups = new Map<string, KanjiEntry[]>();
  for (const entry of entries) {
    const level = entry.hskLevel || "Other";
    const list = groups.get(level) ?? [];
    list.push(entry);
    groups.set(level, list);
  }
  return groups;
}

export function kanjiMatchesSearch(entry: KanjiEntry, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    entry.chinese.includes(q) ||
    entry.pinyin.toLowerCase().includes(q) ||
    entry.mongolian.toLowerCase().includes(q)
  );
}

export function vocabularyWordToKanji(word: VocabularyWord, lessonId: string): KanjiEntry {
  return {
    key: word.chinese,
    chinese: word.chinese,
    pinyin: word.pinyin,
    mongolian: word.mongolian,
    hskLevel: word.hskLevel,
    lessonIds: [lessonId],
  };
}
