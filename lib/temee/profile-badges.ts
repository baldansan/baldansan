import type { ActiveHskLevel } from "@/lib/hsk/active-hsk-level";

export type ProfileBadgeDef = {
  id: string;
  emoji: string;
  label: string;
  bgOn?: string;
  isEarned: (ctx: ProfileBadgeContext) => boolean;
};

export type ProfileBadgeContext = {
  streak: number;
  studiedCount: number;
  completedLessons: number;
  startedLessons: number;
  accuracyPct: number;
  activeLevel: ActiveHskLevel;
  earnedAchievementKeys: Set<string>;
};

export const PROFILE_BADGE_DEFS: ProfileBadgeDef[] = [
  {
    id: "streak_7",
    emoji: "🔥",
    label: "7 хоног",
    bgOn: "#fff6df",
    isEarned: (ctx) =>
      ctx.streak >= 7 || ctx.earnedAchievementKeys.has("seven_day_streak"),
  },
  {
    id: "words_100",
    emoji: "💯",
    label: "100 үг",
    bgOn: "#e3f7eb",
    isEarned: (ctx) => ctx.studiedCount >= 100,
  },
  {
    id: "first_lesson",
    emoji: "🎓",
    label: "1-р хичээл",
    bgOn: "#e4f0ff",
    isEarned: (ctx) =>
      ctx.completedLessons >= 1 ||
      ctx.startedLessons >= 1 ||
      ctx.earnedAchievementKeys.has("first_lesson_started") ||
      ctx.earnedAchievementKeys.has("lesson_completed"),
  },
  {
    id: "hsk5",
    emoji: "🏅",
    label: "HSK 5",
    isEarned: (ctx) =>
      typeof ctx.activeLevel === "number" &&
      ctx.activeLevel >= 5 &&
      ctx.studiedCount >= 50,
  },
  {
    id: "words_500",
    emoji: "⭐",
    label: "500 үг",
    isEarned: (ctx) => ctx.studiedCount >= 500,
  },
  {
    id: "streak_30",
    emoji: "🌟",
    label: "30 хоног",
    isEarned: (ctx) => ctx.streak >= 30,
  },
  {
    id: "master",
    emoji: "👑",
    label: "Мастер",
    isEarned: (ctx) => ctx.studiedCount >= 1000 && ctx.completedLessons >= 10,
  },
  {
    id: "accuracy_100",
    emoji: "🎯",
    label: "100%",
    isEarned: (ctx) =>
      ctx.accuracyPct >= 100 ||
      ctx.earnedAchievementKeys.has("first_100_score"),
  },
];
