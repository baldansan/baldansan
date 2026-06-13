/**
 * Per-step learner progress in localStorage.
 * Key: `bs:progress:{lessonId}:{step}` (e.g. bs:progress:hsk4-l01:quiz).
 */

const STORAGE_PREFIX = "bs:progress:";

export type BsStepId =
  | "quiz"
  | "exercises_workbook"
  | "exercises_textbook"
  | "exercises_merged"
  | "vocabulary"
  | "words"
  | `module:${string}`;

export type BsExercisesProgressSource = "workbook" | "textbook" | "both";

export type StepProgressStatus = "not_started" | "in_progress" | "completed";

export type BsStepProgressMeta = {
  completed?: boolean;
  updatedAt: string;
};

export type BsQuizStepProgress = BsStepProgressMeta & {
  currentIndex: number;
  correctCount: number;
  answeredCount: number;
  finished: boolean;
  resultsByIndex?: Record<string, "ok" | "no">;
};

export type BsGroupAnswerSnapshot = {
  picked: string | null;
  tf: boolean | null;
  checked: boolean;
  correct: boolean;
};

export type BsExercisesStepProgress = BsStepProgressMeta & {
  qi: number;
  score: number;
  done: boolean;
  totalItems: number;
  resultsByN: Record<string, "ok" | "no">;
  groupAnswers?: BsGroupAnswerSnapshot[];
};

export type BsVocabularyStepProgress = BsStepProgressMeta & {
  cardIndex: number;
  viewedIds: number[];
  knownIds: number[];
};

export type BsWordsStudiedProgress = {
  keys: string[];
  updatedAt: string;
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function bsProgressStorageKey(lessonId: string, step: BsStepId): string {
  return `${STORAGE_PREFIX}${lessonId}:${step}`;
}

function readRaw<T>(lessonId: string, step: BsStepId): T | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(bsProgressStorageKey(lessonId, step));
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeRaw<T extends object>(lessonId: string, step: BsStepId, data: T): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(
      bsProgressStorageKey(lessonId, step),
      JSON.stringify({ ...data, updatedAt: new Date().toISOString() })
    );
  } catch {
    // quota
  }
}

export function clearBsStepProgress(lessonId: string, step: BsStepId): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(bsProgressStorageKey(lessonId, step));
}

/* ---------- Quiz ---------- */

export function getBsQuizProgress(lessonId: string): BsQuizStepProgress | null {
  return readRaw<BsQuizStepProgress>(lessonId, "quiz");
}

export function saveBsQuizProgress(
  lessonId: string,
  data: Omit<BsQuizStepProgress, "updatedAt">
): void {
  writeRaw(lessonId, "quiz", data);
}

export function clearBsQuizProgress(lessonId: string): void {
  clearBsStepProgress(lessonId, "quiz");
}

export function hasBsQuizSavedProgress(lessonId: string): boolean {
  const saved = getBsQuizProgress(lessonId);
  if (!saved) return false;
  if (saved.finished || saved.completed) return false;
  return (
    saved.currentIndex > 0 ||
    (saved.answeredCount ?? 0) > 0 ||
    Object.keys(saved.resultsByIndex ?? {}).length > 0
  );
}

export function countQuizAnswered(progress: BsQuizStepProgress): number {
  const fromResults = Object.keys(progress.resultsByIndex ?? {}).length;
  if (fromResults > 0) return fromResults;
  return Math.max(progress.answeredCount ?? 0, progress.currentIndex);
}

/* ---------- Exercises ---------- */

function exercisesProgressStep(source: BsExercisesProgressSource): BsStepId {
  if (source === "both") return "exercises_merged";
  return source === "workbook" ? "exercises_workbook" : "exercises_textbook";
}

export function getBsExercisesProgress(
  lessonId: string,
  source: BsExercisesProgressSource
): BsExercisesStepProgress | null {
  return readRaw<BsExercisesStepProgress>(lessonId, exercisesProgressStep(source));
}

export function saveBsExercisesProgress(
  lessonId: string,
  source: BsExercisesProgressSource,
  data: Omit<BsExercisesStepProgress, "updatedAt">
): void {
  writeRaw(lessonId, exercisesProgressStep(source), data);
}

export function clearBsExercisesProgress(
  lessonId: string,
  source: BsExercisesProgressSource
): void {
  clearBsStepProgress(lessonId, exercisesProgressStep(source));
  if (source === "both") {
    clearBsStepProgress(lessonId, "exercises_textbook");
    clearBsStepProgress(lessonId, "exercises_workbook");
  }
}

export function hasBsExercisesSavedProgress(
  lessonId: string,
  source: BsExercisesProgressSource
): boolean {
  const saved = getBsExercisesProgress(lessonId, source);
  if (!saved) return false;
  return saved.done || saved.qi > 0 || countExercisesAnswered(saved) > 0;
}

export function countExercisesAnswered(progress: BsExercisesStepProgress): number {
  return Object.keys(progress.resultsByN ?? {}).length;
}

/* ---------- Vocabulary (LessonPlayer cards) ---------- */

export function getBsVocabularyProgress(lessonId: string): BsVocabularyStepProgress | null {
  return readRaw<BsVocabularyStepProgress>(lessonId, "vocabulary");
}

export function saveBsVocabularyProgress(
  lessonId: string,
  data: Omit<BsVocabularyStepProgress, "updatedAt">
): void {
  writeRaw(lessonId, "vocabulary", data);
}

/* ---------- Module completed flag ---------- */

export function getBsModuleProgress(
  lessonId: string,
  moduleKey: string
): BsStepProgressMeta | null {
  return readRaw<BsStepProgressMeta>(lessonId, `module:${moduleKey}`);
}

export function markBsModuleCompleted(lessonId: string, moduleKey: string): void {
  writeRaw(lessonId, `module:${moduleKey}`, { completed: true });
}

/* ---------- Studied words (flashcard + quiz + player vocab) ---------- */

function wordsKey(lessonId: string): string {
  return bsProgressStorageKey(lessonId, "words");
}

export function getStudiedWordKeys(lessonId: string): string[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(wordsKey(lessonId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as BsWordsStudiedProgress;
    return Array.isArray(parsed.keys) ? parsed.keys : [];
  } catch {
    return [];
  }
}

export function recordStudiedWordKey(lessonId: string, wordKey: string): number {
  if (!isBrowser() || !wordKey.trim()) return 0;
  const keys = new Set(getStudiedWordKeys(lessonId));
  keys.add(wordKey.trim());
  const next = [...keys];
  try {
    window.localStorage.setItem(
      wordsKey(lessonId),
      JSON.stringify({ keys: next, updatedAt: new Date().toISOString() })
    );
  } catch {
    // ignore
  }
  return next.length;
}

export function getStudiedWordsCount(lessonId: string): number {
  return getStudiedWordKeys(lessonId).length;
}

/** Match quiz correct answer text to a vocabulary row for studied-word tracking. */
export function matchVocabularyWordKeyFromAnswer(
  answer: string,
  vocabulary: Array<{
    id: string;
    chinese: string;
    mongolian: string;
    pinyin?: string;
  }>
): string | null {
  const norm = answer.trim();
  if (!norm) return null;
  const word = vocabulary.find(
    (w) =>
      w.chinese.trim() === norm ||
      w.mongolian.trim() === norm ||
      (w.pinyin?.trim() ?? "") === norm
  );
  return word ? word.id || word.chinese : null;
}

/* ---------- Status helpers ---------- */

export function stepStatusLabel(status: StepProgressStatus): string {
  if (status === "completed") return "Дууссан ✓";
  if (status === "in_progress") return "Үргэлжилж буй";
  return "Эхлээгүй";
}

export function formatStepProgressDetail(
  answered: number,
  total: number,
  status: StepProgressStatus
): string {
  if (status === "completed") return "Дууссан ✓";
  if (status === "in_progress" && total > 0) return `${answered}/${total}`;
  if (status === "not_started") return "Эхлээгүй";
  return "";
}

export function quizStepSummary(
  lessonId: string,
  totalQuestions: number
): { status: StepProgressStatus; answered: number; total: number; detail: string } {
  const total = totalQuestions;
  const saved = getBsQuizProgress(lessonId);
  if (!saved) {
    return {
      status: "not_started",
      answered: 0,
      total,
      detail: formatStepProgressDetail(0, total, "not_started"),
    };
  }
  if (saved.completed || saved.finished) {
    return {
      status: "completed",
      answered: total,
      total,
      detail: formatStepProgressDetail(total, total, "completed"),
    };
  }
  const answered = Math.max(
    saved.answeredCount ?? 0,
    saved.currentIndex > 0 ? saved.currentIndex : 0
  );
  return {
    status: "in_progress",
    answered,
    total,
    detail: formatStepProgressDetail(answered, total, "in_progress"),
  };
}

export function exercisesStepSummary(
  lessonId: string,
  source: "workbook" | "textbook",
  totalItems: number
): { status: StepProgressStatus; answered: number; total: number; detail: string } {
  const saved = getBsExercisesProgress(lessonId, source);
  if (!saved) {
    return {
      status: "not_started",
      answered: 0,
      total: totalItems,
      detail: formatStepProgressDetail(0, totalItems, "not_started"),
    };
  }
  const total = saved.totalItems || totalItems;
  if (saved.completed || saved.done) {
    return {
      status: "completed",
      answered: total,
      total,
      detail: formatStepProgressDetail(total, total, "completed"),
    };
  }
  const answered = countExercisesAnswered(saved);
  return {
    status: answered > 0 ? "in_progress" : "not_started",
    answered,
    total,
    detail: formatStepProgressDetail(answered, total, answered > 0 ? "in_progress" : "not_started"),
  };
}

export function vocabularyStepSummary(
  lessonId: string,
  totalCards: number
): { status: StepProgressStatus; answered: number; total: number; detail: string } {
  const saved = getBsVocabularyProgress(lessonId);
  if (!saved || totalCards === 0) {
    return {
      status: "not_started",
      answered: 0,
      total: totalCards,
      detail: formatStepProgressDetail(0, totalCards, "not_started"),
    };
  }
  if (saved.completed) {
    return {
      status: "completed",
      answered: totalCards,
      total: totalCards,
      detail: formatStepProgressDetail(totalCards, totalCards, "completed"),
    };
  }
  const viewed = saved.viewedIds?.length ?? 0;
  return {
    status: viewed > 0 ? "in_progress" : "not_started",
    answered: viewed,
    total: totalCards,
    detail: formatStepProgressDetail(viewed, totalCards, viewed > 0 ? "in_progress" : "not_started"),
  };
}

export function moduleStepSummary(
  lessonId: string,
  moduleKey: string
): StepProgressStatus {
  const saved = getBsModuleProgress(lessonId, moduleKey);
  return saved?.completed ? "completed" : "not_started";
}
