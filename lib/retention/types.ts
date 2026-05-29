export const RETENTION_STORAGE_KEY = "buunduu-surtsgaay-retention";
export const RETENTION_SYNC_DISMISS_KEY =
  "buunduu-surtsgaay-retention-sync-dismissed";
export const MAX_ACTIVITY_LOG_DAYS = 90;

export type ActivityType =
  | "lesson_started"
  | "lesson_completed"
  | "word_learned"
  | "quiz_attempt"
  | "review_opened";

export type SupabaseActivityType =
  | "lesson_started"
  | "lesson_completed"
  | "vocabulary_learned"
  | "quiz_completed"
  | "review_opened";

export type ActivityMetadata = {
  lessonId?: string;
  [key: string]: unknown;
};

export type DailyGoal = {
  lessonsPerDay: number;
  wordsPerDay: number;
  quizzesPerDay: number;
};

export const DEFAULT_DAILY_GOAL: DailyGoal = {
  lessonsPerDay: 1,
  wordsPerDay: 5,
  quizzesPerDay: 1,
};

export type DailyActivityLog = {
  date: string;
  activities: ActivityType[];
  /** lesson_started dedupe per lesson per day */
  lessonStartedIds?: string[];
  reviewOpened?: boolean;
};

export type RetentionStore = {
  version: 2;
  dailyGoal: DailyGoal;
  activityLog: DailyActivityLog[];
  longestStreak: number;
  remindersEnabled: boolean;
};

export type TodayActivity = {
  lessonEvents: number;
  wordEvents: number;
  quizEvents: number;
  reviewEvents: number;
};

export type GoalDimensionProgress = {
  current: number;
  target: number;
  met: boolean;
};

export type GoalProgress = {
  lessons: GoalDimensionProgress;
  words: GoalDimensionProgress;
  quizzes: GoalDimensionProgress;
  overallMet: boolean;
  overallPercent: number;
};

export type RetentionSource = "local" | "account" | "merged";

export type LearningRetentionSummary = {
  goal: DailyGoal;
  today: TodayActivity;
  goalProgress: GoalProgress;
  currentStreak: number;
  longestStreak: number;
  activeDaysThisWeek: number;
  weekActivity: boolean[];
  lastActiveDate: string | null;
  source: RetentionSource;
  sourceLabel: string;
};

export type RetentionSourceStatus = {
  isLoggedIn: boolean;
  primary: RetentionSource;
  supabaseAvailable: boolean;
  localHasData: boolean;
  accountHasData: boolean;
};

export type LocalRetentionSyncSummary = {
  activeDays: number;
  currentStreak: number;
  activityEvents: number;
  hasDailyGoal: boolean;
};

export type RetentionSyncResult = {
  ok: boolean;
  error: string | null;
  synced: {
    activityRows: number;
    streakUpdated: boolean;
    goalUpdated: boolean;
  };
};

export function toSupabaseActivityType(type: ActivityType): SupabaseActivityType {
  switch (type) {
    case "word_learned":
      return "vocabulary_learned";
    case "quiz_attempt":
      return "quiz_completed";
    default:
      return type;
  }
}

export function fromSupabaseActivityType(type: string): ActivityType | null {
  switch (type) {
    case "lesson_started":
    case "lesson_completed":
    case "review_opened":
      return type;
    case "vocabulary_learned":
      return "word_learned";
    case "quiz_completed":
      return "quiz_attempt";
    default:
      return null;
  }
}

/** @deprecated use ActivityType */
export type LearningActivityType = ActivityType;
