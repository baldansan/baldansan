import { getLessonById, getLessonsByCourseId } from "@/lib/content";
import { toAdminContentStatus } from "@/lib/admin/lesson-status";
import type { LessonContent } from "@/types/lesson-content";

export type LessonQaStatus = "complete" | "needs_review";

export type QaFilter = "all" | LessonQaStatus;

export type LessonQaReport = {
  lesson: LessonContent;
  subtitleCount: number;
  vocabularyActual: number;
  quizActual: number;
  hasMetadata: boolean;
  qaStatus: LessonQaStatus;
  warnings: string[];
};

export type LessonQaSummary = {
  totalLessons: number;
  availableCount: number;
  draftCount: number;
  archivedCount: number;
  totalVocabulary: number;
  totalQuizQuestions: number;
  needsReviewCount: number;
  completeCount: number;
};

function hasLessonMetadata(lesson: LessonContent): boolean {
  return Boolean(
    lesson.title?.trim() &&
      lesson.chineseTitle?.trim() &&
      lesson.description?.trim() &&
      lesson.duration?.trim()
  );
}

export function analyzeLessonQa(lesson: LessonContent): LessonQaReport {
  const subtitleCount = lesson.timedSubtitles?.length ?? 0;
  const vocabularyActual = lesson.vocabulary?.length ?? 0;
  const quizActual = lesson.quizQuestions?.length ?? 0;
  const hasMetadata = hasLessonMetadata(lesson);

  const warnings: string[] = [];

  if (!hasMetadata) {
    warnings.push("Metadata incomplete");
  }
  if (subtitleCount === 0) {
    warnings.push("No subtitles");
  }
  if (vocabularyActual === 0) {
    warnings.push("No vocabulary");
  }
  if (quizActual === 0) {
    warnings.push("No quiz questions");
  }
  const vocabMismatch = lesson.vocabularyCount !== vocabularyActual;
  const quizMismatch = lesson.quizCount !== quizActual;
  if (vocabMismatch || quizMismatch) {
    warnings.push("Count mismatch");
  }

  const qaStatus: LessonQaStatus =
    hasMetadata &&
    subtitleCount > 0 &&
    vocabularyActual > 0 &&
    quizActual > 0 &&
    !vocabMismatch &&
    !quizMismatch
      ? "complete"
      : "needs_review";

  return {
    lesson,
    subtitleCount,
    vocabularyActual,
    quizActual,
    hasMetadata,
    qaStatus,
    warnings,
  };
}

export function summarizeLessonQa(reports: LessonQaReport[]): LessonQaSummary {
  let availableCount = 0;
  let draftCount = 0;
  let archivedCount = 0;
  let totalVocabulary = 0;
  let totalQuizQuestions = 0;
  let needsReviewCount = 0;
  let completeCount = 0;

  for (const report of reports) {
    const status = toAdminContentStatus(report.lesson.status);
    if (status === "available") availableCount += 1;
    else if (status === "archived") archivedCount += 1;
    else draftCount += 1;

    totalVocabulary += report.vocabularyActual;
    totalQuizQuestions += report.quizActual;

    if (report.qaStatus === "complete") completeCount += 1;
    else needsReviewCount += 1;
  }

  return {
    totalLessons: reports.length,
    availableCount,
    draftCount,
    archivedCount,
    totalVocabulary,
    totalQuizQuestions,
    needsReviewCount,
    completeCount,
  };
}

export async function getHsk5LessonsWithQa(): Promise<LessonQaReport[]> {
  const summaries = await getLessonsByCourseId("hsk5");
  const reports: LessonQaReport[] = [];

  for (const summary of summaries) {
    const lesson = await getLessonById(summary.id);
    if (lesson) {
      reports.push(analyzeLessonQa(lesson));
    }
  }

  return reports.sort((a, b) => Number(a.lesson.id) - Number(b.lesson.id));
}
