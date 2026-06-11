import type { LessonContent } from "@/types/lesson-content";

export type LessonSectionGroup = {
  label: string;
  start: number;
  end: number;
  lessons: LessonContent[];
};

/** Resolve display order from lesson id suffix (hsk4-l12 → 12). */
export function resolveLessonOrder(lesson: LessonContent): number {
  const match = lesson.id.match(/-l(\d+)$/i);
  if (match) return Number(match[1]);
  return 0;
}

export function groupLessonsBySections(
  lessons: LessonContent[],
  sectionSize = 10
): LessonSectionGroup[] {
  const sorted = [...lessons].sort(
    (a, b) => resolveLessonOrder(a) - resolveLessonOrder(b)
  );

  const groups: LessonSectionGroup[] = [];
  for (let i = 0; i < sorted.length; i += sectionSize) {
    const slice = sorted.slice(i, i + sectionSize);
    const start = resolveLessonOrder(slice[0]!) || i + 1;
    const end = resolveLessonOrder(slice[slice.length - 1]!) || i + slice.length;
    groups.push({
      label: `${start}–${end}`,
      start,
      end,
      lessons: slice,
    });
  }
  return groups;
}
