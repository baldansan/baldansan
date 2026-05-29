import { supabase } from "@/lib/supabase/client";
import {
  toLocalDateKey,
  type TodayActivity,
} from "@/lib/learning-retention";

/**
 * Future Supabase table (not migrated yet):
 *
 * user_daily_activity (
 *   user_id uuid references auth.users,
 *   activity_date date not null,
 *   activity_count int default 0,
 *   lesson_events int default 0,
 *   word_events int default 0,
 *   quiz_events int default 0,
 *   updated_at timestamptz default now(),
 *   primary key (user_id, activity_date)
 * )
 *
 * user_retention_settings (
 *   user_id uuid primary key references auth.users,
 *   daily_goal int default 3,
 *   reminders_enabled boolean default false,
 *   reminder_time time,
 *   updated_at timestamptz default now()
 * )
 */

export type UserDailyActivityRow = {
  user_id: string;
  activity_date: string;
  activity_count: number;
  lesson_events: number;
  word_events: number;
  quiz_events: number;
  updated_at: string;
};

export type UserRetentionSettingsRow = {
  user_id: string;
  daily_goal: number;
  reminders_enabled: boolean;
  reminder_time: string | null;
  updated_at: string;
};

function collectDatesFromIso(values: (string | null | undefined)[]): string[] {
  return values
    .filter((value): value is string => Boolean(value))
    .map((value) => toLocalDateKey(value));
}

export async function fetchSupabaseActiveDates(userId: string): Promise<string[]> {
  if (!supabase) return [];

  const [lessons, vocabulary, quizzes] = await Promise.all([
    supabase
      .from("user_lesson_progress")
      .select("updated_at, completed_at")
      .eq("user_id", userId)
      .neq("status", "not_started"),
    supabase
      .from("user_vocabulary_progress")
      .select("learned_at, updated_at")
      .eq("user_id", userId)
      .eq("status", "learned"),
    supabase
      .from("user_quiz_attempts")
      .select("created_at")
      .eq("user_id", userId),
  ]);

  const dates: string[] = [];

  for (const row of lessons.data ?? []) {
    dates.push(...collectDatesFromIso([row.updated_at, row.completed_at]));
  }
  for (const row of vocabulary.data ?? []) {
    dates.push(...collectDatesFromIso([row.learned_at, row.updated_at]));
  }
  for (const row of quizzes.data ?? []) {
    dates.push(...collectDatesFromIso([row.created_at]));
  }

  return [...new Set(dates)];
}

export async function fetchSupabaseTodayActivity(
  userId: string
): Promise<TodayActivity> {
  if (!supabase) {
    return { lessonEvents: 0, wordEvents: 0, quizEvents: 0, total: 0 };
  }

  const today = toLocalDateKey();
  const start = `${today}T00:00:00.000`;
  const end = `${today}T23:59:59.999`;

  const [lessons, vocabulary, quizzes] = await Promise.all([
    supabase
      .from("user_lesson_progress")
      .select("updated_at, completed_at")
      .eq("user_id", userId)
      .gte("updated_at", start)
      .lte("updated_at", end),
    supabase
      .from("user_vocabulary_progress")
      .select("learned_at")
      .eq("user_id", userId)
      .eq("status", "learned")
      .gte("learned_at", start)
      .lte("learned_at", end),
    supabase
      .from("user_quiz_attempts")
      .select("id")
      .eq("user_id", userId)
      .gte("created_at", start)
      .lte("created_at", end),
  ]);

  const lessonEvents = (lessons.data ?? []).length;
  const wordEvents = (vocabulary.data ?? []).length;
  const quizEvents = (quizzes.data ?? []).length;

  return {
    lessonEvents,
    wordEvents,
    quizEvents,
    total: lessonEvents + wordEvents + quizEvents,
  };
}

/** Future: upsert into user_daily_activity when table exists. */
export async function syncRetentionActivityToSupabase(
  _userId: string,
  _activityDate: string,
  _counts: TodayActivity
): Promise<{ error: string | null }> {
  return { error: null };
}

/** Future: load daily_goal / reminders from user_retention_settings. */
export async function fetchRetentionSettingsFromSupabase(
  _userId: string
): Promise<UserRetentionSettingsRow | null> {
  return null;
}
