import type { LessonContent } from "@/types/lesson-content";

/** HSK1 Lesson 1 — 你好 (V13 Gold Standard target). */
export function isHsk1L01Nihao(
  lesson: Pick<LessonContent, "id" | "chineseTitle" | "title">
): boolean {
  const id = lesson.id.toLowerCase();
  if (id === "hsk1-l01-nihao" || id.includes("hsk1-l01-nihao")) return true;
  if (/hsk1[-_]?l0?1/i.test(id) && id.includes("nihao")) return true;
  if (
    /hsk1[-_]?l0?1/i.test(id) &&
    (lesson.chineseTitle.includes("你好") || lesson.title.includes("你好"))
  ) {
    return true;
  }
  return false;
}
