const STORAGE_PREFIX = "bs:lesson-reflection:";

export type LessonPathReflectionStore = {
  answers: string[];
  updatedAt: string;
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function storageKey(lessonId: string): string {
  return `${STORAGE_PREFIX}${lessonId}`;
}

export function loadLessonPathReflection(
  lessonId: string,
  questionCount: number
): string[] {
  if (!isBrowser() || questionCount <= 0) {
    return Array.from({ length: Math.max(0, questionCount) }, () => "");
  }
  try {
    const raw = window.localStorage.getItem(storageKey(lessonId));
    if (!raw) return Array.from({ length: questionCount }, () => "");
    const parsed = JSON.parse(raw) as Partial<LessonPathReflectionStore>;
    const answers = Array.isArray(parsed.answers) ? parsed.answers : [];
    return Array.from({ length: questionCount }, (_, i) => answers[i] ?? "");
  } catch {
    return Array.from({ length: questionCount }, () => "");
  }
}

export function saveLessonPathReflection(
  lessonId: string,
  answers: string[]
): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(
      storageKey(lessonId),
      JSON.stringify({ answers, updatedAt: new Date().toISOString() })
    );
  } catch {
    // quota
  }
}
