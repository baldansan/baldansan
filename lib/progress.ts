export const PROGRESS_STORAGE_KEY = "buunduu-surtsgaay-progress";
export const PASSING_QUIZ_PERCENT = 70;

export type LessonStatus = "not_started" | "started" | "completed";

export type LessonProgress = {
  status: LessonStatus;
  startedAt?: string;
  completedAt?: string;
};

export type QuizResult = {
  score: number;
  total: number;
  percentage: number;
  bestPercentage: number;
  updatedAt: string;
};

type ProgressStore = {
  lessons: Record<string, LessonProgress>;
  vocabulary: Record<string, string[]>;
  quizzes: Record<string, QuizResult>;
  lastActiveLessonId?: string;
};

const defaultLessonProgress = (): LessonProgress => ({
  status: "not_started",
});

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readStore(): ProgressStore {
  if (!isBrowser()) {
    return { lessons: {}, vocabulary: {}, quizzes: {} };
  }

  try {
    const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) {
      return { lessons: {}, vocabulary: {}, quizzes: {} };
    }
    const parsed = JSON.parse(raw) as Partial<ProgressStore>;
    return {
      lessons: parsed.lessons ?? {},
      vocabulary: parsed.vocabulary ?? {},
      quizzes: parsed.quizzes ?? {},
      lastActiveLessonId: parsed.lastActiveLessonId,
    };
  } catch {
    return { lessons: {}, vocabulary: {}, quizzes: {} };
  }
}

function writeStore(store: ProgressStore): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(store));
}

export function getLessonProgress(lessonId: string): LessonProgress {
  const store = readStore();
  return store.lessons[lessonId] ?? defaultLessonProgress();
}

export function markLessonStarted(lessonId: string): void {
  if (!isBrowser()) return;

  const store = readStore();
  const current = store.lessons[lessonId] ?? defaultLessonProgress();

  if (current.status === "completed") {
    return;
  }

  store.lessons[lessonId] = {
    status: "started",
    startedAt: current.startedAt ?? new Date().toISOString(),
  };
  store.lastActiveLessonId = lessonId;
  writeStore(store);
}

export function markLessonCompleted(lessonId: string): void {
  if (!isBrowser()) return;

  const store = readStore();
  const current = store.lessons[lessonId] ?? defaultLessonProgress();

  store.lessons[lessonId] = {
    status: "completed",
    startedAt: current.startedAt ?? new Date().toISOString(),
    completedAt: new Date().toISOString(),
  };
  store.lastActiveLessonId = lessonId;
  writeStore(store);
}

export function getLearnedWords(lessonId: string): string[] {
  const store = readStore();
  return store.vocabulary[lessonId] ?? [];
}

export function toggleLearnedWord(lessonId: string, wordKey: string): string[] {
  if (!isBrowser()) {
    return [];
  }

  const store = readStore();
  const current = new Set(store.vocabulary[lessonId] ?? []);

  if (current.has(wordKey)) {
    current.delete(wordKey);
  } else {
    current.add(wordKey);
  }

  const next = [...current];
  store.vocabulary[lessonId] = next;
  store.lastActiveLessonId = lessonId;
  writeStore(store);
  return next;
}

export function saveQuizResult(
  lessonId: string,
  score: number,
  total: number,
  percentage: number
): QuizResult {
  if (!isBrowser()) {
    return {
      score,
      total,
      percentage,
      bestPercentage: percentage,
      updatedAt: new Date().toISOString(),
    };
  }

  const store = readStore();
  const previous = store.quizzes[lessonId];
  const bestPercentage = Math.max(
    previous?.bestPercentage ?? 0,
    percentage
  );

  const result: QuizResult = {
    score,
    total,
    percentage,
    bestPercentage,
    updatedAt: new Date().toISOString(),
  };

  store.quizzes[lessonId] = result;
  store.lastActiveLessonId = lessonId;
  writeStore(store);
  return result;
}

export function getQuizResult(lessonId: string): QuizResult | null {
  const store = readStore();
  return store.quizzes[lessonId] ?? null;
}

export function countCompletedLessons(lessonIds: string[]): number {
  return lessonIds.filter(
    (lessonId) => getLessonProgress(lessonId).status === "completed"
  ).length;
}

export function lessonStatusLabel(status: LessonStatus): string {
  switch (status) {
    case "started":
      return "Started";
    case "completed":
      return "Completed";
    default:
      return "Not started";
  }
}

export function lessonProgressPercent(status: LessonStatus): number {
  switch (status) {
    case "completed":
      return 100;
    case "started":
      return 50;
    default:
      return 0;
  }
}

/** Stable key for vocabulary progress (id preferred, chinese fallback). */
export function vocabularyWordKey(word: { id: string; chinese: string }): string {
  return word.id || word.chinese;
}

export function getAllLessonProgress(): Record<string, LessonProgress> {
  return readStore().lessons;
}

export type QuizResultEntry = {
  lessonId: string;
  result: QuizResult;
};

export function getAllQuizResults(): QuizResultEntry[] {
  const store = readStore();
  return Object.entries(store.quizzes)
    .map(([lessonId, result]) => ({ lessonId, result }))
    .sort(
      (a, b) =>
        new Date(b.result.updatedAt).getTime() -
        new Date(a.result.updatedAt).getTime()
    );
}

export function getTotalLearnedWords(): number {
  const store = readStore();
  return Object.values(store.vocabulary).reduce(
    (sum, words) => sum + words.length,
    0
  );
}

export function getLastActiveLessonId(): string | null {
  const store = readStore();
  return store.lastActiveLessonId ?? null;
}

export function getLessonStatus(lessonId: string): LessonStatus {
  return getLessonProgress(lessonId).status;
}

export function getCompletedLessonIds(): string[] {
  const lessons = getAllLessonProgress();
  return Object.entries(lessons)
    .filter(([, progress]) => progress.status === "completed")
    .map(([lessonId]) => lessonId)
    .sort((a, b) => Number(a) - Number(b));
}

export function countStartedLessons(): number {
  const lessons = getAllLessonProgress();
  return Object.values(lessons).filter((lesson) => lesson.status === "started")
    .length;
}

export function countCompletedLessonsAll(): number {
  const lessons = getAllLessonProgress();
  return Object.values(lessons).filter(
    (lesson) => lesson.status === "completed"
  ).length;
}

export function hasAnyProgress(): boolean {
  const store = readStore();
  const hasLesson = Object.values(store.lessons).some(
    (lesson) => lesson.status !== "not_started"
  );
  const hasVocab = Object.values(store.vocabulary).some(
    (words) => words.length > 0
  );
  const hasQuiz = Object.keys(store.quizzes).length > 0;
  return hasLesson || hasVocab || hasQuiz;
}
