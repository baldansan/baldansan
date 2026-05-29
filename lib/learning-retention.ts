/** @deprecated Import from @/lib/retention/retention-service */
export {
  recordActivity,
  recordLearningActivity,
  getDailyGoalUnified,
  setDailyGoalUnified,
  getTodayGoalProgressUnified,
  getStreakUnified,
  getLearningRetentionSummarySmart,
  getLearningRetentionSummary,
  getRetentionSourceStatusUnified,
  syncRetentionAfterLogin,
  hasLocalRetentionToSync,
  dismissRetentionSyncOffer,
  getLocalRetentionSyncSummary,
  clearLocalRetentionAfterSync,
  toLocalDateKey,
} from "@/lib/retention/retention-service";

export type {
  LearningRetentionSummary,
  DailyGoal,
  ActivityType as LearningActivityType,
  TodayActivity,
} from "@/lib/retention/types";

export { DEFAULT_DAILY_GOAL, RETENTION_STORAGE_KEY } from "@/lib/retention/types";
