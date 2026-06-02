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

const PLACEHOLDER_CHIPS: Omit<
  MobileCourseCatalogEntry,
  "title" | "subtitle" | "lessons" | "allLessonsHref"
>[] = [
  {
    chipId: "hsk1",
    chipLabel: "HSK 1",
    courseId: "hsk1",
    available: false,
  },
  {
    chipId: "hsk4a",
    chipLabel: "HSK 4 上",
    courseId: "hsk4",
    available: false,
  },
  {
    chipId: "hsk4b",
    chipLabel: "HSK 4 下",
    courseId: "hsk4",
    available: false,
  },
];

/** Home course chips: HSK placeholders + live HSK5 + optional Korean when content exists. */
export function buildHomeCourseCatalog(
  hsk5: CourseMeta,
  korean?: CourseMeta | null
): MobileCourseCatalogEntry[] {
  const entries: MobileCourseCatalogEntry[] = PLACEHOLDER_CHIPS.map((chip) => ({
    ...chip,
    title: chip.chipLabel,
    subtitle: "Удахгүй",
    lessons: [],
    allLessonsHref: null,
  }));

  entries.push({
    chipId: "hsk5a",
    chipLabel: "HSK 5 上",
    courseId: "hsk5",
    available: true,
    title: hsk5.title,
    subtitle: hsk5.subtitle,
    lessons: hsk5.lessons,
    allLessonsHref: hsk5.lessons.length > 0 ? "/courses/hsk5" : null,
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
    catalog.find((entry) => entry.available)?.chipId ??
    "hsk5a"
  );
}
