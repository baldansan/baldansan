import {
  getAllLessonProgress,
  getAllQuizResults,
} from "@/lib/progress";
import {
  addDays,
  computeCurrentStreak,
  computeLongestStreak,
  computeStreakWithFreeze,
  getActiveDatesFromLog,
  getLastActiveDate,
  getWeekActivity,
  toLocalDateKey,
} from "@/lib/retention/streak-utils";
import {
  DEFAULT_DAILY_GOAL,
  MAX_ACTIVITY_LOG_DAYS,
  RETENTION_STORAGE_KEY,
  type ActivityMetadata,
  type ActivityType,
  type DailyActivityLog,
  type DailyGoal,
  type GoalProgress,
  type LearningRetentionSummary,
  type LocalRetentionSyncSummary,
  type RetentionStore,
  type TodayActivity,
} from "@/lib/retention/types";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function defaultStore(): RetentionStore {
  return {
    version: 2,
    dailyGoal: { ...DEFAULT_DAILY_GOAL },
    activityLog: [],
    longestStreak: 0,
    remindersEnabled: false,
  };
}

function migrateStore(parsed: Partial<RetentionStore> & { dailyGoal?: unknown }): RetentionStore {
  if (
    parsed.dailyGoal &&
    typeof parsed.dailyGoal === "object" &&
    "lessonsPerDay" in parsed.dailyGoal
  ) {
    return {
      version: 2,
      dailyGoal: parsed.dailyGoal as DailyGoal,
      activityLog: parsed.activityLog ?? [],
      longestStreak: parsed.longestStreak ?? 0,
      remindersEnabled: parsed.remindersEnabled ?? false,
    };
  }

  const legacyGoal =
    typeof parsed.dailyGoal === "number" ? parsed.dailyGoal : DEFAULT_DAILY_GOAL.lessonsPerDay;

  return {
    version: 2,
    dailyGoal: {
      lessonsPerDay: Math.max(1, Math.min(legacyGoal, 3)),
      wordsPerDay: DEFAULT_DAILY_GOAL.wordsPerDay,
      quizzesPerDay: DEFAULT_DAILY_GOAL.quizzesPerDay,
    },
    activityLog: parsed.activityLog ?? [],
    longestStreak: parsed.longestStreak ?? 0,
    remindersEnabled: parsed.remindersEnabled ?? false,
  };
}

export function readRetentionStore(): RetentionStore {
  if (!isBrowser()) {
    return defaultStore();
  }

  try {
    const raw = window.localStorage.getItem(RETENTION_STORAGE_KEY);
    if (!raw) {
      return defaultStore();
    }
    return migrateStore(JSON.parse(raw) as Partial<RetentionStore>);
  } catch {
    return defaultStore();
  }
}

export function writeRetentionStore(store: RetentionStore): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(RETENTION_STORAGE_KEY, JSON.stringify(store));
}

function trimActivityLog(log: DailyActivityLog[]): DailyActivityLog[] {
  const cutoff = addDays(toLocalDateKey(), -(MAX_ACTIVITY_LOG_DAYS - 1));
  return log
    .filter((entry) => entry.date >= cutoff)
    .sort((a, b) => a.date.localeCompare(b.date));
}

function countTodayFromLog(
  log: DailyActivityLog[],
  dateKey: string
): TodayActivity {
  const entry = log.find((item) => item.date === dateKey);
  if (!entry) {
    return { lessonEvents: 0, wordEvents: 0, quizEvents: 0, reviewEvents: 0 };
  }

  let lessonEvents = 0;
  let wordEvents = 0;
  let quizEvents = 0;
  let reviewEvents = 0;

  for (const activity of entry.activities) {
    if (activity === "lesson_started" || activity === "lesson_completed") {
      lessonEvents += 1;
    } else if (activity === "word_learned") {
      wordEvents += 1;
    } else if (activity === "quiz_attempt") {
      quizEvents += 1;
    } else if (activity === "review_opened") {
      reviewEvents += 1;
    }
  }

  return { lessonEvents, wordEvents, quizEvents, reviewEvents };
}

export function buildGoalProgress(
  goal: DailyGoal,
  today: TodayActivity
): GoalProgress {
  const lessons = {
    current: today.lessonEvents,
    target: goal.lessonsPerDay,
    met: today.lessonEvents >= goal.lessonsPerDay,
  };
  const words = {
    current: today.wordEvents,
    target: goal.wordsPerDay,
    met: today.wordEvents >= goal.wordsPerDay,
  };
  const quizzes = {
    current: today.quizEvents,
    target: goal.quizzesPerDay,
    met: today.quizEvents >= goal.quizzesPerDay,
  };

  const ratios = [
    Math.min(lessons.current / Math.max(lessons.target, 1), 1),
    Math.min(words.current / Math.max(words.target, 1), 1),
    Math.min(quizzes.current / Math.max(quizzes.target, 1), 1),
  ];
  const overallPercent = Math.round(
    (ratios.reduce((sum, value) => sum + value, 0) / ratios.length) * 100
  );

  return {
    lessons,
    words,
    quizzes,
    overallMet: lessons.met && words.met && quizzes.met,
    overallPercent,
  };
}

export function bootstrapRetentionFromProgressIfEmpty(): void {
  if (!isBrowser()) return;

  const store = readRetentionStore();
  if (store.activityLog.length > 0) return;

  const byDate = new Map<string, ActivityType[]>();

  function push(dateKey: string, type: ActivityType) {
    const list = byDate.get(dateKey) ?? [];
    list.push(type);
    byDate.set(dateKey, list);
  }

  for (const [, progress] of Object.entries(getAllLessonProgress())) {
    if (progress.startedAt) {
      push(toLocalDateKey(progress.startedAt), "lesson_started");
    }
    if (progress.completedAt) {
      push(toLocalDateKey(progress.completedAt), "lesson_completed");
    }
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

function shouldSkipLocalActivity(
  entry: DailyActivityLog,
  type: ActivityType,
  metadata?: ActivityMetadata
): boolean {
  if (type === "review_opened") {
    return entry.reviewOpened === true;
  }

  if (type === "lesson_started" && metadata?.lessonId) {
    const ids = entry.lessonStartedIds ?? [];
    return ids.includes(metadata.lessonId);
  }

  return false;
}

export function recordLocalActivity(
  type: ActivityType,
  metadata?: ActivityMetadata
): void {
  if (!isBrowser()) return;

  bootstrapRetentionFromProgressIfEmpty();

  const store = readRetentionStore();
  const today = toLocalDateKey();
  const nextLog = trimActivityLog([...store.activityLog]);
  let entry = nextLog.find((item) => item.date === today);

  if (!entry) {
    entry = { date: today, activities: [] };
    nextLog.push(entry);
  }

  if (shouldSkipLocalActivity(entry, type, metadata)) {
    return;
  }

  entry.activities.push(type);

  if (type === "review_opened") {
    entry.reviewOpened = true;
  }

  if (type === "lesson_started" && metadata?.lessonId) {
    entry.lessonStartedIds = [...(entry.lessonStartedIds ?? []), metadata.lessonId];
  }

  const activeDates = getActiveDatesFromLog(nextLog);
  const currentStreak = computeStreakWithFreeze(activeDates, today).streak;

  writeRetentionStore({
    ...store,
    activityLog: nextLog,
    longestStreak: Math.max(
      store.longestStreak,
      computeLongestStreak(activeDates),
      currentStreak
    ),
  });
}

export function getLocalDailyGoal(): DailyGoal {
  bootstrapRetentionFromProgressIfEmpty();
  return { ...readRetentionStore().dailyGoal };
}

export function setLocalDailyGoal(goal: DailyGoal): void {
  if (!isBrowser()) return;
  const store = readRetentionStore();
  writeRetentionStore({
    ...store,
    dailyGoal: {
      lessonsPerDay: Math.max(1, goal.lessonsPerDay),
      wordsPerDay: Math.max(1, goal.wordsPerDay),
      quizzesPerDay: Math.max(1, goal.quizzesPerDay),
    },
  });
}

export function getLocalRetentionSummary(): LearningRetentionSummary {
  bootstrapRetentionFromProgressIfEmpty();

  const store = readRetentionStore();
  const today = toLocalDateKey();
  const activeDates = getActiveDatesFromLog(store.activityLog);
  const todayActivity = countTodayFromLog(store.activityLog, today);
  const goalProgress = buildGoalProgress(store.dailyGoal, todayActivity);
  const { weekActivity, activeDaysThisWeek } = getWeekActivity(activeDates, today);
  const streakInfo = computeStreakWithFreeze(activeDates, today);

  return {
    goal: { ...store.dailyGoal },
    today: todayActivity,
    goalProgress,
    currentStreak: streakInfo.streak,
    longestStreak: Math.max(
      store.longestStreak,
      computeLongestStreak(activeDates),
      streakInfo.streak
    ),
    streakFreeze: {
      usedThisMonth: streakInfo.freezesUsedThisMonth,
      total: streakInfo.freezesTotal,
    },
    activeDaysThisWeek,
    weekActivity,
    lastActiveDate: getLastActiveDate(activeDates),
    source: "local",
    sourceLabel: "Энэ төхөөрөмж дээр хадгалагдаж байна",
  };
}

export function hasLocalRetentionData(): boolean {
  if (!isBrowser()) return false;
  bootstrapRetentionFromProgressIfEmpty();
  const store = readRetentionStore();
  return store.activityLog.some((entry) => entry.activities.length > 0);
}

export function getLocalRetentionSyncSummary(): LocalRetentionSyncSummary {
  bootstrapRetentionFromProgressIfEmpty();
  const store = readRetentionStore();
  const activeDates = getActiveDatesFromLog(store.activityLog);
  const activityEvents = store.activityLog.reduce(
    (sum, entry) => sum + entry.activities.length,
    0
  );

  return {
    activeDays: activeDates.length,
    currentStreak: computeCurrentStreak(activeDates),
    activityEvents,
    hasDailyGoal: true,
  };
}

export function clearLocalRetentionAfterSync(): void {
  if (!isBrowser()) return;
  const store = readRetentionStore();
  writeRetentionStore({
    ...store,
    activityLog: [],
    longestStreak: 0,
  });
}

export function getLocalActivityLogForSync(): DailyActivityLog[] {
  bootstrapRetentionFromProgressIfEmpty();
  return readRetentionStore().activityLog;
}

export function countTodayFromSupabaseCounts(
  counts: {
    lesson_started: number;
    lesson_completed: number;
    vocabulary_learned: number;
    quiz_completed: number;
    review_opened: number;
  }
): TodayActivity {
  return {
    lessonEvents: counts.lesson_started + counts.lesson_completed,
    wordEvents: counts.vocabulary_learned,
    quizEvents: counts.quiz_completed,
    reviewEvents: counts.review_opened,
  };
}
