"use client";

/**
 * Badge (цол) — localStorage дээрх өгөгдлөөс тооцоолно, SQL хэрэггүй.
 * Үзүүлсэн badge-ийг `buunduu-badges-seen-v1` түлхүүрт тэмдэглэнэ (дахин гарахгүй).
 */

import { buildProgressSummaryForAchievements } from "@/lib/engagement/achievements";
import { getLocalRetentionSummary } from "@/lib/retention/daily-activity";
import { readLocalStudiedWordIds } from "@/lib/srs/local-word-srs";

export const BADGES_SEEN_KEY = "buunduu-badges-seen-v1";

export type BadgeId =
  | "first_lesson"
  | "streak_7"
  | "words_100"
  | "points_1000"
  | "first_perfect_quiz";

export type BadgeDef = {
  id: BadgeId;
  icon: string;
  titleMn: string;
  descMn: string;
};

export const BADGE_DEFS: Record<BadgeId, BadgeDef> = {
  first_lesson: {
    id: "first_lesson",
    icon: "📘",
    titleMn: "Анхны хичээл",
    descMn: "Анхны хичээлээ бүрэн дуусгалаа. Эхлэл хамгийн хэцүү нь — чи давлаа!",
  },
  streak_7: {
    id: "streak_7",
    icon: "🔥",
    titleMn: "7 хоногийн гал",
    descMn: "7 өдөр дараалан суралцлаа. Тогтмол байдал бол хамгийн том хүч.",
  },
  words_100: {
    id: "words_100",
    icon: "💯",
    titleMn: "100 үг",
    descMn: "100 үг сурлаа. HSK1-ийн талыг аль хэдийн мэдэж байна гэсэн үг.",
  },
  points_1000: {
    id: "points_1000",
    icon: "⭐",
    titleMn: "1000 оноо",
    descMn: "Нийт 1000 оноо цуглууллаа. Рейтингийн самбарт нэрээ хараарай.",
  },
  first_perfect_quiz: {
    id: "first_perfect_quiz",
    icon: "🏆",
    titleMn: "Анхны 100% сорил",
    descMn: "Сорилыг нэг ч алдаагүй давлаа. Тэмээ багш бахархаж байна!",
  },
};

export function readSeenBadges(): Set<BadgeId> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(BADGES_SEEN_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return new Set(Array.isArray(arr) ? (arr.filter((v) => typeof v === "string") as BadgeId[]) : []);
  } catch {
    return new Set();
  }
}

export function markBadgeSeen(id: BadgeId): void {
  if (typeof window === "undefined") return;
  try {
    const seen = readSeenBadges();
    seen.add(id);
    localStorage.setItem(BADGES_SEEN_KEY, JSON.stringify([...seen]));
  } catch {
    // ignore
  }
}

export type BadgeContext = {
  /** Сервер дээрх нийт оноо (нэвтэрсэн бол); байхгүй бол null. */
  totalPoints?: number | null;
  /** Саяхан дууссан сорилын хувь. */
  quizPercent?: number;
  /** Сервер дээрх streak (байвал local-оос давуу). */
  streak?: number | null;
};

/** Шинээр хүртсэн (өмнө нь үзүүлээгүй) badge-уудыг буцаана — дарааллаар. */
export function computeNewBadges(ctx: BadgeContext = {}): BadgeDef[] {
  if (typeof window === "undefined") return [];
  const seen = readSeenBadges();
  const out: BadgeDef[] = [];
  const add = (id: BadgeId) => {
    if (!seen.has(id)) out.push(BADGE_DEFS[id]);
  };

  let progress: ReturnType<typeof buildProgressSummaryForAchievements> | null = null;
  try {
    progress = buildProgressSummaryForAchievements();
  } catch {
    progress = null;
  }

  if (progress && progress.completedLessons >= 1) add("first_lesson");

  let streak = typeof ctx.streak === "number" ? ctx.streak : 0;
  try {
    streak = Math.max(streak, getLocalRetentionSummary().currentStreak);
  } catch {
    // ignore
  }
  if (streak >= 7) add("streak_7");

  let words = progress?.learnedWords ?? 0;
  try {
    words = Math.max(words, readLocalStudiedWordIds().length);
  } catch {
    // ignore
  }
  if (words >= 100) add("words_100");

  if (typeof ctx.totalPoints === "number" && ctx.totalPoints >= 1000) add("points_1000");

  if (ctx.quizPercent === 100 || (progress && progress.bestQuizPercent >= 100)) {
    add("first_perfect_quiz");
  }

  return out;
}
