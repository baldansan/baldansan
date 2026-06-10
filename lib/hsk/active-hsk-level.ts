import { parseTagFromSourceNote } from "@/lib/lesson-content-type";

export const ACTIVE_HSK_LEVEL_KEY = "activeHskLevel";

/** Selectable HSK bands in the global picker. */
export type ActiveHskLevel = 1 | 2 | 3 | 4 | 5 | 6 | "7-9";

export const HSK_LEVEL_OPTIONS: { value: ActiveHskLevel; label: string }[] = [
  { value: 1, label: "HSK 1" },
  { value: 2, label: "HSK 2" },
  { value: 3, label: "HSK 3" },
  { value: 4, label: "HSK 4" },
  { value: 5, label: "HSK 5" },
  { value: 6, label: "HSK 6" },
  { value: "7-9", label: "HSK 7–9" },
];

export function formatActiveHskLevel(level: ActiveHskLevel): string {
  if (level === "7-9") return "HSK 7–9";
  return `HSK ${level}`;
}

export function isActiveHskLevel(value: unknown): value is ActiveHskLevel {
  if (value === "7-9") return true;
  return typeof value === "number" && value >= 1 && value <= 6;
}

export function readStoredActiveHskLevel(): ActiveHskLevel | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ACTIVE_HSK_LEVEL_KEY);
    if (!raw) return null;
    if (raw === "7-9") return "7-9";
    const n = Number(raw);
    if (Number.isInteger(n) && n >= 1 && n <= 6) return n as ActiveHskLevel;
  } catch {
    // ignore
  }
  return null;
}

export function writeStoredActiveHskLevel(level: ActiveHskLevel): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ACTIVE_HSK_LEVEL_KEY, String(level));
  } catch {
    // ignore
  }
}

/** Parse drkameleon / hsk_words level tags into numeric HSK levels. */
export function parseHskLevelTags(tags: string[] | null | undefined): number[] {
  const levels = new Set<number>();
  for (const raw of tags ?? []) {
    const tag = String(raw ?? "").trim().toLowerCase();
    if (!tag) continue;

    const direct = tag.match(/^(?:old-|new-)?(\d+)$/);
    if (direct) {
      levels.add(Number(direct[1]));
      continue;
    }

    const short = tag.match(/^[ont](\d+)$/);
    if (short) {
      levels.add(Number(short[1]));
    }
  }
  return [...levels].sort((a, b) => a - b);
}

export function activeLevelMatchesNumeric(
  active: ActiveHskLevel,
  level: number
): boolean {
  if (active === "7-9") return level >= 7 && level <= 9;
  return level === active;
}

/** Map UI picker value → public.hsk_words.hsk_level text column. */
export function activeLevelToCatalogLevel(
  active: ActiveHskLevel
): "1" | "2" | "3" | "4" | "5" | "6" | "7-9" {
  return active === "7-9" ? "7-9" : (String(active) as "1" | "2" | "3" | "4" | "5" | "6");
}

export function wordMatchesActiveHskLevel(
  active: ActiveHskLevel,
  word: {
    hsk_level?: number | string | null;
    hsk_old?: string[] | number[] | null;
    hsk_new?: string[] | null;
    hsk_newest?: string[] | null;
  }
): boolean {
  if (typeof word.hsk_level === "string" && word.hsk_level.trim()) {
    return word.hsk_level === activeLevelToCatalogLevel(active);
  }
  if (typeof word.hsk_level === "number" && word.hsk_level > 0) {
    return activeLevelMatchesNumeric(active, word.hsk_level);
  }

  const levels = parseHskLevelTags([
    ...(word.hsk_old ?? []).map((tag) => String(tag)),
    ...(word.hsk_new ?? []),
    ...(word.hsk_newest ?? []),
  ]);

  if (levels.length === 0) return false;
  return levels.some((level) => activeLevelMatchesNumeric(active, level));
}

export function resolveLessonHskLevel(lesson: {
  courseId: string;
  sourceNote?: string | null;
}): number | null {
  const fromNote = parseTagFromSourceNote(lesson.sourceNote, "hskLevel");
  if (fromNote) {
    const n = Number(fromNote.replace(/\D/g, ""));
    if (Number.isFinite(n) && n >= 1 && n <= 9) return n;
  }

  const course = lesson.courseId.toLowerCase();
  const match = course.match(/hsk(\d)/);
  if (match) return Number(match[1]);

  if (course.includes("hsk")) return 5;
  return null;
}

export function lessonMatchesActiveHskLevel(
  active: ActiveHskLevel,
  lesson: { courseId: string; sourceNote?: string | null }
): boolean {
  const level = resolveLessonHskLevel(lesson);
  if (level == null) return true;
  return activeLevelMatchesNumeric(active, level);
}

export function resolveDefaultActiveHskLevel(
  contentLevels: number[],
  stored: ActiveHskLevel | null
): ActiveHskLevel {
  if (stored && contentLevels.some((n) => activeLevelMatchesNumeric(stored, n))) {
    return stored;
  }
  if (stored) return stored;

  const sorted = [...new Set(contentLevels.filter((n) => n >= 1 && n <= 9))].sort(
    (a, b) => a - b
  );
  if (sorted.length === 0) return 5;

  const lowest = sorted[0];
  if (lowest >= 7) return "7-9";
  if (lowest >= 1 && lowest <= 6) return lowest as ActiveHskLevel;
  return 5;
}

export function collectLessonHskLevels(
  lessons: { courseId: string; sourceNote?: string | null }[]
): number[] {
  const levels = new Set<number>();
  for (const lesson of lessons) {
    const level = resolveLessonHskLevel(lesson);
    if (level != null) levels.add(level);
  }
  return [...levels].sort((a, b) => a - b);
}

export function filterLessonsByActiveHskLevel<T extends { courseId: string; sourceNote?: string | null }>(
  lessons: T[],
  active: ActiveHskLevel
): T[] {
  return lessons.filter((lesson) => lessonMatchesActiveHskLevel(active, lesson));
}

export function filterHskWordsByActiveLevel<
  T extends {
    hsk_level?: number | null;
    hsk_old?: string[] | null;
    hsk_new?: string[] | null;
    hsk_newest?: string[] | null;
  },
>(words: T[], active: ActiveHskLevel): T[] {
  return words.filter((word) => wordMatchesActiveHskLevel(active, word));
}
