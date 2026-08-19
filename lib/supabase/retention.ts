import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";
import {
  buildGoalProgress,
  countTodayFromSupabaseCounts,
} from "@/lib/retention/daily-activity";
import {
  computeStreakWithFreeze,
  computeLongestStreak,
  getActiveDatesFromSupabaseRows,
  getLastActiveDate,
  getWeekActivity,
  toLocalDateKey,
} from "@/lib/retention/streak-utils";
import {
  DEFAULT_DAILY_GOAL,
  toSupabaseActivityType,
  type ActivityMetadata,
  type ActivityType,
  type DailyGoal,
  type LearningRetentionSummary,
  type RetentionSyncResult,
  type TodayActivity,
} from "@/lib/retention/types";
import type { DailyActivityLog } from "@/lib/retention/types";

export type RetentionResult<T> = {
  data: T | null;
  error: string | null;
};

export type UserDailyActivityRow = {
  id: string;
  user_id: string;
  activity_date: string;
  activity_type: string;
  count: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type UserDailyGoalRow = {
  user_id: string;
  lessons_per_day: number;
  words_per_day: number;
  quizzes_per_day: number;
  updated_at: string;
};

export type UserStreakRow = {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
  updated_at: string;
};

const NOT_CONFIGURED = "Supabase is not configured.";

function notConfigured<T>(): RetentionResult<T> {
  return { data: null, error: NOT_CONFIGURED };
}

function toErrorMessage(error: { message: string } | null): string | null {
  return error?.message ?? null;
}

function rowToDailyGoal(row: UserDailyGoalRow): DailyGoal {
  return {
    lessonsPerDay: row.lessons_per_day,
    wordsPerDay: row.words_per_day,
    quizzesPerDay: row.quizzes_per_day,
  };
}

function emptyTodayCounts() {
  return {
    lesson_started: 0,
    lesson_completed: 0,
    vocabulary_learned: 0,
    quiz_completed: 0,
    review_opened: 0,
  };
}

function mergeMetadata(
  existing: Record<string, unknown>,
  incoming?: ActivityMetadata
): Record<string, unknown> {
  if (!incoming) return existing;
  const next = { ...existing, ...incoming };
  if (incoming.lessonId) {
    const lessonIds = new Set<string>(
      Array.isArray(existing.lessonIds)
        ? (existing.lessonIds as string[])
        : []
    );
    lessonIds.add(incoming.lessonId);
    next.lessonIds = [...lessonIds];
  }
  return next;
}

function shouldSkipSupabaseIncrement(
  type: ActivityType,
  existing: UserDailyActivityRow | null,
  metadata?: ActivityMetadata
): boolean {
  if (!existing) return false;

  if (type === "review_opened") {
    return existing.count >= 1;
  }

  if (type === "lesson_started" && metadata?.lessonId) {
    const lessonIds = existing.metadata?.lessonIds;
    if (Array.isArray(lessonIds) && lessonIds.includes(metadata.lessonId)) {
      return true;
    }
  }

  return false;
}

export async function getSupabaseDailyGoal(
  userId: string
): Promise<RetentionResult<DailyGoal>> {
  if (!supabase) return notConfigured();

  const { data, error } = await supabase
    .from("user_daily_goals")
    .select("user_id, lessons_per_day, words_per_day, quizzes_per_day, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return { data: null, error: toErrorMessage(error) };
  }

  if (!data) {
    const created = await upsertSupabaseDailyGoal(userId, DEFAULT_DAILY_GOAL);
    return created;
  }

  return { data: rowToDailyGoal(data as UserDailyGoalRow), error: null };
}

export async function upsertSupabaseDailyGoal(
  userId: string,
  goal: DailyGoal
): Promise<RetentionResult<DailyGoal>> {
  if (!supabase) return notConfigured();

  const payload = {
    user_id: userId,
    lessons_per_day: Math.max(1, goal.lessonsPerDay),
    words_per_day: Math.max(1, goal.wordsPerDay),
    quizzes_per_day: Math.max(1, goal.quizzesPerDay),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("user_daily_goals")
    .upsert(payload, { onConflict: "user_id" })
    .select("user_id, lessons_per_day, words_per_day, quizzes_per_day, updated_at")
    .single();

  if (error) {
    return { data: null, error: toErrorMessage(error) };
  }

  return { data: rowToDailyGoal(data as UserDailyGoalRow), error: null };
}

export async function recordSupabaseDailyActivity(
  userId: string,
  type: ActivityType,
  metadata?: ActivityMetadata,
  activityDate = toLocalDateKey()
): Promise<RetentionResult<UserDailyActivityRow>> {
  if (!supabase) return notConfigured();

  const activityType = toSupabaseActivityType(type);

  const { data: existing, error: readError } = await supabase
    .from("user_daily_activity")
    .select("id, user_id, activity_date, activity_type, count, metadata, created_at, updated_at")
    .eq("user_id", userId)
    .eq("activity_date", activityDate)
    .eq("activity_type", activityType)
    .maybeSingle();

  if (readError) {
    return { data: null, error: toErrorMessage(readError) };
  }

  const existingRow = (existing as UserDailyActivityRow | null) ?? null;

  if (shouldSkipSupabaseIncrement(type, existingRow, metadata)) {
    return { data: existingRow, error: null };
  }

  if (existingRow) {
    const nextMetadata = mergeMetadata(existingRow.metadata ?? {}, metadata);
    const { data, error } = await supabase
      .from("user_daily_activity")
      .update({
        count: existingRow.count + 1,
        metadata: nextMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingRow.id)
      .select("id, user_id, activity_date, activity_type, count, metadata, created_at, updated_at")
      .single();

    if (error) {
      return { data: null, error: toErrorMessage(error) };
    }

    await recomputeAndSaveSupabaseStreak(userId);
    return { data: data as UserDailyActivityRow, error: null };
  }

  const insertMetadata = mergeMetadata({}, metadata);
  const { data, error } = await supabase
    .from("user_daily_activity")
    .insert({
      user_id: userId,
      activity_date: activityDate,
      activity_type: activityType,
      count: 1,
      metadata: insertMetadata,
    })
    .select("id, user_id, activity_date, activity_type, count, metadata, created_at, updated_at")
    .single();

  if (error) {
    return { data: null, error: toErrorMessage(error) };
  }

  await recomputeAndSaveSupabaseStreak(userId);
  return { data: data as UserDailyActivityRow, error: null };
}

export async function getSupabaseDailyActivity(
  userId: string,
  days = 90
): Promise<RetentionResult<UserDailyActivityRow[]>> {
  if (!supabase) return notConfigured();

  const cutoff = toLocalDateKey(
    new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000)
  );

  const { data, error } = await supabase
    .from("user_daily_activity")
    .select("id, user_id, activity_date, activity_type, count, metadata, created_at, updated_at")
    .eq("user_id", userId)
    .gte("activity_date", cutoff)
    .order("activity_date", { ascending: true });

  if (error) {
    return { data: null, error: toErrorMessage(error) };
  }

  return { data: (data as UserDailyActivityRow[]) ?? [], error: null };
}

export async function getSupabaseTodayActivity(
  userId: string
): Promise<RetentionResult<TodayActivity>> {
  if (!supabase) return notConfigured();

  const today = toLocalDateKey();
  const { data, error } = await supabase
    .from("user_daily_activity")
    .select("activity_type, count")
    .eq("user_id", userId)
    .eq("activity_date", today);

  if (error) {
    return { data: null, error: toErrorMessage(error) };
  }

  const counts = emptyTodayCounts();
  for (const row of data ?? []) {
    const key = row.activity_type as keyof typeof counts;
    if (key in counts) {
      counts[key] += Number(row.count) || 0;
    }
  }

  return { data: countTodayFromSupabaseCounts(counts), error: null };
}

export async function getSupabaseStreak(
  userId: string
): Promise<RetentionResult<UserStreakRow>> {
  if (!supabase) return notConfigured();

  const { data, error } = await supabase
    .from("user_streaks")
    .select("user_id, current_streak, longest_streak, last_active_date, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return { data: null, error: toErrorMessage(error) };
  }

  return { data: (data as UserStreakRow | null) ?? null, error: null };
}

export async function recomputeAndSaveSupabaseStreak(
  userId: string
): Promise<RetentionResult<UserStreakRow>> {
  if (!supabase) return notConfigured();

  const activity = await getSupabaseDailyActivity(userId);
  if (activity.error) {
    return { data: null, error: activity.error };
  }

  const dateCounts = new Map<string, number>();
  for (const row of activity.data ?? []) {
    dateCounts.set(
      row.activity_date,
      (dateCounts.get(row.activity_date) ?? 0) + row.count
    );
  }

  const activeRows = [...dateCounts.entries()]
    .filter(([, count]) => count > 0)
    .map(([activity_date, count]) => ({ activity_date, count }));

  const activeDates = getActiveDatesFromSupabaseRows(activeRows);
  const today = toLocalDateKey();
  const currentStreak = computeStreakWithFreeze(activeDates, today).streak;
  const longestStreak = computeLongestStreak(activeDates);
  const lastActiveDate = getLastActiveDate(activeDates);

  const existing = await getSupabaseStreak(userId);
  const mergedLongest = Math.max(
    longestStreak,
    existing.data?.longest_streak ?? 0
  );

  const payload = {
    user_id: userId,
    current_streak: currentStreak,
    longest_streak: mergedLongest,
    last_active_date: lastActiveDate,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("user_streaks")
    .upsert(payload, { onConflict: "user_id" })
    .select("user_id, current_streak, longest_streak, last_active_date, updated_at")
    .single();

  if (error) {
    return { data: null, error: toErrorMessage(error) };
  }

  return { data: data as UserStreakRow, error: null };
}

export async function getSupabaseRetentionSummary(
  userId: string
): Promise<RetentionResult<LearningRetentionSummary>> {
  const [goalResult, todayResult, streakResult, activityResult] =
    await Promise.all([
      getSupabaseDailyGoal(userId),
      getSupabaseTodayActivity(userId),
      getSupabaseStreak(userId),
      getSupabaseDailyActivity(userId),
    ]);

  if (goalResult.error) {
    return { data: null, error: goalResult.error };
  }
  if (todayResult.error) {
    return { data: null, error: todayResult.error };
  }

  const goal = goalResult.data ?? DEFAULT_DAILY_GOAL;
  const today = todayResult.data ?? {
    lessonEvents: 0,
    wordEvents: 0,
    quizEvents: 0,
    reviewEvents: 0,
  };
  const goalProgress = buildGoalProgress(goal, today);

  let activeDates: string[] = [];
  if (!activityResult.error && activityResult.data) {
    const dateCounts = new Map<string, number>();
    for (const row of activityResult.data) {
      dateCounts.set(
        row.activity_date,
        (dateCounts.get(row.activity_date) ?? 0) + row.count
      );
    }
    activeDates = getActiveDatesFromSupabaseRows(
      [...dateCounts.entries()].map(([activity_date, count]) => ({
        activity_date,
        count,
      }))
    );
  }

  const todayKey = toLocalDateKey();
  const { weekActivity, activeDaysThisWeek } = getWeekActivity(activeDates, todayKey);

  const streakInfo = computeStreakWithFreeze(activeDates, todayKey);
  const computedCurrent = streakInfo.streak;
  const computedLongest = Math.max(
    computeLongestStreak(activeDates),
    streakResult.data?.longest_streak ?? 0
  );

  return {
    data: {
      goal,
      today,
      goalProgress,
      currentStreak: streakResult.data?.current_streak ?? computedCurrent,
      streakFreeze: {
        usedThisMonth: streakInfo.freezesUsedThisMonth,
        total: streakInfo.freezesTotal,
      },
      longestStreak: streakResult.data?.longest_streak ?? computedLongest,
      activeDaysThisWeek,
      weekActivity,
      lastActiveDate:
        streakResult.data?.last_active_date ?? getLastActiveDate(activeDates),
      source: "account",
      sourceLabel: "Account дээр хадгалагдаж байна",
    },
    error: null,
  };
}

export async function syncLocalRetentionToSupabase(
  userId: string,
  localLog: DailyActivityLog[],
  localGoal: DailyGoal
): Promise<RetentionSyncResult> {
  const synced = { activityRows: 0, streakUpdated: false, goalUpdated: false };

  if (!supabase) {
    return { ok: false, error: NOT_CONFIGURED, synced };
  }

  const goalResult = await upsertSupabaseDailyGoal(userId, localGoal);
  if (goalResult.error) {
    return { ok: false, error: goalResult.error, synced };
  }
  synced.goalUpdated = true;

  const grouped = new Map<
    string,
    Map<string, { count: number; metadata: Record<string, unknown> }>
  >();

  for (const day of localLog) {
    for (const activity of day.activities) {
      const supabaseType = toSupabaseActivityType(activity);
      const dayMap =
        grouped.get(day.date) ?? new Map<string, { count: number; metadata: Record<string, unknown> }>();
      const current = dayMap.get(supabaseType) ?? { count: 0, metadata: {} };
      current.count += 1;
      if (activity === "lesson_started" && day.lessonStartedIds?.length) {
        current.metadata.lessonIds = day.lessonStartedIds;
      }
      dayMap.set(supabaseType, current);
      grouped.set(day.date, dayMap);
    }
  }

  for (const [activityDate, typeMap] of grouped.entries()) {
    for (const [activityType, payload] of typeMap.entries()) {
      const { data: existing } = await supabase
        .from("user_daily_activity")
        .select("id, count, metadata")
        .eq("user_id", userId)
        .eq("activity_date", activityDate)
        .eq("activity_type", activityType)
        .maybeSingle();

      if (existing) {
        const mergedCount = Math.max(existing.count ?? 0, payload.count);
        const mergedMetadata = mergeMetadata(existing.metadata ?? {}, payload.metadata);
        const { error } = await supabase
          .from("user_daily_activity")
          .update({
            count: mergedCount,
            metadata: mergedMetadata,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        if (error) {
          return { ok: false, error: error.message, synced };
        }
      } else {
        const { error } = await supabase.from("user_daily_activity").insert({
          user_id: userId,
          activity_date: activityDate,
          activity_type: activityType,
          count: payload.count,
          metadata: payload.metadata,
        });

        if (error) {
          return { ok: false, error: error.message, synced };
        }
      }

      synced.activityRows += 1;
    }
  }

  const streakResult = await recomputeAndSaveSupabaseStreak(userId);
  if (streakResult.error) {
    return { ok: false, error: streakResult.error, synced };
  }
  synced.streakUpdated = true;

  return { ok: true, error: null, synced };
}

export function getRetentionSourceStatus(
  isLoggedIn: boolean,
  localHasData: boolean,
  accountHasData: boolean
) {
  return {
    isLoggedIn,
    primary: isLoggedIn ? ("account" as const) : ("local" as const),
    supabaseAvailable: hasSupabaseConfig,
    localHasData,
    accountHasData,
  };
}

export async function accountHasRetentionData(
  userId: string
): Promise<boolean> {
  if (!supabase) return false;

  const { data, error } = await supabase
    .from("user_daily_activity")
    .select("id")
    .eq("user_id", userId)
    .limit(1);

  if (!error && data && data.length > 0) return true;

  const streak = await getSupabaseStreak(userId);
  return Boolean(streak.data && streak.data.current_streak > 0);
}
