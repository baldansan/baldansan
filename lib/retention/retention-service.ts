import {
  bootstrapRetentionFromProgressIfEmpty,
  clearLocalRetentionAfterSync,
  getLocalActivityLogForSync,
  getLocalDailyGoal,
  getLocalRetentionSummary,
  getLocalRetentionSyncSummary,
  hasLocalRetentionData,
  recordLocalActivity,
  setLocalDailyGoal,
} from "@/lib/retention/daily-activity";
import {
  RETENTION_SYNC_DISMISS_KEY,
  type ActivityMetadata,
  type ActivityType,
  type DailyGoal,
  type LearningRetentionSummary,
  type RetentionSourceStatus,
  type RetentionSyncResult,
} from "@/lib/retention/types";
import { getAuthenticatedUserId, hasSupabaseConfig } from "@/lib/supabase/auth";
import {
  accountHasRetentionData,
  getRetentionSourceStatus,
  getSupabaseDailyGoal,
  getSupabaseRetentionSummary,
  recordSupabaseDailyActivity,
  syncLocalRetentionToSupabase,
  upsertSupabaseDailyGoal,
} from "@/lib/supabase/retention";

export async function recordActivity(
  type: ActivityType,
  metadata?: ActivityMetadata
): Promise<void> {
  recordLocalActivity(type, metadata);

  void import("@/lib/engagement/achievement-service").then((mod) =>
    mod.evaluateAndAwardAchievements(type)
  );

  if (!hasSupabaseConfig) return;

  try {
    const { userId } = await getAuthenticatedUserId();
    if (!userId) return;

    const result = await recordSupabaseDailyActivity(userId, type, metadata);
    if (result.error) {
      console.warn("[retention] Supabase activity write failed; local saved.", result.error);
    }
  } catch (error) {
    console.warn("[retention] Supabase activity write failed; local saved.", error);
  }
}

export async function getDailyGoalUnified(): Promise<DailyGoal> {
  const local = getLocalDailyGoal();

  if (!hasSupabaseConfig) return local;

  try {
    const { userId } = await getAuthenticatedUserId();
    if (!userId) return local;

    const { data, error } = await getSupabaseDailyGoal(userId);
    if (error || !data) return local;
    return data;
  } catch {
    return local;
  }
}

export async function setDailyGoalUnified(goal: DailyGoal): Promise<void> {
  setLocalDailyGoal(goal);

  if (!hasSupabaseConfig) return;

  try {
    const { userId } = await getAuthenticatedUserId();
    if (!userId) return;

    const result = await upsertSupabaseDailyGoal(userId, goal);
    if (result.error) {
      console.warn("[retention] Supabase goal save failed; local saved.", result.error);
    }
  } catch (error) {
    console.warn("[retention] Supabase goal save failed; local saved.", error);
  }
}

export async function getTodayGoalProgressUnified(): Promise<LearningRetentionSummary> {
  return getStreakUnified();
}

export async function getStreakUnified(): Promise<LearningRetentionSummary> {
  bootstrapRetentionFromProgressIfEmpty();
  const local = getLocalRetentionSummary();

  if (!hasSupabaseConfig) return local;

  try {
    const { userId } = await getAuthenticatedUserId();
    if (!userId) return local;

    const { data, error } = await getSupabaseRetentionSummary(userId);
    if (error || !data) {
      console.warn("[retention] Supabase summary fetch failed; using local.", error);
      return local;
    }

    return data;
  } catch {
    return local;
  }
}

export async function getRetentionSourceStatusUnified(): Promise<RetentionSourceStatus> {
  const localHasData = hasLocalRetentionData();
  let isLoggedIn = false;
  let accountHasData = false;

  if (hasSupabaseConfig) {
    const { userId } = await getAuthenticatedUserId();
    isLoggedIn = Boolean(userId);
    if (userId) {
      accountHasData = await accountHasRetentionData(userId);
    }
  }

  return getRetentionSourceStatus(isLoggedIn, localHasData, accountHasData);
}

export function dismissRetentionSyncOffer(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(RETENTION_SYNC_DISMISS_KEY, "1");
}

export function hasLocalRetentionToSync(): boolean {
  if (typeof window === "undefined") return false;
  if (sessionStorage.getItem(RETENTION_SYNC_DISMISS_KEY) === "1") return false;
  return hasLocalRetentionData();
}

export async function syncRetentionAfterLogin(
  userId: string
): Promise<RetentionSyncResult> {
  const localLog = getLocalActivityLogForSync();
  const localGoal = getLocalDailyGoal();

  if (localLog.length === 0) {
    return {
      ok: true,
      error: null,
      synced: { activityRows: 0, streakUpdated: false, goalUpdated: false },
    };
  }

  const result = await syncLocalRetentionToSupabase(userId, localLog, localGoal);
  if (result.ok) {
    clearLocalRetentionAfterSync();
  }
  return result;
}

export { getLocalRetentionSyncSummary, clearLocalRetentionAfterSync };

/** @deprecated use recordActivity */
export async function recordLearningActivity(
  type: ActivityType,
  metadata?: ActivityMetadata
): Promise<void> {
  await recordActivity(type, metadata);
}

/** @deprecated use getStreakUnified */
export async function getLearningRetentionSummarySmart(): Promise<LearningRetentionSummary> {
  return getStreakUnified();
}

export { getLocalRetentionSummary as getLearningRetentionSummary } from "@/lib/retention/daily-activity";
export type {
  LearningRetentionSummary,
  DailyGoal,
  ActivityType,
  RetentionSourceStatus,
} from "@/lib/retention/types";
export { toLocalDateKey } from "@/lib/retention/streak-utils";
