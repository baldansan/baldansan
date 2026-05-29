import {
  addLocalNotification,
  deleteLocalReminder,
  getLocalAchievements,
  getLocalNotifications,
  getLocalReminders,
  getLocalUnreadNotificationCount,
  markAllLocalNotificationsRead,
  markLocalNotificationRead,
  saveLocalReminder,
  updateLocalReminder,
} from "@/lib/engagement/local-engagement";
import type {
  NotificationInput,
  ReminderInput,
  StudyReminder,
  UserAchievement,
  UserNotification,
} from "@/lib/engagement/types";
import { buildWeeklyProgressReport } from "@/lib/engagement/weekly-report";
import { getStreakUnified } from "@/lib/retention/retention-service";
import { getAuthenticatedUserId, hasSupabaseConfig } from "@/lib/supabase/auth";
import {
  createUserNotification,
  createUserStudyReminder,
  deleteUserStudyReminder,
  getUnreadNotificationCount,
  getUserAchievements,
  getUserNotifications,
  getUserStudyReminders,
  markAllNotificationsRead,
  markNotificationRead,
  toggleUserStudyReminder,
  updateUserStudyReminder,
} from "@/lib/supabase/engagement";

export async function getRemindersUnified(): Promise<StudyReminder[]> {
  const local = getLocalReminders();

  if (!hasSupabaseConfig) return local;

  const { userId } = await getAuthenticatedUserId();
  if (!userId) return local;

  const remote = await getUserStudyReminders();
  if (remote.error || !remote.data?.length) return local.length ? local : remote.data ?? [];
  return remote.data;
}

export async function createReminderUnified(
  input: ReminderInput
): Promise<StudyReminder> {
  const local = saveLocalReminder(input);

  if (!hasSupabaseConfig) return local;

  const { userId } = await getAuthenticatedUserId();
  if (!userId) return local;

  const remote = await createUserStudyReminder(input);
  return remote.data ?? local;
}

export async function updateReminderUnified(
  id: string,
  input: Partial<ReminderInput> & { lastShownAt?: string | null }
): Promise<StudyReminder | null> {
  const local = updateLocalReminder(id, input);

  if (!hasSupabaseConfig) return local;

  const { userId } = await getAuthenticatedUserId();
  if (!userId) return local;

  const remote = await updateUserStudyReminder(id, input);
  return remote.data ?? local;
}

export async function deleteReminderUnified(id: string): Promise<boolean> {
  const localDeleted = deleteLocalReminder(id);

  if (!hasSupabaseConfig) return localDeleted;

  const { userId } = await getAuthenticatedUserId();
  if (!userId) return localDeleted;

  const remote = await deleteUserStudyReminder(id);
  return localDeleted || Boolean(remote.data);
}

export async function toggleReminderUnified(
  id: string,
  enabled: boolean
): Promise<StudyReminder | null> {
  return updateReminderUnified(id, { enabled });
}

export async function markReminderShownUnified(id: string): Promise<void> {
  await updateReminderUnified(id, { lastShownAt: new Date().toISOString() });
}

export async function getNotificationsUnified(): Promise<UserNotification[]> {
  const local = getLocalNotifications();

  if (!hasSupabaseConfig) return local;

  const { userId } = await getAuthenticatedUserId();
  if (!userId) return local;

  const remote = await getUserNotifications();
  if (remote.error || !remote.data?.length) return local.length ? local : remote.data ?? [];

  const merged = new Map<string, UserNotification>();
  for (const item of [...(remote.data ?? []), ...local]) {
    merged.set(item.id, item);
  }
  return [...merged.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function addNotificationUnified(
  input: NotificationInput
): Promise<void> {
  addLocalNotification(input);

  if (!hasSupabaseConfig) return;
  const { userId } = await getAuthenticatedUserId();
  if (!userId) return;

  await createUserNotification(input);
}

export async function markNotificationReadUnified(id: string): Promise<void> {
  markLocalNotificationRead(id);

  if (!hasSupabaseConfig) return;
  const { userId } = await getAuthenticatedUserId();
  if (!userId) return;

  await markNotificationRead(id);
}

export async function markAllNotificationsReadUnified(): Promise<void> {
  markAllLocalNotificationsRead();

  if (!hasSupabaseConfig) return;
  const { userId } = await getAuthenticatedUserId();
  if (!userId) return;

  await markAllNotificationsRead();
}

export async function getAchievementsUnified(): Promise<UserAchievement[]> {
  const local = getLocalAchievements();

  if (!hasSupabaseConfig) return local;

  const { userId } = await getAuthenticatedUserId();
  if (!userId) return local;

  const remote = await getUserAchievements();
  if (remote.error || !remote.data?.length) return local.length ? local : remote.data ?? [];

  const merged = new Map<string, UserAchievement>();
  for (const item of [...(remote.data ?? []), ...local]) {
    merged.set(item.achievementKey, item);
  }
  return [...merged.values()].sort(
    (a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime()
  );
}

export async function getUnreadCountUnified(): Promise<number> {
  const localCount = getLocalUnreadNotificationCount();

  if (!hasSupabaseConfig) return localCount;

  const { userId } = await getAuthenticatedUserId();
  if (!userId) return localCount;

  const remoteCount = await getUnreadNotificationCount();
  return Math.max(localCount, remoteCount);
}

export async function getWeeklyReportUnified() {
  const retention = await getStreakUnified();
  const { userId } = await getAuthenticatedUserId();
  const source = userId ? ("account" as const) : ("local" as const);
  return buildWeeklyProgressReport(retention, source);
}

export const STUDY_PLAN_DAYS = [
  { day: "Monday", task: "Watch lesson", href: "/courses/hsk5" },
  { day: "Tuesday", task: "Vocabulary", href: "/review" },
  { day: "Wednesday", task: "Quiz", href: "/courses/hsk5" },
  { day: "Thursday", task: "Review", href: "/review" },
  { day: "Friday", task: "New lesson", href: "/courses/hsk5" },
  { day: "Saturday", task: "Review + quiz retry", href: "/review" },
  { day: "Sunday", task: "Weekly report", href: "/weekly-report" },
];
