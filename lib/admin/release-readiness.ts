import {
  MIN_QUIZ_FOR_PUBLISH,
  MIN_VOCABULARY_FOR_PUBLISH,
  type LessonContentQaReport,
} from "@/lib/admin/import-qa";
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
  return Boolean(
    lesson.title?.trim() &&
      lesson.chineseTitle?.trim() &&
      (lesson.subtitle?.trim() || lesson.description?.trim())
  );
}

export function calculateReleaseReadiness(
  lesson: LessonContent,
  options?: { importQa?: LessonContentQaReport | null }
): ReleaseReadiness {
  const issues: string[] = [];
  const warnings: string[] = [];

  const metadataReady = hasMetadata(lesson);
  if (!metadataReady) issues.push("Metadata incomplete (title, Chinese title, summary)");

  const subtitlesReady = lesson.timedSubtitles.length > 0;
  if (!subtitlesReady) issues.push("No subtitles");

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
    isMediaReady(lesson) ||
    lesson.mediaStatus === "ready" ||
    Boolean(lesson.videoUrl?.trim());
  if (!mediaReady) warnings.push("Media not marked ready (video URL or media_status)");

  let qaReady = metadataReady && subtitlesReady && vocabularyReady && quizReady;
  const importQa = options?.importQa;
  if (importQa) {
    qaReady =
      importQa.errors.length === 0 &&
      importQa.status !== "missing_content" &&
      metadataReady &&
      subtitlesReady &&
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

  const readyToApprove =
    metadataReady && subtitlesReady && vocabularyReady && quizReady && qaReady;

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
