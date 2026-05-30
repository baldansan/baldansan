/** Public route aliases for guided lesson training URLs. */
const TRAINING_LESSON_ALIASES: Record<string, string[]> = {
  "kr-0-hangul-foundation": ["k-hangul", "k-pre-01"],
};

export function trainingLessonIdCandidates(lessonId: string): string[] {
  const normalized = lessonId.trim();
  const aliasTargets =
    TRAINING_LESSON_ALIASES[normalized.toLowerCase()] ?? [];
  return [normalized, ...aliasTargets];
}

export function isHangulFoundationLessonId(lessonId: string): boolean {
  const id = lessonId.trim().toLowerCase();
  return (
    id === "k-hangul" ||
    id === "kr-0-hangul-foundation" ||
    id === "k-pre-01"
  );
}
