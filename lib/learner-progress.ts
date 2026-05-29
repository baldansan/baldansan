import { lessonPath } from "@/lib/content";
import {
  countCompletedFromStatusMap,
  getAllQuizResultsSmart,
  getLastActiveLessonId,
  getLessonProgressMapSmart,
  getTotalLearnedWords,
  getAccountLessonProgressSummary,
  getAccountVocabularyLearnedCount,
  type LessonStatus,
  type QuizResultEntry,
} from "@/lib/progress";
import { getAuthenticatedUserId } from "@/lib/supabase/auth";

export type LearnerDashboardStats = {
  completedLessons: number;
  startedLessons: number;
  learnedWords: number;
  quizAttempts: number;
  averageQuizPercent: number | null;
  isLoggedIn: boolean;
};

export type ContinueLearningTarget = {
  lessonId: string;
  href: string;
  label: string;
  reason: "incomplete" | "last_active" | "first";
};

export async function resolveContinueLearning(
  lessonIds: string[]
): Promise<ContinueLearningTarget | null> {
  if (lessonIds.length === 0) return null;

  const sorted = [...lessonIds].sort((a, b) => Number(a) - Number(b));
  const { byLesson } = await getLessonProgressMapSmart(sorted);

  const firstIncomplete = sorted.find((id) => {
    const status: LessonStatus = byLesson[id] ?? "not_started";
    return status !== "completed";
  });

  if (firstIncomplete) {
    const status = byLesson[firstIncomplete] ?? "not_started";
    return {
      lessonId: firstIncomplete,
      href: lessonPath(firstIncomplete),
      label: status === "started" ? "Үргэлжлүүлэх" : "Суралцаж эхлэх",
      reason: "incomplete",
    };
  }

  const lastActive = getLastActiveLessonId();
  if (lastActive && sorted.includes(lastActive)) {
    return {
      lessonId: lastActive,
      href: lessonPath(lastActive),
      label: "Сүүлийн хичээлээ үргэлжлүүлэх",
      reason: "last_active",
    };
  }

  return {
    lessonId: sorted[0],
    href: lessonPath(sorted[0]),
    label: "HSK5 эхлэх",
    reason: "first",
  };
}

export async function getLearnerDashboardStats(
  lessonIds: string[]
): Promise<LearnerDashboardStats> {
  const { userId } = await getAuthenticatedUserId();
  const { byLesson } = await getLessonProgressMapSmart(lessonIds);
  const completedLessons = countCompletedFromStatusMap(lessonIds, byLesson);
  const startedLessons = lessonIds.filter(
    (id) => (byLesson[id] ?? "not_started") === "started"
  ).length;

  let learnedWords = getTotalLearnedWords();
  let quizResults: QuizResultEntry[] = [];

  try {
    quizResults = await getAllQuizResultsSmart();
  } catch {
    quizResults = [];
  }

  if (userId) {
    try {
      const summary = await getAccountLessonProgressSummary(userId);
      const vocabCount = await getAccountVocabularyLearnedCount(userId);
      if (summary) {
        learnedWords = Math.max(learnedWords, vocabCount ?? 0);
      } else if (vocabCount != null) {
        learnedWords = Math.max(learnedWords, vocabCount);
      }
    } catch {
      // fallback to local counts
    }
  }

  const percents = quizResults.map((r) => r.result.percentage);
  const averageQuizPercent =
    percents.length > 0
      ? Math.round(
          percents.reduce((sum, p) => sum + p, 0) / percents.length
        )
      : null;

  return {
    completedLessons,
    startedLessons,
    learnedWords,
    quizAttempts: quizResults.length,
    averageQuizPercent,
    isLoggedIn: Boolean(userId),
  };
}

export function pickLatestQuizAttempt(
  results: QuizResultEntry[]
): QuizResultEntry | null {
  if (results.length === 0) return null;
  return [...results].sort(
    (a, b) =>
      new Date(b.result.updatedAt).getTime() -
      new Date(a.result.updatedAt).getTime()
  )[0];
}
