import {
  MIN_QUIZ_FOR_PUBLISH,
  MIN_VOCABULARY_FOR_PUBLISH,
  type LessonContentQaReport,
} from "@/lib/admin/import-qa";
import {
  hasPublishMetadata,
  isMediaOptionalForPublish,
  isPrelessonPackage,
} from "@/lib/admin/lesson-package-type";
import { isMediaReady } from "@/lib/lesson-media";
import type { LessonContent } from "@/types/lesson-content";

export type ReleaseReadiness = {
  metadataReady: boolean;
  subtitlesReady: boolean;
  vocabularyReady: boolean;
  quizReady: boolean;
  mediaReady: boolean;
  qaReady: boolean;
  backupRecommended: boolean;
  previewRecommended: boolean;
  approvalReady: boolean;
  readyToApprove: boolean;
  readyToPublish: boolean;
  issues: string[];
  warnings: string[];
};

function hasMetadata(lesson: LessonContent): boolean {
  return hasPublishMetadata(lesson);
}

export function calculateReleaseReadiness(
  lesson: LessonContent,
  options?: { importQa?: LessonContentQaReport | null }
): ReleaseReadiness {
  const issues: string[] = [];
  const warnings: string[] = [];
  const prelesson = isPrelessonPackage(lesson);
  const mediaOptional = isMediaOptionalForPublish(lesson);

  const metadataReady = hasMetadata(lesson);
  if (!metadataReady) {
    issues.push(
      prelesson
        ? "Ерөнхий мэдээлэл дутуу (гарчиг, гадаад хэл дээрх гарчиг заавал)"
        : "Ерөнхий мэдээлэл дутуу (гарчиг, хятад гарчиг, тайлбар)"
    );
  }

  const hasSubtitles = lesson.timedSubtitles.length > 0;
  const subtitlesReady = prelesson ? true : hasSubtitles;
  if (!prelesson && !hasSubtitles) {
    issues.push("Хадмал алга");
  } else if (prelesson && !hasSubtitles) {
    warnings.push("Бэлтгэл хичээл: хадмал алга (нийтлэхэд заавал биш)");
  }

  const vocabularyReady = lesson.vocabulary.length >= MIN_VOCABULARY_FOR_PUBLISH;
  if (!vocabularyReady) {
    issues.push(
      `Үгсийн сан хүрэлцэхгүй (${lesson.vocabulary.length}/${MIN_VOCABULARY_FOR_PUBLISH})`
    );
  }

  const quizReady = lesson.quizQuestions.length >= MIN_QUIZ_FOR_PUBLISH;
  if (!quizReady) {
    issues.push(
      `Дасгал хүрэлцэхгүй (${lesson.quizQuestions.length}/${MIN_QUIZ_FOR_PUBLISH})`
    );
  }

  const mediaReady =
    mediaOptional ||
    isMediaReady(lesson) ||
    lesson.mediaStatus === "ready" ||
    Boolean(lesson.videoUrl?.trim());
  if (!mediaReady && !mediaOptional) {
    warnings.push("Медиа бэлэн гэж тэмдэглэгдээгүй (бичлэгийн URL эсвэл media_status)");
  } else if (mediaOptional && !mediaReady) {
    warnings.push(
      "Бэлтгэл хичээл: бичлэг/аудио/нүүр зураг алга (нийтлэхэд заавал биш)"
    );
  }

  let qaReady = prelesson
    ? metadataReady && vocabularyReady && quizReady
    : metadataReady && subtitlesReady && vocabularyReady && quizReady;
  const importQa = options?.importQa;
  if (importQa) {
    qaReady =
      importQa.errors.length === 0 &&
      importQa.status !== "missing_content" &&
      metadataReady &&
      (prelesson || subtitlesReady) &&
      vocabularyReady &&
      quizReady;
    if (importQa.errors.length > 0) {
      issues.push(...importQa.errors.slice(0, 3));
    }
    if (importQa.warnings.length > 0) {
      warnings.push(...importQa.warnings.slice(0, 3));
    }
  }

  const releaseStatus = lesson.releaseStatus ?? "draft";
  const workflowQa = lesson.qaStatus ?? "needs_review";
  const approvalReady =
    releaseStatus === "approved" || Boolean(lesson.approvedAt);

  const readyToApprove = prelesson
    ? metadataReady && vocabularyReady && quizReady
    : metadataReady && subtitlesReady && vocabularyReady && quizReady && qaReady;

  const readyToPublish =
    readyToApprove &&
    (releaseStatus === "approved" || workflowQa === "passed");

  if (readyToApprove && !approvalReady) {
    warnings.push("Нийтлэхийн тулд админы баталгаа хүлээж байна");
  }

  const backupRecommended = readyToApprove;
  const previewRecommended = readyToApprove;

  return {
    metadataReady,
    subtitlesReady,
    vocabularyReady,
    quizReady,
    mediaReady,
    qaReady,
    backupRecommended,
    previewRecommended,
    approvalReady,
    readyToApprove,
    readyToPublish,
    issues,
    warnings,
  };
}
