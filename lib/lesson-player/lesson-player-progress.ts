import type { LessonPlayerSession } from "@/types/lesson-player";

const STORAGE_PREFIX = "lesson-progress:";

function storageKey(lessonId: string): string {
  return `${STORAGE_PREFIX}${lessonId}`;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function defaultPlayerSession(): LessonPlayerSession {
  return {
    stepIndex: 0,
    flashcardIndex: 0,
    practiceIndex: 0,
    practiceCorrect: 0,
    quizCorrectCount: 0,
    quizAnswered: 0,
    updatedAt: new Date().toISOString(),
  };
}

export function getLessonPlayerProgress(
  lessonId: string
): LessonPlayerSession | null {
  if (!isBrowser()) return null;

  try {
    const raw = window.localStorage.getItem(storageKey(lessonId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LessonPlayerSession>;
    return {
      ...defaultPlayerSession(),
      ...parsed,
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function saveLessonPlayerProgress(
  lessonId: string,
  session: LessonPlayerSession
): void {
  if (!isBrowser()) return;

  window.localStorage.setItem(
    storageKey(lessonId),
    JSON.stringify({
      ...session,
      updatedAt: new Date().toISOString(),
    })
  );
}

export function clearLessonPlayerProgress(lessonId: string): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(storageKey(lessonId));
}
