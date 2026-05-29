import {
  ENGAGEMENT_STORAGE_KEY,
  WEEKDAY_KEYS,
  type EngagementStore,
  type NotificationInput,
  type ReminderInput,
  type StudyReminder,
  type UserAchievement,
  type UserNotification,
  type WeekdayKey,
} from "@/lib/engagement/types";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function defaultStore(): EngagementStore {
  return { version: 1, reminders: [], notifications: [], achievements: [] };
}

function readStore(): EngagementStore {
  if (!isBrowser()) return defaultStore();
  try {
    const raw = window.localStorage.getItem(ENGAGEMENT_STORAGE_KEY);
    if (!raw) return defaultStore();
    const parsed = JSON.parse(raw) as Partial<EngagementStore>;
    return {
      version: 1,
      reminders: parsed.reminders ?? [],
      notifications: parsed.notifications ?? [],
      achievements: parsed.achievements ?? [],
    };
  } catch {
    return defaultStore();
  }
}

function writeStore(store: EngagementStore): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(ENGAGEMENT_STORAGE_KEY, JSON.stringify(store));
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getLocalReminders(): StudyReminder[] {
  return readStore().reminders;
}

export function saveLocalReminder(input: ReminderInput): StudyReminder {
  const store = readStore();
  const reminder: StudyReminder = {
    id: newId("rem"),
    reminderType: input.reminderType ?? "daily_study",
    title: input.title,
    reminderTime: input.reminderTime ?? "20:00",
    daysOfWeek: input.daysOfWeek ?? [...WEEKDAY_KEYS],
    enabled: input.enabled ?? true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.reminders.push(reminder);
  writeStore(store);
  return reminder;
}

export function updateLocalReminder(
  id: string,
  input: Partial<ReminderInput> & { lastShownAt?: string | null }
): StudyReminder | null {
  const store = readStore();
  const index = store.reminders.findIndex((item) => item.id === id);
  if (index < 0) return null;

  const current = store.reminders[index];
  const updated: StudyReminder = {
    ...current,
    ...input,
    daysOfWeek: input.daysOfWeek ?? current.daysOfWeek,
    updatedAt: new Date().toISOString(),
  };
  store.reminders[index] = updated;
  writeStore(store);
  return updated;
}

export function deleteLocalReminder(id: string): boolean {
  const store = readStore();
  const next = store.reminders.filter((item) => item.id !== id);
  if (next.length === store.reminders.length) return false;
  writeStore({ ...store, reminders: next });
  return true;
}

export function getLocalNotifications(): UserNotification[] {
  return [...readStore().notifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function addLocalNotification(input: NotificationInput): UserNotification {
  const store = readStore();
  const notification: UserNotification = {
    id: newId("notif"),
    notificationType: input.notificationType,
    title: input.title,
    message: input.message ?? null,
    actionHref: input.actionHref ?? null,
    readAt: null,
    createdAt: new Date().toISOString(),
  };
  store.notifications.unshift(notification);
  if (store.notifications.length > 100) {
    store.notifications = store.notifications.slice(0, 100);
  }
  writeStore(store);
  return notification;
}

export function markLocalNotificationRead(id: string): void {
  const store = readStore();
  store.notifications = store.notifications.map((item) =>
    item.id === id ? { ...item, readAt: new Date().toISOString() } : item
  );
  writeStore(store);
}

export function markAllLocalNotificationsRead(): void {
  const store = readStore();
  const now = new Date().toISOString();
  store.notifications = store.notifications.map((item) =>
    item.readAt ? item : { ...item, readAt: now }
  );
  writeStore(store);
}

export function getLocalAchievements(): UserAchievement[] {
  return [...readStore().achievements].sort(
    (a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime()
  );
}

export function hasLocalAchievement(key: string): boolean {
  return readStore().achievements.some((item) => item.achievementKey === key);
}

export function addLocalAchievement(achievement: Omit<UserAchievement, "id">): UserAchievement {
  const store = readStore();
  if (store.achievements.some((item) => item.achievementKey === achievement.achievementKey)) {
    return store.achievements.find(
      (item) => item.achievementKey === achievement.achievementKey
    )!;
  }

  const row: UserAchievement = {
    id: newId("ach"),
    ...achievement,
  };
  store.achievements.push(row);
  writeStore(store);
  return row;
}

export function getLocalUnreadNotificationCount(): number {
  return readStore().notifications.filter((item) => !item.readAt).length;
}

export function hasLocalEngagementData(): boolean {
  const store = readStore();
  return (
    store.reminders.length > 0 ||
    store.notifications.length > 0 ||
    store.achievements.length > 0
  );
}

export function weekdayKeyFromDate(date = new Date()): WeekdayKey {
  const map: WeekdayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return map[date.getDay()];
}

export function isReminderDueNow(reminder: StudyReminder, now = new Date()): boolean {
  if (!reminder.enabled) return false;
  const day = weekdayKeyFromDate(now);
  if (!reminder.daysOfWeek.includes(day)) return false;
  if (!reminder.reminderTime) return false;

  const [hour, minute] = reminder.reminderTime.split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return false;

  const shownToday =
    reminder.lastShownAt &&
    reminder.lastShownAt.slice(0, 10) === now.toISOString().slice(0, 10);
  if (shownToday) return false;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const targetMinutes = hour * 60 + minute;
  return currentMinutes >= targetMinutes && currentMinutes < targetMinutes + 60;
}
