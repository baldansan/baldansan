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
        ? "Metadata incomplete (title and target title required)"
        : "Metadata incomplete (title, Chinese title, summary)"
    );
  }

  const hasSubtitles = lesson.timedSubtitles.length > 0;
  const subtitlesReady = prelesson ? true : hasSubtitles;
  if (!prelesson && !hasSubtitles) {
    issues.push("No subtitles");
  } else if (prelesson && !hasSubtitles) {
    warnings.push("PreLesson: no subtitles (optional for publish)");
  }

  const vocabularyReady = lesson.vocabulary.length >= MIN_VOCABULARY_FOR_PUBLISH;
  if (!vocabularyReady) {
    issues.push(
      `Vocabulary below minimum (${lesson.vocabulary.length}/${MIN_VOCABULARY_FOR_PUBLISH})`
    );
  }

  const quizReady = lesson.quizQuestions.length >= MIN_QUIZ_FOR_PUBLISH;
  if (!quizReady) {
    issues.push(
      `Quiz below minimum (${lesson.quizQuestions.length}/${MIN_QUIZ_FOR_PUBLISH})`
    );
  }

  const mediaReady =
    mediaOptional ||
    isMediaReady(lesson) ||
    lesson.mediaStatus === "ready" ||
    Boolean(lesson.videoUrl?.trim());
  if (!mediaReady && !mediaOptional) {
    warnings.push("Media not marked ready (video URL or media_status)");
  } else if (mediaOptional && !mediaReady) {
    warnings.push("PreLesson: no video/audio/thumbnail (optional for publish)");
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
    warnings.push("Awaiting admin approval for publish");
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
