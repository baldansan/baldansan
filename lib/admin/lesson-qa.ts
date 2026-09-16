import { getAdminPublishStatus } from "@/lib/admin/lesson-status";
import {
  hasPublishMetadata,
  isPrelessonPackage,
} from "@/lib/admin/lesson-package-type";
import {
  getLessonMediaWarnings,
  isMediaReady,
  lessonNeedsVideo,
  normalizeMediaStatus,
} from "@/lib/lesson-media";
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
  mediaReadyCount: number;
  mediaMissingCount: number;
};

function hasLessonMetadata(lesson: LessonContent): boolean {
  return hasPublishMetadata(lesson);
}

export function analyzeLessonQaFromCounts(
  lesson: LessonContent,
  counts: {
    subtitleCount: number;
    vocabularyActual: number;
    quizActual: number;
    vocabularyMeta?: number;
    quizMeta?: number;
  }
): LessonQaReport {
  const snapshot: LessonContent = {
    ...lesson,
    vocabularyCount: counts.vocabularyMeta ?? lesson.vocabularyCount,
    quizCount: counts.quizMeta ?? lesson.quizCount,
    timedSubtitles:
      counts.subtitleCount > 0
        ? [
            {
              start: "00:00:00",
              end: "00:00:01",
              chinese: "—",
              pinyin: "",
              mongolian: "—",
            },
          ]
        : [],
    vocabulary:
      counts.vocabularyActual > 0
        ? [
            {
              id: "qa",
              chinese: "—",
              pinyin: "",
              mongolian: "—",
              hskLevel: "HSK5",
              exampleChinese: "",
              exampleMongolian: "",
            },
          ]
        : [],
    quizQuestions:
      counts.quizActual > 0
        ? [
            {
              id: "qa",
              type: "multiple_choice",
              question: "—",
              options: ["—"],
              correctAnswer: "—",
              explanation: "",
            },
          ]
        : [],
  };

  const report = analyzeLessonQa(snapshot);
  return {
    ...report,
    subtitleCount: counts.subtitleCount,
    vocabularyActual: counts.vocabularyActual,
    quizActual: counts.quizActual,
  };
}

export function analyzeLessonQa(lesson: LessonContent): LessonQaReport {
  const prelesson = isPrelessonPackage(lesson);
  // Timed subtitles belong to video lessons. A textbook lesson teaches from the
  // page, so having none is the normal shape, not a gap.
  const subtitlesOptional = prelesson || !lessonNeedsVideo(lesson);
  const subtitleCount = lesson.timedSubtitles?.length ?? 0;
  const vocabularyActual = lesson.vocabulary?.length ?? 0;
  const quizActual = lesson.quizQuestions?.length ?? 0;
  const hasMetadata = hasLessonMetadata(lesson);

  const warnings: string[] = [];

  if (!hasMetadata) {
    warnings.push(
      prelesson
        ? "Мэдээлэл дутуу (гарчиг ба зорилтот гарчиг шаардлагатай)"
        : "Мэдээлэл дутуу"
    );
  }
  if (subtitleCount === 0 && !subtitlesOptional) {
    warnings.push("Хадмал алга");
  }
  if (vocabularyActual === 0) {
    warnings.push("Үгсийн сан алга");
  }
  if (quizActual === 0) {
    warnings.push("Дасгалын асуулт алга");
  }
  const vocabMismatch = lesson.vocabularyCount !== vocabularyActual;
  const quizMismatch = lesson.quizCount !== quizActual;
  if (vocabMismatch || quizMismatch) {
    warnings.push("Тоо зөрүүтэй");
  }

  warnings.push(...getLessonMediaWarnings(lesson));

  const qaStatus: LessonQaStatus =
    hasMetadata &&
    (subtitlesOptional || subtitleCount > 0) &&
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
  let mediaReadyCount = 0;
  let mediaMissingCount = 0;

  for (const report of reports) {
    const status = getAdminPublishStatus(report.lesson);
    if (status === "available") availableCount += 1;
    else if (status === "archived") archivedCount += 1;
    else draftCount += 1;

    totalVocabulary += report.vocabularyActual;
    totalQuizQuestions += report.quizActual;

    if (report.qaStatus === "complete") completeCount += 1;
    else needsReviewCount += 1;

    if (isMediaReady(report.lesson)) {
      mediaReadyCount += 1;
    } else if (
      normalizeMediaStatus(report.lesson.mediaStatus) === "missing" ||
      !report.lesson.videoUrl?.trim()
    ) {
      mediaMissingCount += 1;
    }
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
    mediaReadyCount,
    mediaMissingCount,
  };
}

/** True when this lesson's format means timed subtitles are not expected. */
export function lessonSubtitlesOptional(lesson: LessonContent): boolean {
  return isPrelessonPackage(lesson) || !lessonNeedsVideo(lesson);
}

export function isPublishReady(report: LessonQaReport): boolean {
  return (
    report.hasMetadata &&
    (lessonSubtitlesOptional(report.lesson) || report.subtitleCount > 0) &&
    report.vocabularyActual > 0 &&
    report.quizActual > 0
  );
}
