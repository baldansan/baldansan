import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";
import { getAuthenticatedUserId } from "@/lib/supabase/auth";
import type {
  NotificationInput,
  ReminderInput,
  StudyReminder,
  UserAchievement,
  UserNotification,
  WeekdayKey,
} from "@/lib/engagement/types";

export type EngagementResult<T> = { data: T | null; error: string | null };

function notConfigured<T>(): EngagementResult<T> {
  return { data: null, error: "Supabase is not configured." };
}

function toError(error: { message: string } | null): string | null {
  return error?.message ?? null;
}

function mapReminder(row: Record<string, unknown>): StudyReminder {
  return {
    id: String(row.id),
    reminderType: String(row.reminder_type ?? "daily_study"),
    title: String(row.title),
    reminderTime: row.reminder_time ? String(row.reminder_time) : null,
    daysOfWeek: (row.days_of_week as WeekdayKey[]) ?? [],
    enabled: Boolean(row.enabled),
    lastShownAt: row.last_shown_at ? String(row.last_shown_at) : null,
    createdAt: row.created_at ? String(row.created_at) : undefined,
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
  };
}

function mapNotification(row: Record<string, unknown>): UserNotification {
  return {
    id: String(row.id),
    notificationType: row.notification_type as UserNotification["notificationType"],
    title: String(row.title),
    message: row.message ? String(row.message) : null,
    actionHref: row.action_href ? String(row.action_href) : null,
    readAt: row.read_at ? String(row.read_at) : null,
    createdAt: String(row.created_at),
  };
}

function mapAchievement(row: Record<string, unknown>): UserAchievement {
  return {
    id: String(row.id),
    achievementKey: String(row.achievement_key),
    title: String(row.title),
    description: String(row.description ?? ""),
    earnedAt: String(row.earned_at),
    metadata: (row.metadata as Record<string, unknown>) ?? {},
  };
}

async function requireUserId(): Promise<string | null> {
  const { userId } = await getAuthenticatedUserId();
  return userId;
}

export async function getUserStudyReminders(): Promise<EngagementResult<StudyReminder[]>> {
  if (!supabase) return notConfigured();
  const userId = await requireUserId();
  if (!userId) return { data: [], error: null };

  const { data, error } = await supabase
    .from("user_study_reminders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) return { data: null, error: toError(error) };
  return { data: (data ?? []).map(mapReminder), error: null };
}

export async function createUserStudyReminder(
  input: ReminderInput
): Promise<EngagementResult<StudyReminder>> {
  if (!supabase) return notConfigured();
  const userId = await requireUserId();
  if (!userId) return { data: null, error: "Not signed in." };

  const { data, error } = await supabase
    .from("user_study_reminders")
    .insert({
      user_id: userId,
      reminder_type: input.reminderType ?? "daily_study",
      title: input.title,
      reminder_time: input.reminderTime ?? "20:00",
      days_of_week: input.daysOfWeek ?? ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
      enabled: input.enabled ?? true,
    })
    .select("*")
    .single();

  if (error) return { data: null, error: toError(error) };
  return { data: mapReminder(data as Record<string, unknown>), error: null };
}

export async function updateUserStudyReminder(
  id: string,
  input: Partial<ReminderInput> & { lastShownAt?: string | null }
): Promise<EngagementResult<StudyReminder>> {
  if (!supabase) return notConfigured();
  const userId = await requireUserId();
  if (!userId) return { data: null, error: "Not signed in." };

  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.title != null) payload.title = input.title;
  if (input.reminderTime != null) payload.reminder_time = input.reminderTime;
  if (input.daysOfWeek != null) payload.days_of_week = input.daysOfWeek;
  if (input.enabled != null) payload.enabled = input.enabled;
  if (input.lastShownAt !== undefined) payload.last_shown_at = input.lastShownAt;

  const { data, error } = await supabase
    .from("user_study_reminders")
    .update(payload)
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) return { data: null, error: toError(error) };
  return { data: mapReminder(data as Record<string, unknown>), error: null };
}

export async function deleteUserStudyReminder(id: string): Promise<EngagementResult<boolean>> {
  if (!supabase) return notConfigured();
  const userId = await requireUserId();
  if (!userId) return { data: null, error: "Not signed in." };

  const { error } = await supabase
    .from("user_study_reminders")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) return { data: null, error: toError(error) };
  return { data: true, error: null };
}

export async function toggleUserStudyReminder(
  id: string,
  enabled: boolean
): Promise<EngagementResult<StudyReminder>> {
  return updateUserStudyReminder(id, { enabled });
}

export async function getUserNotifications(): Promise<EngagementResult<UserNotification[]>> {
  if (!supabase) return notConfigured();
  const userId = await requireUserId();
  if (!userId) return { data: [], error: null };

  const { data, error } = await supabase
    .from("user_notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return { data: null, error: toError(error) };
  return { data: (data ?? []).map(mapNotification), error: null };
}

export async function createUserNotification(
  input: NotificationInput
): Promise<EngagementResult<UserNotification>> {
  if (!supabase) return notConfigured();
  const userId = await requireUserId();
  if (!userId) return { data: null, error: "Not signed in." };

  const { data, error } = await supabase
    .from("user_notifications")
    .insert({
      user_id: userId,
      notification_type: input.notificationType,
      title: input.title,
      message: input.message ?? null,
      action_href: input.actionHref ?? null,
    })
    .select("*")
    .single();

  if (error) return { data: null, error: toError(error) };
  return { data: mapNotification(data as Record<string, unknown>), error: null };
}

export async function markNotificationRead(id: string): Promise<EngagementResult<boolean>> {
  if (!supabase) return notConfigured();
  const userId = await requireUserId();
  if (!userId) return { data: null, error: "Not signed in." };

  const { error } = await supabase
    .from("user_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) return { data: null, error: toError(error) };
  return { data: true, error: null };
}

export async function markAllNotificationsRead(): Promise<EngagementResult<boolean>> {
  if (!supabase) return notConfigured();
  const userId = await requireUserId();
  if (!userId) return { data: null, error: "Not signed in." };

  const { error } = await supabase
    .from("user_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) return { data: null, error: toError(error) };
  return { data: true, error: null };
}

export async function getUserAchievements(): Promise<EngagementResult<UserAchievement[]>> {
  if (!supabase) return notConfigured();
  const userId = await requireUserId();
  if (!userId) return { data: [], error: null };

  const { data, error } = await supabase
    .from("user_achievements")
    .select("*")
    .eq("user_id", userId)
    .order("earned_at", { ascending: false });

  if (error) return { data: null, error: toError(error) };
  return { data: (data ?? []).map(mapAchievement), error: null };
}

export async function hasAchievement(key: string): Promise<boolean> {
  if (!supabase || !hasSupabaseConfig) return false;
  const userId = await requireUserId();
  if (!userId) return false;

  const { data } = await supabase
    .from("user_achievements")
    .select("id")
    .eq("user_id", userId)
    .eq("achievement_key", key)
    .maybeSingle();

  return Boolean(data);
}

export async function awardAchievement(
  key: string,
  title: string,
  description: string,
  metadata?: Record<string, unknown>
): Promise<EngagementResult<UserAchievement | null>> {
  if (!supabase) return notConfigured();
  const userId = await requireUserId();
  if (!userId) return { data: null, error: "Not signed in." };

  const existing = await hasAchievement(key);
  if (existing) return { data: null, error: null };

  const { data, error } = await supabase
    .from("user_achievements")
    .insert({
      user_id: userId,
      achievement_key: key,
      title,
      description,
      metadata: metadata ?? {},
    })
    .select("*")
    .single();

  if (error) {
    if (error.message.includes("duplicate") || error.code === "23505") {
      return { data: null, error: null };
    }
    return { data: null, error: toError(error) };
  }

  return { data: mapAchievement(data as Record<string, unknown>), error: null };
}

export async function getUnreadNotificationCount(): Promise<number> {
  if (!supabase || !hasSupabaseConfig) return 0;
  const userId = await requireUserId();
  if (!userId) return 0;

  const { count, error } = await supabase
    .from("user_notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) return 0;
  return count ?? 0;
}
