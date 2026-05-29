import { toLocalDateKey } from "@/lib/retention/streak-utils";
import {
  getAllLessonProgress,
  getAllQuizResults,
  getTotalLearnedWords,
} from "@/lib/progress";
import { getLocalAchievements } from "@/lib/engagement/local-engagement";
import type { WeeklyProgressReport } from "@/lib/engagement/types";
import type { LearningRetentionSummary } from "@/lib/retention/types";

export function getCurrentWeekRange(reference = new Date()) {
  const day = reference.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(reference);
  monday.setDate(reference.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    weekStart: toLocalDateKey(monday),
    weekEnd: toLocalDateKey(sunday),
  };
}

function inWeek(iso: string, weekStart: string, weekEnd: string): boolean {
  const key = toLocalDateKey(iso);
  return key >= weekStart && key <= weekEnd;
}

export function summarizeWeeklyActivity(
  retention: LearningRetentionSummary | null
): number {
  if (!retention) return 0;
  return retention.activeDaysThisWeek;
}

export function buildWeeklyProgressReport(
  retention: LearningRetentionSummary | null,
  source: WeeklyProgressReport["source"] = "local"
): WeeklyProgressReport {
  const { weekStart, weekEnd } = getCurrentWeekRange();

  let lessonsCompleted = 0;
  let quizAttempts = 0;
  let wordsLearned = getTotalLearnedWords();
  const percents: number[] = [];

  for (const [, progress] of Object.entries(getAllLessonProgress())) {
    if (
      progress.completedAt &&
      inWeek(progress.completedAt, weekStart, weekEnd)
    ) {
      lessonsCompleted += 1;
    }
  }

  for (const { result } of getAllQuizResults()) {
    if (inWeek(result.updatedAt, weekStart, weekEnd)) {
      quizAttempts += 1;
      percents.push(result.percentage);
    }
  }

  const achievementsEarned = getLocalAchievements()
    .filter((item) => inWeek(item.earnedAt, weekStart, weekEnd))
    .map((item) => item.title);

  const averageQuizScore =
    percents.length > 0
      ? Math.round(percents.reduce((sum, p) => sum + p, 0) / percents.length)
      : null;

  const activeDays = summarizeWeeklyActivity(retention);
  const currentStreak = retention?.currentStreak ?? 0;

  const recommendation =
    lessonsCompleted < 3
      ? "Next week: 3 хичээл, 20 үг, 3 quiz оролд."
      : wordsLearned < 20
        ? "Next week: vocabulary давтаж, 20 үг сурах зорилго тав."
        : "Next week: quiz дахин өгч, streak-ээ үргэлжлүүл.";

  return {
    weekStart,
    weekEnd,
    lessonsCompleted,
    wordsLearned,
    quizAttempts,
    averageQuizScore,
    activeDays,
    currentStreak,
    achievementsEarned,
    recommendation,
    source,
  };
}

export function buildWeeklyReportMarkdown(report: WeeklyProgressReport): string {
  return `# Weekly progress report

**Week:** ${report.weekStart} → ${report.weekEnd}

- Completed lessons: ${report.lessonsCompleted}
- Words learned (device): ${report.wordsLearned}
- Quiz attempts: ${report.quizAttempts}
- Average quiz score: ${report.averageQuizScore ?? "—"}%
- Active days: ${report.activeDays}
- Current streak: ${report.currentStreak} days
- Achievements this week: ${report.achievementsEarned.length ? report.achievementsEarned.join(", ") : "—"}

## Recommendation
${report.recommendation}
`;
}
