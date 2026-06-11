import type { LessonContent } from "@/types/lesson-content";
import { koreanChipTitle } from "@/lib/course-display";

export type MobileCourseCatalogEntry = {
  chipId: string;
  chipLabel: string;
  chipHint?: string;
  courseId: string;
  available: boolean;
  title: string;
  subtitle: string;
  lessons: LessonContent[];
  allLessonsHref: string | null;
};

type CourseMeta = {
  courseId?: string;
  title: string;
  subtitle: string;
  lessons: LessonContent[];
};

export const HSK_HOME_LEVELS = [
  { chipId: "hsk4", chipLabel: "HSK 4", courseId: "hsk4" },
  { chipId: "hsk5", chipLabel: "HSK 5", courseId: "hsk5" },
  { chipId: "hsk6", chipLabel: "HSK 6", courseId: "hsk6" },
] as const;

export type HskHomeLevelId = (typeof HSK_HOME_LEVELS)[number]["courseId"];

function liveCourseEntry(
  chipId: string,
  chipLabel: string,
  courseId: string,
  meta: CourseMeta
): MobileCourseCatalogEntry {
  const available = meta.lessons.length > 0;
  return {
    chipId,
    chipLabel,
    courseId,
    available,
    title: meta.title || chipLabel,
    subtitle: meta.subtitle,
    lessons: meta.lessons,
    allLessonsHref: available ? `/courses/${courseId}` : null,
  };
}

function placeholderHskEntry(
  chipId: string,
  chipLabel: string,
  courseId: string
): MobileCourseCatalogEntry {
  return {
    chipId,
    chipLabel,
    courseId,
    available: false,
    title: chipLabel,
    subtitle: "Удахгүй",
    lessons: [],
    allLessonsHref: null,
  };
}

/** Home course chips: HSK 4 · HSK 5 · HSK 6 + Korean when content exists. */
export function buildHomeCourseCatalog(
  hsk: Partial<Record<HskHomeLevelId, CourseMeta | null | undefined>>,
  korean?: CourseMeta | null
): MobileCourseCatalogEntry[] {
  const entries: MobileCourseCatalogEntry[] = HSK_HOME_LEVELS.map((level) => {
    const meta = hsk[level.courseId];
    if (meta && meta.lessons.length > 0) {
      return liveCourseEntry(level.chipId, level.chipLabel, level.courseId, meta);
    }
    if (meta?.title) {
      return {
        ...placeholderHskEntry(level.chipId, level.chipLabel, level.courseId),
        title: meta.title,
        subtitle: meta.subtitle || "Удахгүй",
      };
    }
    return placeholderHskEntry(level.chipId, level.chipLabel, level.courseId);
  });

  if (korean && (korean.lessons.length > 0 || korean.title)) {
    const courseId = korean.courseId ?? "korean-1";
    const koreanAvailable = korean.lessons.length > 0;
    entries.push({
      chipId: courseId === "korean-survival" ? "koreanSurvival" : "korean1",
      chipLabel: "Korean",
      chipHint: "한글",
      courseId,
      available: koreanAvailable,
      title: korean.title || koreanChipTitle(),
      subtitle: korean.subtitle || "Ажилд явах Korean",
      lessons: korean.lessons,
      allLessonsHref: koreanAvailable ? `/courses/${courseId}` : null,
    });
  }

  return entries;
}

export function defaultHomeChipId(
  catalog: MobileCourseCatalogEntry[]
): string {
  return (
    catalog.find((entry) => entry.available && entry.courseId === "hsk5")
      ?.chipId ??
    catalog.find((entry) => entry.available && entry.courseId === "hsk4")
      ?.chipId ??
    catalog.find((entry) => entry.available)?.chipId ??
    "hsk5"
  );
}
