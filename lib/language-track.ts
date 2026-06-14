/** Learner language track (Korean vs Chinese/HSK) — filtering + labels. */

export type SelectedLanguage = "ko" | "zh";

export const SELECTED_LANGUAGE_KEY = "selectedLanguage";
export const SELECTED_COURSE_ID_KEY = "selectedCourseId";

/** Course ids probed when loading learner lesson catalogs. */
export const LEARNER_COURSE_PROBE_IDS = [
  "hsk6",
  "hsk5",
  "hsk4",
  "hsk1",
  "hsk",
  "korean-level-1",
  "korean-1",
  "korean-survival",
] as const;

export function inferLanguageFromCourseId(
  courseId: string
): SelectedLanguage | null {
  const id = courseId.toLowerCase();
  if (id.startsWith("korean")) return "ko";
  if (id.includes("hsk") || id.startsWith("helzui")) return "zh";
  return null;
}

export function inferLanguageTagFromCourseId(courseId: string): string {
  return inferLanguageFromCourseId(courseId) === "ko" ? "ko-MN" : "zh-MN";
}

export function resolveLanguageFromManifest(
  courseId: string,
  language?: string | null
): { language: string; defaulted: boolean } {
  const trimmed = language?.trim();
  if (trimmed) {
    return { language: trimmed, defaulted: false };
  }
  return {
    language: inferLanguageTagFromCourseId(courseId),
    defaulted: true,
  };
}

export function inferLessonLanguage(lesson: {
  courseId: string;
  language?: string | null;
}): SelectedLanguage | null {
  const tag = lesson.language?.trim().toLowerCase();
  if (tag === "ko-mn" || tag === "ko-kr" || tag?.startsWith("ko")) return "ko";
  if (tag === "zh-mn" || tag?.startsWith("zh")) return "zh";
  return inferLanguageFromCourseId(lesson.courseId);
}

export function lessonMatchesLanguage(
  lesson: { courseId: string; language?: string | null },
  selected: SelectedLanguage
): boolean {
  const inferred = inferLessonLanguage(lesson);
  if (inferred) return inferred === selected;

  const courseId = lesson.courseId.toLowerCase();
  if (selected === "ko") {
    return courseId.startsWith("korean");
  }
  return courseId.includes("hsk") || courseId.startsWith("helzui");
}

export function filterLessonsByLanguage<T extends { courseId: string; language?: string | null }>(
  lessons: T[],
  lang: SelectedLanguage
): T[] {
  return lessons.filter((lesson) => lessonMatchesLanguage(lesson, lang));
}

export function courseMatchesLanguage(
  courseId: string,
  lang: SelectedLanguage
): boolean {
  return lessonMatchesLanguage({ courseId }, lang);
}

export function catalogEntryMatchesLanguage(
  entry: { courseId: string },
  lang: SelectedLanguage
): boolean {
  return courseMatchesLanguage(entry.courseId, lang);
}

export function languageToDefaultCourseId(lang: SelectedLanguage): string {
  return lang === "ko" ? "korean-level-1" : "hsk";
}

export function languageTrackLabel(lang: SelectedLanguage): string {
  return lang === "ko" ? "Солонгос хэл" : "Хятад хэл / HSK";
}

export function languageTrackShortLabel(lang: SelectedLanguage): string {
  return lang === "ko" ? "Солонгос хэл" : "HSK";
}

export function resolveDefaultChipForLanguage(
  lang: SelectedLanguage,
  catalog: { chipId: string; courseId: string; available: boolean }[]
): string | null {
  const available = catalog.filter((entry) => entry.available);
  if (available.length === 0) return null;

  const preferred = available.find((entry) =>
    courseMatchesLanguage(entry.courseId, lang)
  );
  return preferred?.chipId ?? available[0]?.chipId ?? null;
}

export const LANGUAGE_SELECTION_OPTIONS: {
  lang: SelectedLanguage;
  emoji: string;
  label: string;
  courseId: string;
}[] = [
  {
    lang: "ko",
    emoji: "🇰🇷",
    label: "Солонгос хэл",
    courseId: "korean-level-1",
  },
  {
    lang: "zh",
    emoji: "🇨🇳",
    label: "Хятад хэл / HSK",
    courseId: "hsk",
  },
];
