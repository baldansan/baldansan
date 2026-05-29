export const ENGAGEMENT_STORAGE_KEY = "buunduu-surtsgaay-engagement";

export const WEEKDAY_KEYS = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
] as const;

export type WeekdayKey = (typeof WEEKDAY_KEYS)[number];

export type NotificationType =
  | "achievement"
  | "reminder"
  | "progress"
  | "system";

export type StudyReminder = {
  id: string;
  reminderType: string;
  title: string;
  reminderTime: string | null;
  daysOfWeek: WeekdayKey[];
  enabled: boolean;
  lastShownAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type UserNotification = {
  id: string;
  notificationType: NotificationType;
  title: string;
  message?: string | null;
  actionHref?: string | null;
  readAt?: string | null;
  createdAt: string;
};

export type UserAchievement = {
  id: string;
  achievementKey: string;
  title: string;
  description: string;
  earnedAt: string;
  metadata?: Record<string, unknown>;
};

export type EngagementStore = {
  version: 1;
  reminders: StudyReminder[];
  notifications: UserNotification[];
  achievements: UserAchievement[];
};

export type ReminderInput = {
  reminderType?: string;
  title: string;
  reminderTime?: string | null;
  daysOfWeek?: WeekdayKey[];
  enabled?: boolean;
};

export type NotificationInput = {
  notificationType: NotificationType;
  title: string;
  message?: string;
  actionHref?: string;
};

export type WeeklyProgressReport = {
  weekStart: string;
  weekEnd: string;
  lessonsCompleted: number;
  wordsLearned: number;
  quizAttempts: number;
  averageQuizScore: number | null;
  activeDays: number;
  currentStreak: number;
  achievementsEarned: string[];
  recommendation: string;
  source: "local" | "account" | "merged";
};

export const DEFAULT_REMINDER: ReminderInput = {
  reminderType: "daily_study",
  title: "Өнөөдрийн Хятад хэлээ сурах цаг",
  reminderTime: "20:00",
  daysOfWeek: [...WEEKDAY_KEYS],
  enabled: true,
};
