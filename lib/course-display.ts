/** Course-aware labels for learner UI (HSK vs Korean) — no schema changes. */

export function isKoreanCourse(courseId: string): boolean {
  return courseId.toLowerCase().startsWith("korean");
}

export function courseChipBadge(courseId: string): string {
  if (isKoreanCourse(courseId)) return "Korean · 한글";
  if (courseId.startsWith("hsk")) return courseId.toUpperCase();
  return courseId;
}

/** Label for secondary script line (Hangul stored in chineseTitle / chinese fields). */
export function secondaryScriptLabel(courseId: string): string {
  return isKoreanCourse(courseId) ? "Солонгос" : "Хятад";
}

/** Romanization field label (pinyin column reused for Korean romanization). */
export function romanizationLabel(courseId: string): string {
  return isKoreanCourse(courseId) ? "Романжил" : "Pinyin";
}

export function courseCardAccentClass(courseId: string): string {
  return isKoreanCourse(courseId) ? "app-course-card-korean" : "";
}

export function koreanChipTitle(fallback?: string): string {
  return fallback ?? "Ажилд явах Korean";
}
