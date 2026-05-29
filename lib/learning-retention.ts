import {
  getAllLessonProgress,
  getAllQuizResults,
  PROGRESS_STORAGE_KEY,
} from "@/lib/progress";

export const RETENTION_STORAGE_KEY = "buunduu-surtsgaay-retention";
export const DEFAULT_DAILY_GOAL = 3;
export const MAX_ACTIVITY_LOG_DAYS = 90;

export type LearningActivityType =
  | "lesson_started"
  | "lesson_completed"
  | "word_learned"
  | "quiz_attempt";

export type DailyActivityLog = {
  date: string;
  activities: LearningActivityType[];
};

export type RetentionStore = {
  version: 1;
  dailyGoal: number;
  activityLog: DailyActivityLog[];
  longestStreak: number;
  /** Future: browser push / email reminders */
  remindersEnabled: boolean;
};

export type TodayActivity = {
  lessonEvents: number;
  wordEvents: number;
  quizEvents: number;
  total: number;
};

export type LearningRetentionSummary = {
  dailyGoal: number;
  today: TodayActivity;
  todayProgress: number;
  goalMet: boolean;
  currentStreak: number;
  longestStreak: number;
  activeDaysThisWeek: number;
  weekActivity: boolean[];
  lastActiveDate: string | null;
  source: "local" | "merged";
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function toLocalDateKey(iso: string | Date = new Date()): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(dateKey: string, delta: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + delta);
  return toLocalDateKey(date);
}

function defaultStore(): RetentionStore {
  return {
    version: 1,
    dailyGoal: DEFAULT_DAILY_GOAL,
    activityLog: [],
    longestStreak: 0,
    remindersEnabled: false,
  };
}

function readRetentionStore(): RetentionStore {
  if (!isBrowser()) {
    return defaultStore();
  }

  try {
    const raw = window.localStorage.getItem(RETENTION_STORAGE_KEY);
    if (!raw) {
      return defaultStore();
    }
    const parsed = JSON.parse(raw) as Partial<RetentionStore>;
    return {
      version: 1,
      dailyGoal: parsed.dailyGoal ?? DEFAULT_DAILY_GOAL,
      activityLog: parsed.activityLog ?? [],
      longestStreak: parsed.longestStreak ?? 0,
      remindersEnabled: parsed.remindersEnabled ?? false,
    };
  } catch {
    return defaultStore();
  }
}

function writeRetentionStore(store: RetentionStore): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(RETENTION_STORAGE_KEY, JSON.stringify(store));
}

function trimActivityLog(log: DailyActivityLog[]): DailyActivityLog[] {
  const cutoff = addDays(toLocalDateKey(), -(MAX_ACTIVITY_LOG_DAYS - 1));
  return log
    .filter((entry) => entry.date >= cutoff)
    .sort((a, b) => a.date.localeCompare(b.date));
}

function countTodayActivity(log: DailyActivityLog[], dateKey: string): TodayActivity {
  const entry = log.find((item) => item.date === dateKey);
  if (!entry) {
    return { lessonEvents: 0, wordEvents: 0, quizEvents: 0, total: 0 };
  }

  let lessonEvents = 0;
  let wordEvents = 0;
  let quizEvents = 0;

  for (const activity of entry.activities) {
    if (activity === "lesson_started" || activity === "lesson_completed") {
      lessonEvents += 1;
    } else if (activity === "word_learned") {
      wordEvents += 1;
    } else if (activity === "quiz_attempt") {
      quizEvents += 1;
    }
  }

  return {
    lessonEvents,
    wordEvents,
    quizEvents,
    total: entry.activities.length,
  };
}

export function getActiveDatesFromLog(log: DailyActivityLog[]): string[] {
  return log
    .filter((entry) => entry.activities.length > 0)
    .map((entry) => entry.date);
}

export function computeCurrentStreak(
  activeDates: string[],
  referenceDate = toLocalDateKey()
): number {
  const set = new Set(activeDates);
  if (set.size === 0) return 0;

  let cursor = referenceDate;
  if (!set.has(cursor)) {
    cursor = addDays(referenceDate, -1);
    if (!set.has(cursor)) return 0;
  }

  let streak = 0;
  while (set.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function computeLongestStreak(activeDates: string[]): number {
  if (activeDates.length === 0) return 0;

  const sorted = [...new Set(activeDates)].sort();
  let longest = 1;
  let current = 1;

  for (let i = 1; i < sorted.length; i += 1) {
    const prev = sorted[i - 1];
    const next = sorted[i];
    if (addDays(prev, 1) === next) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  return longest;
}

function getWeekActivity(activeDates: string[], referenceDate = toLocalDateKey()) {
  const set = new Set(activeDates);
  const weekActivity: boolean[] = [];
  let activeDaysThisWeek = 0;

  for (let offset = 6; offset >= 0; offset -= 1) {
    const dateKey = addDays(referenceDate, -offset);
    const active = set.has(dateKey);
    weekActivity.push(active);
    if (active) activeDaysThisWeek += 1;
  }

  return { weekActivity, activeDaysThisWeek };
}

function getLastActiveDate(activeDates: string[]): string | null {
  if (activeDates.length === 0) return null;
  return [...activeDates].sort().at(-1) ?? null;
}

export function bootstrapRetentionFromProgressIfEmpty(): void {
  if (!isBrowser()) return;

  const store = readRetentionStore();
  if (store.activityLog.length > 0) return;

  const byDate = new Map<string, LearningActivityType[]>();

  function push(dateKey: string, type: LearningActivityType) {
    const list = byDate.get(dateKey) ?? [];
    list.push(type);
    byDate.set(dateKey, list);
  }

  for (const [lessonId, progress] of Object.entries(getAllLessonProgress())) {
    if (progress.startedAt) {
      push(toLocalDateKey(progress.startedAt), "lesson_started");
    }
    if (progress.completedAt) {
      push(toLocalDateKey(progress.completedAt), "lesson_completed");
    }
    void lessonId;
  }

  for (const { result } of getAllQuizResults()) {
    push(toLocalDateKey(result.updatedAt), "quiz_attempt");
  }

  if (byDate.size === 0) return;

  const activityLog: DailyActivityLog[] = [...byDate.entries()]
    .map(([date, activities]) => ({ date, activities }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const activeDates = getActiveDatesFromLog(activityLog);
  writeRetentionStore({
    ...store,
    activityLog: trimActivityLog(activityLog),
    longestStreak: Math.max(store.longestStreak, computeLongestStreak(activeDates)),
  });
}

export function recordLearningActivity(type: LearningActivityType): void {
  if (!isBrowser()) return;

  bootstrapRetentionFromProgressIfEmpty();

  const store = readRetentionStore();
  const today = toLocalDateKey();
  const nextLog = trimActivityLog([...store.activityLog]);
  const existing = nextLog.find((entry) => entry.date === today);

  if (existing) {
    existing.activities.push(type);
  } else {
    nextLog.push({ date: today, activities: [type] });
  }

  const activeDates = getActiveDatesFromLog(nextLog);
  const currentStreak = computeCurrentStreak(activeDates, today);
  const longestStreak = Math.max(
    store.longestStreak,
    computeLongestStreak(activeDates),
    currentStreak
  );

  writeRetentionStore({
    ...store,
    activityLog: nextLog,
    longestStreak,
  });
}

export function getLearningRetentionSummary(): LearningRetentionSummary {
  bootstrapRetentionFromProgressIfEmpty();

  const store = readRetentionStore();
  const today = toLocalDateKey();
  const activeDates = getActiveDatesFromLog(store.activityLog);
  const todayActivity = countTodayActivity(store.activityLog, today);
  const dailyGoal = store.dailyGoal;
  const todayProgress = Math.min(todayActivity.total, dailyGoal);
  const { weekActivity, activeDaysThisWeek } = getWeekActivity(activeDates, today);

  return {
    dailyGoal,
    today: todayActivity,
    todayProgress,
    goalMet: todayActivity.total >= dailyGoal,
    currentStreak: computeCurrentStreak(activeDates, today),
    longestStreak: Math.max(store.longestStreak, computeLongestStreak(activeDates)),
    activeDaysThisWeek,
    weekActivity,
    lastActiveDate: getLastActiveDate(activeDates),
    source: "local",
  };
}

export function mergeRetentionSummaries(
  local: LearningRetentionSummary,
  remoteActiveDates: string[],
  remoteToday: TodayActivity
): LearningRetentionSummary {
  const today = toLocalDateKey();
  const mergedDates = [
    ...new Set([
      ...getActiveDatesFromLog(
        readRetentionStore().activityLog.filter((entry) => entry.activities.length > 0)
      ),
      ...remoteActiveDates,
    ]),
  ];

  const todayTotal = Math.max(local.today.total, remoteToday.total);
  const dailyGoal = local.dailyGoal;
  const { weekActivity, activeDaysThisWeek } = getWeekActivity(mergedDates, today);

  return {
    dailyGoal,
    today: {
      lessonEvents: Math.max(local.today.lessonEvents, remoteToday.lessonEvents),
      wordEvents: Math.max(local.today.wordEvents, remoteToday.wordEvents),
      quizEvents: Math.max(local.today.quizEvents, remoteToday.quizEvents),
      total: todayTotal,
    },
    todayProgress: Math.min(todayTotal, dailyGoal),
    goalMet: todayTotal >= dailyGoal,
    currentStreak: computeCurrentStreak(mergedDates, today),
    longestStreak: Math.max(
      local.longestStreak,
      computeLongestStreak(mergedDates)
    ),
    activeDaysThisWeek,
    weekActivity,
    lastActiveDate: getLastActiveDate(mergedDates),
    source: "merged",
  };
}

export async function getLearningRetentionSummarySmart(): Promise<LearningRetentionSummary> {
  const local = getLearningRetentionSummary();

  const { getAuthenticatedUserId } = await import("@/lib/supabase/auth");
  const { userId } = await getAuthenticatedUserId();
  if (!userId) {
    return local;
  }

  try {
    const { fetchSupabaseActiveDates, fetchSupabaseTodayActivity } = await import(
      "@/lib/supabase/learning-retention"
    );
    const [remoteActiveDates, remoteToday] = await Promise.all([
      fetchSupabaseActiveDates(userId),
      fetchSupabaseTodayActivity(userId),
    ]);

    if (remoteActiveDates.length === 0 && remoteToday.total === 0) {
      return local;
    }

    return mergeRetentionSummaries(local, remoteActiveDates, remoteToday);
  } catch {
    return local;
  }
}

/** Used by progress sync — retention stays separate from lesson progress key. */
export function getRetentionStorageKeys(): string[] {
  return [RETENTION_STORAGE_KEY, PROGRESS_STORAGE_KEY];
}
