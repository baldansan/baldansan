/**
 * Оноо өгөх дүрмүүд (071_points_rank.sql-тэй ТОХИРНО).
 * Серверийн дээд хязгаар нь миграц дотор бий — энэ файл нь клиентийн
 * тооцоо, шошго, дүрс.
 */

export type PointsSource =
  | "lesson_complete"
  | "quiz_correct"
  | "video_minutes"
  | "srs_review"
  | "game"
  | "exam"
  | "assignment"
  | "writing"
  | "streak_bonus";

export const POINT_VALUES = {
  lessonComplete: 50,
  quizCorrectFirst: 5,
  quizCorrectRepeat: 1,
  videoPerMinute: 2,
  videoMaxPerDayPerVideo: 30,
  srsPerCard: 1,
  srsMaxPerDay: 50,
  gameBase: 10,
  gameAccuracyBonusMax: 20,
  examPass: 100,
  examMax: 200,
  assignmentOnTime: 30,
  assignmentLate: 10,
  writingChar: 2,
  streakDay: 10,
} as const;

export const SOURCE_META: Record<
  PointsSource,
  { label: string; icon: string; hint: string }
> = {
  lesson_complete: { label: "Хичээл дуусгасан", icon: "📘", hint: "Хичээл бүр 50 оноо" },
  quiz_correct: { label: "Асуултад зөв хариулсан", icon: "✅", hint: "Эхний оролдлого 5, давтвал 1" },
  video_minutes: { label: "Видео үзсэн", icon: "🎬", hint: "Минут бүр 2 оноо" },
  srs_review: { label: "Үг давтсан", icon: "🔤", hint: "Карт бүр 1 оноо, өдөрт 50 хүртэл" },
  game: { label: "Тоглоом", icon: "🎮", hint: "10 оноо + нарийвчлалын бонус" },
  exam: { label: "Шалгалт", icon: "📝", hint: "100 оноо + үр дүнгийн хувь" },
  assignment: { label: "Даалгавар", icon: "📌", hint: "Хугацаандаа бол 30 оноо" },
  writing: { label: "Бичсэн иероглиф", icon: "✍️", hint: "Иероглиф бүр 2 оноо" },
  streak_bonus: { label: "Өдөр тутмын бонус", icon: "🔥", hint: "Өдөр бүр 10 оноо" },
};

export const ALL_SOURCES = Object.keys(SOURCE_META) as PointsSource[];

export function sourceLabel(source: string): string {
  return SOURCE_META[source as PointsSource]?.label ?? source;
}
export function sourceIcon(source: string): string {
  return SOURCE_META[source as PointsSource]?.icon ?? "⭐";
}

/** 5 ур чадвар (Оюу оноо) — эх сурвалжуудыг бүлэглэнэ. */
export const SKILL_GROUPS: {
  key: string;
  label: string;
  icon: string;
  sources: PointsSource[];
}[] = [
  { key: "understand", label: "Ойлгох", icon: "📖", sources: ["quiz_correct", "lesson_complete", "exam"] },
  { key: "write", label: "Бичих", icon: "✍️", sources: ["writing"] },
  { key: "vocab", label: "Үгийн сан", icon: "🔤", sources: ["srs_review", "game"] },
  { key: "listen", label: "Сонсох", icon: "👂", sources: ["video_minutes"] },
  { key: "habit", label: "Хэвшил", icon: "🔥", sources: ["streak_bonus", "assignment"] },
];

export type PointsPeriod = "7d" | "30d" | "all";

export const PERIOD_LABELS: Record<PointsPeriod, string> = {
  "7d": "7 хоног",
  "30d": "30 хоног",
  all: "Бүх",
};

/** Тоглоомын оноо: 10 + нарийвчлал(0–100)% × 0.2 (дээд 30). */
export function gamePoints(accuracyPct: number): number {
  const a = Math.max(0, Math.min(100, Number(accuracyPct) || 0));
  return POINT_VALUES.gameBase + Math.round((a / 100) * POINT_VALUES.gameAccuracyBonusMax);
}

/** Шалгалт: тэнцсэн бол 100 + оноо% (дээд 200), тэнцээгүй бол оноо% (дээд 99). */
export function examPoints(percent: number, passed: boolean): number {
  const pct = Math.max(0, Math.min(100, Math.round(Number(percent) || 0)));
  return passed
    ? Math.min(POINT_VALUES.examMax, POINT_VALUES.examPass + pct)
    : Math.min(POINT_VALUES.examPass - 1, pct);
}
