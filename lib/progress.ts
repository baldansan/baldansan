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
  /** Latest attempt per-question answers (local only; Supabase stores full attempt history). */
  answers?: import("@/lib/quiz-answers").QuizDetailedAnswer[];
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
  percentage: number,
  answers?: import("@/lib/quiz-answers").QuizDetailedAnswer[]
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
    ...(answers?.length ? { answers } : {}),
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
export function vocabularyWordKey(word: {
  id: string;
  chinese: string;
  dbId?: number;
}): string {
  return word.id || word.chinese;
}

export type VocabularyWordProgressInput = {
  id: string;
  chinese: string;
  dbId?: number;
};

export type LessonVocabSnapshot = {
  id: string;
  vocabulary: VocabularyWordProgressInput[];
};

function toVocabularyDbId(value: number | undefined): number | null {
  if (value == null) {
    return null;
  }
  const id = Number(value);
  return Number.isFinite(id) ? id : null;
}

function mergeLearnedKeysForLesson(
  lessonWords: VocabularyWordProgressInput[],
  localKeys: string[],
  learnedDbIds: Set<number>
): string[] {
  const keys = new Set<string>();

  for (const word of lessonWords) {
    const key = vocabularyWordKey(word);
    const dbId = toVocabularyDbId(word.dbId);
    if (dbId != null) {
      if (learnedDbIds.has(dbId)) {
        keys.add(key);
      }
    } else if (localKeys.includes(key)) {
      keys.add(key);
    }
  }

  for (const key of localKeys) {
    const word = lessonWords.find((item) => vocabularyWordKey(item) === key);
    if (toVocabularyDbId(word?.dbId) == null) {
      keys.add(key);
    }
  }

  return [...keys];
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

export type LearnedWordEntry = {
  lessonId: string;
  wordKey: string;
};

export function getAllLearnedWords(): LearnedWordEntry[] {
  const store = readStore();
  const entries: LearnedWordEntry[] = [];

  for (const [lessonId, wordKeys] of Object.entries(store.vocabulary)) {
    for (const wordKey of wordKeys) {
      entries.push({ lessonId, wordKey });
    }
  }

  return entries.sort((a, b) => {
    const lessonOrder = Number(a.lessonId) - Number(b.lessonId);
    if (lessonOrder !== 0) return lessonOrder;
    return a.wordKey.localeCompare(b.wordKey);
  });
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

/** Clears lesson, vocabulary, and quiz data from localStorage (keeps last active lesson). */
export function clearLocalProgressAfterSync(): void {
  if (!isBrowser()) {
    return;
  }

  const store = readStore();
  writeStore({
    lessons: {},
    vocabulary: {},
    quizzes: {},
    lastActiveLessonId: store.lastActiveLessonId,
  });
}

export type LessonProgressSource = "supabase" | "local";

function buildLocalLessonStatusMap(
  lessonIds: string[]
): Record<string, LessonStatus> {
  const map: Record<string, LessonStatus> = {};
  for (const lessonId of lessonIds) {
    map[lessonId] = getLessonStatus(lessonId);
  }
  return map;
}

export function countCompletedFromStatusMap(
  lessonIds: string[],
  byLesson: Record<string, LessonStatus>
): number {
  return lessonIds.filter((lessonId) => byLesson[lessonId] === "completed")
    .length;
}

export function countStartedFromStatusMap(
  byLesson: Record<string, LessonStatus>
): number {
  return Object.values(byLesson).filter((status) => status === "started")
    .length;
}

export async function getLessonProgressMapSmart(
  lessonIds: string[]
): Promise<{
  byLesson: Record<string, LessonStatus>;
  source: LessonProgressSource;
}> {
  const byLesson = buildLocalLessonStatusMap(lessonIds);

  const { getCurrentUser } = await import("@/lib/supabase/auth");
  const { data: user } = await getCurrentUser();
  if (!user?.id) {
    return { byLesson, source: "local" };
  }

  const { getUserLessonProgress, normalizeLessonStatus } = await import(
    "@/lib/supabase/progress"
  );
  const { data, error } = await getUserLessonProgress(user.id);
  if (error) {
    console.warn(
      "[progress] Supabase lesson progress fetch failed; using local.",
      error
    );
    return { byLesson, source: "local" };
  }

  if (!data?.length) {
    return { byLesson, source: "local" };
  }

  const merged = { ...byLesson };
  for (const row of data) {
    if (lessonIds.includes(row.lesson_id)) {
      merged[row.lesson_id] = normalizeLessonStatus(row.status);
    }
  }
  return { byLesson: merged, source: "supabase" };
}

export async function getLessonStatusSmart(
  lessonId: string
): Promise<LessonStatus> {
  const { byLesson } = await getLessonProgressMapSmart([lessonId]);
  return byLesson[lessonId] ?? "not_started";
}

export async function markLessonStartedSmart(lessonId: string): Promise<void> {
  markLessonStarted(lessonId);

  const { getCurrentUser } = await import("@/lib/supabase/auth");
  const { data: user } = await getCurrentUser();
  if (!user?.id) {
    return;
  }

  const { markSupabaseLessonStarted } = await import("@/lib/supabase/progress");
  const { error } = await markSupabaseLessonStarted(user.id, lessonId);
  if (error) {
    console.warn(
      "[progress] Supabase lesson started write failed; local saved.",
      error
    );
  }
}

export async function markLessonCompletedSmart(lessonId: string): Promise<void> {
  markLessonCompleted(lessonId);

  const { getCurrentUser } = await import("@/lib/supabase/auth");
  const { data: user } = await getCurrentUser();
  if (!user?.id) {
    return;
  }

  const { markSupabaseLessonCompleted } = await import(
    "@/lib/supabase/progress"
  );
  const { error } = await markSupabaseLessonCompleted(user.id, lessonId);
  if (error) {
    console.warn(
      "[progress] Supabase lesson completed write failed; local saved.",
      error
    );
  }
}

export type AccountLessonProgressSummary = {
  completed: number;
  started: number;
  completedLessonIds: string[];
  startedLessonIds: string[];
};

export async function getAccountLessonProgressSummary(
  userId: string
): Promise<AccountLessonProgressSummary | null> {
  const { getUserLessonProgress, normalizeLessonStatus } = await import(
    "@/lib/supabase/progress"
  );
  const { data, error } = await getUserLessonProgress(userId);
  if (error || !data) {
    if (error) {
      console.warn(
        "[progress] Supabase account lesson progress fetch failed.",
        error
      );
    }
    return null;
  }

  const completedLessonIds: string[] = [];
  const startedLessonIds: string[] = [];

  for (const row of data) {
    const status = normalizeLessonStatus(row.status);
    if (status === "completed") {
      completedLessonIds.push(row.lesson_id);
    } else if (status === "started") {
      startedLessonIds.push(row.lesson_id);
    }
  }

  completedLessonIds.sort((a, b) => Number(a) - Number(b));
  startedLessonIds.sort((a, b) => Number(a) - Number(b));

  return {
    completed: completedLessonIds.length,
    started: startedLessonIds.length,
    completedLessonIds,
    startedLessonIds,
  };
}

async function resolveVocabularyWordDbId(
  lessonId: string,
  word: VocabularyWordProgressInput
): Promise<number | null> {
  const { normalizeVocabularyWordDbId, lookupVocabularyWordDbId } =
    await import("@/lib/supabase/vocabulary-progress");

  const existing = normalizeVocabularyWordDbId(word.dbId);
  if (existing != null) {
    return existing;
  }

  return lookupVocabularyWordDbId(lessonId, word.chinese);
}

export async function getLearnedWordsSmart(
  lessonId: string,
  lessonWords: VocabularyWordProgressInput[] = []
): Promise<string[]> {
  const localKeys = getLearnedWords(lessonId);

  const { getAuthenticatedUserId } = await import("@/lib/supabase/auth");
  const { userId } = await getAuthenticatedUserId();
  if (!userId) {
    return localKeys;
  }

  const { enrichVocabularyWithDbIds } = await import("@/lib/supabase/content");
  const enrichedWords = await enrichVocabularyWithDbIds(
    lessonId,
    lessonWords
  );

  const hasDbIds = enrichedWords.some((word) => word.dbId != null);
  if (!hasDbIds) {
    return localKeys;
  }

  const {
    getUserVocabularyProgress,
    getUserVocabularyProgressByLesson,
    isLearnedVocabularyStatus,
  } = await import("@/lib/supabase/vocabulary-progress");

  let { data, error } = await getUserVocabularyProgressByLesson(
    userId,
    lessonId
  );

  if (error) {
    const lessonDbIds = new Set(
      enrichedWords
        .map((word) => word.dbId)
        .filter((id): id is number => id != null)
    );
    const all = await getUserVocabularyProgress(userId);
    if (all.error) {
      console.warn(
        "[progress] Supabase vocabulary fetch failed; using local.",
        all.error
      );
      return localKeys;
    }
    data = (all.data ?? []).filter((row) =>
      lessonDbIds.has(row.vocabulary_word_id)
    );
    error = null;
  }

  const learnedDbIds = new Set(
    (data ?? [])
      .filter((row) => isLearnedVocabularyStatus(row.status))
      .map((row) => Number(row.vocabulary_word_id))
      .filter((id) => Number.isFinite(id))
  );

  return mergeLearnedKeysForLesson(enrichedWords, localKeys, learnedDbIds);
}

export async function toggleLearnedWordSmart(
  lessonId: string,
  word: VocabularyWordProgressInput
): Promise<string[]> {
  const key = vocabularyWordKey(word);
  const localNext = toggleLearnedWord(lessonId, key);
  const isNowLearned = localNext.includes(key);

  const { getAuthenticatedUserId, hasSupabaseConfig } = await import(
    "@/lib/supabase/auth"
  );
  const { userId, error: authError } = await getAuthenticatedUserId();
  const hasUser = Boolean(userId);

  if (!userId) {
    if (hasSupabaseConfig) {
      console.warn(
        "[progress] Vocabulary save skipped: no signed-in user.",
        authError ?? "Session not found",
        `hasUser=${hasUser}`,
        `hasDbId=${word.dbId != null}`
      );
    }
    return localNext;
  }

  const dbId = await resolveVocabularyWordDbId(lessonId, word);
  const hasDbId = dbId != null;

  if (!hasDbId) {
    console.warn(
      "[progress] Vocabulary save skipped: no vocabulary_word_id for this lesson word.",
      `hasUser=${hasUser}`,
      `hasDbId=${hasDbId}`
    );
    return localNext;
  }

  const { toggleSupabaseWordLearned } = await import(
    "@/lib/supabase/vocabulary-progress"
  );
  const { error } = await toggleSupabaseWordLearned(
    userId,
    dbId,
    isNowLearned
  );
  if (error) {
    console.warn(
      "[progress] Supabase vocabulary write failed; local saved.",
      error,
      `hasUser=${hasUser}`,
      `hasDbId=${hasDbId}`
    );
  }

  return localNext;
}

export async function getAllLearnedWordsSmart(
  lessons: LessonVocabSnapshot[] = []
): Promise<LearnedWordEntry[]> {
  const local = getAllLearnedWords();

  const { getAuthenticatedUserId } = await import("@/lib/supabase/auth");
  const { userId } = await getAuthenticatedUserId();
  if (!userId) {
    return local;
  }

  const dbIdToEntry = new Map<number, LearnedWordEntry>();
  for (const lesson of lessons) {
    for (const word of lesson.vocabulary) {
      if (word.dbId != null) {
        dbIdToEntry.set(word.dbId, {
          lessonId: lesson.id,
          wordKey: vocabularyWordKey(word),
        });
      }
    }
  }

  if (dbIdToEntry.size === 0) {
    return local;
  }

  const { getUserVocabularyProgress, isLearnedVocabularyStatus } = await import(
    "@/lib/supabase/vocabulary-progress"
  );
  const { data, error } = await getUserVocabularyProgress(userId);
  if (error) {
    console.warn(
      "[progress] Supabase vocabulary list fetch failed; using local.",
      error
    );
    return local;
  }

  const entries: LearnedWordEntry[] = [];
  const seen = new Set<string>();

  for (const row of data ?? []) {
    if (!isLearnedVocabularyStatus(row.status)) {
      continue;
    }
    const mapped = dbIdToEntry.get(row.vocabulary_word_id);
    if (!mapped) {
      continue;
    }
    const dedupeKey = `${mapped.lessonId}:${mapped.wordKey}`;
    if (seen.has(dedupeKey)) {
      continue;
    }
    seen.add(dedupeKey);
    entries.push(mapped);
  }

  for (const entry of local) {
    const lesson = lessons.find((item) => item.id === entry.lessonId);
    const word = lesson?.vocabulary.find(
      (item) => vocabularyWordKey(item) === entry.wordKey
    );
    if (!word?.dbId) {
      const dedupeKey = `${entry.lessonId}:${entry.wordKey}`;
      if (!seen.has(dedupeKey)) {
        seen.add(dedupeKey);
        entries.push(entry);
      }
    }
  }

  return entries.sort((a, b) => {
    const lessonOrder = Number(a.lessonId) - Number(b.lessonId);
    if (lessonOrder !== 0) return lessonOrder;
    return a.wordKey.localeCompare(b.wordKey);
  });
}

export async function getAccountVocabularyLearnedCount(
  userId: string
): Promise<number | null> {
  const { getUserVocabularyProgress, isLearnedVocabularyStatus } = await import(
    "@/lib/supabase/vocabulary-progress"
  );
  const { data, error } = await getUserVocabularyProgress(userId);
  if (error || !data) {
    if (error) {
      console.warn(
        "[progress] Supabase account vocabulary count fetch failed.",
        error
      );
    }
    return null;
  }

  return data.filter((row) => isLearnedVocabularyStatus(row.status)).length;
}

export async function getQuizResultSmart(
  lessonId: string
): Promise<QuizResult | null> {
  const local = getQuizResult(lessonId);

  const { getCurrentUser } = await import("@/lib/supabase/auth");
  const { data: user } = await getCurrentUser();
  if (!user?.id) {
    return local;
  }

  const {
    aggregateAttemptsToQuizResult,
    getUserQuizAttemptsByLesson,
  } = await import("@/lib/supabase/quiz-attempts");
  const { data, error } = await getUserQuizAttemptsByLesson(user.id, lessonId);

  if (error) {
    console.warn(
      "[progress] Supabase quiz fetch failed; using local.",
      error
    );
    return local;
  }

  if (!data?.length) {
    return local;
  }

  const fromSupabase = aggregateAttemptsToQuizResult(data);
  if (!fromSupabase) {
    return local;
  }

  if (!local) {
    return fromSupabase;
  }

  return {
    score: fromSupabase.score,
    total: fromSupabase.total,
    percentage: fromSupabase.percentage,
    bestPercentage: Math.max(
      local.bestPercentage,
      fromSupabase.bestPercentage
    ),
    updatedAt: fromSupabase.updatedAt,
  };
}

export async function saveQuizResultSmart(
  lessonId: string,
  score: number,
  total: number,
  percentage: number,
  answers:
    | import("@/lib/quiz-answers").QuizDetailedAnswer[]
    | Record<string, unknown> = []
): Promise<QuizResult> {
  const detailedAnswers = Array.isArray(answers) ? answers : undefined;
  const localResult = saveQuizResult(
    lessonId,
    score,
    total,
    percentage,
    detailedAnswers
  );

  const { getAuthenticatedUserId, hasSupabaseConfig } = await import(
    "@/lib/supabase/auth"
  );
  const { userId, error: authError } = await getAuthenticatedUserId();

  if (!userId) {
    if (hasSupabaseConfig) {
      console.warn(
        "[progress] Quiz save skipped: no signed-in user.",
        authError ?? "Session not found"
      );
    }
    return localResult;
  }

  const { saveSupabaseQuizAttempt } = await import(
    "@/lib/supabase/quiz-attempts"
  );
  const { error } = await saveSupabaseQuizAttempt(
    userId,
    lessonId,
    score,
    total,
    percentage,
    answers
  );

  if (error) {
    console.warn(
      "[progress] Supabase quiz insert failed; local saved.",
      error
    );
    return localResult;
  }

  const mergedBest = Math.max(localResult.bestPercentage, percentage);
  return {
    ...localResult,
    bestPercentage: mergedBest,
  };
}

export async function getAllQuizResultsSmart(): Promise<QuizResultEntry[]> {
  const local = getAllQuizResults();

  const { getCurrentUser } = await import("@/lib/supabase/auth");
  const { data: user } = await getCurrentUser();
  if (!user?.id) {
    return local;
  }

  const { getUserQuizAttempts, groupQuizAttemptsToEntries } = await import(
    "@/lib/supabase/quiz-attempts"
  );
  const { data, error } = await getUserQuizAttempts(user.id);

  if (error) {
    console.warn(
      "[progress] Supabase quiz list fetch failed; using local.",
      error
    );
    return local;
  }

  if (!data?.length) {
    return local;
  }

  const fromSupabase = groupQuizAttemptsToEntries(data);
  if (fromSupabase.length === 0) {
    return local;
  }

  const lessonIds = new Set(fromSupabase.map((entry) => entry.lessonId));
  const merged = [...fromSupabase];

  for (const entry of local) {
    if (!lessonIds.has(entry.lessonId)) {
      merged.push(entry);
    }
  }

  return merged.sort(
    (a, b) =>
      new Date(b.result.updatedAt).getTime() -
      new Date(a.result.updatedAt).getTime()
  );
}

