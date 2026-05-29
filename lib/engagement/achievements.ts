import type { LearningRetentionSummary } from "@/lib/retention/types";
import {
  getAllLessonProgress,
  getAllQuizResults,
  getTotalLearnedWords,
} from "@/lib/progress";

export type AchievementDefinition = {
  key: string;
  title: string;
  description: string;
};

export const ACHIEVEMENTS: Record<string, AchievementDefinition> = {
  first_lesson_started: {
    key: "first_lesson_started",
    title: "Эхний алхам",
    description: "Анхны хичээлээ эхлүүллээ.",
  },
  first_quiz_completed: {
    key: "first_quiz_completed",
    title: "Анхны quiz",
    description: "Анхны quiz-ээ дуусгалаа.",
  },
  first_100_score: {
    key: "first_100_score",
    title: "100 оноо",
    description: "Quiz дээр 100% авлаа.",
  },
  five_words_learned: {
    key: "five_words_learned",
    title: "5 үг сурлаа",
    description: "5 vocabulary learned болголоо.",
  },
  seven_day_streak: {
    key: "seven_day_streak",
    title: "7 өдрийн streak",
    description: "7 өдөр дараалан суралцлаа.",
  },
  lesson_completed: {
    key: "lesson_completed",
    title: "Хичээл дуусгалаа",
    description: "Нэг хичээлийн flow-г дуусгалаа.",
  },
  review_started: {
    key: "review_started",
    title: "Давталт эхэллээ",
    description: "Review хэсгээ ашиглаж эхэллээ.",
  },
};

export type ProgressSummaryForAchievements = {
  startedLessons: number;
  completedLessons: number;
  learnedWords: number;
  quizAttempts: number;
  bestQuizPercent: number;
  latestQuizPercent: number | null;
};

export function buildProgressSummaryForAchievements(): ProgressSummaryForAchievements {
  if (typeof window === "undefined") {
    return {
      startedLessons: 0,
      completedLessons: 0,
      learnedWords: 0,
      quizAttempts: 0,
      bestQuizPercent: 0,
      latestQuizPercent: null,
    };
  }

  const lessons = Object.values(getAllLessonProgress());
  const quizzes = getAllQuizResults();
  const bestQuizPercent = quizzes.reduce(
    (max, entry) => Math.max(max, entry.result.bestPercentage),
    0
  );
  const latestQuizPercent =
    quizzes.length > 0 ? quizzes[0].result.percentage : null;

  return {
    startedLessons: lessons.filter((l) => l.status === "started").length,
    completedLessons: lessons.filter((l) => l.status === "completed").length,
    learnedWords: getTotalLearnedWords(),
    quizAttempts: quizzes.length,
    bestQuizPercent,
    latestQuizPercent,
  };
}

export function evaluateAchievementsFromProgress(
  progress: ProgressSummaryForAchievements,
  retention: LearningRetentionSummary | null,
  existingKeys: Set<string>
): AchievementDefinition[] {
  const earned: AchievementDefinition[] = [];

  function tryAdd(key: string) {
    if (existingKeys.has(key)) return;
    const def = ACHIEVEMENTS[key];
    if (def) earned.push(def);
  }

  if (progress.startedLessons + progress.completedLessons >= 1) {
    tryAdd("first_lesson_started");
  }
  if (progress.quizAttempts >= 1) {
    tryAdd("first_quiz_completed");
  }
  if (progress.bestQuizPercent >= 100 || progress.latestQuizPercent === 100) {
    tryAdd("first_100_score");
  }
  if (progress.learnedWords >= 5) {
    tryAdd("five_words_learned");
  }
  if (progress.completedLessons >= 1) {
    tryAdd("lesson_completed");
  }
  if (retention && retention.currentStreak >= 7) {
    tryAdd("seven_day_streak");
  }

  return earned;
}

export function evaluateAchievementForActivity(
  activityType: string,
  existingKeys: Set<string>
): AchievementDefinition | null {
  const map: Record<string, string> = {
    review_opened: "review_started",
  };
  const key = map[activityType];
  if (!key || existingKeys.has(key)) return null;
  return ACHIEVEMENTS[key] ?? null;
}
