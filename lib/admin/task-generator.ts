import {
  MIN_QUIZ_FOR_PUBLISH,
  MIN_VOCABULARY_FOR_PUBLISH,
} from "@/lib/admin/import-qa";
import { getAdminPublishStatus } from "@/lib/admin/lesson-status";
import type { LessonQaReport } from "@/lib/admin/lesson-qa";
import { calculateReleaseReadiness } from "@/lib/admin/release-readiness";
import {
  hasThumbnailUrl,
  hasVideoUrl,
  normalizeMediaStatus,
} from "@/lib/lesson-media";
import type {
  LessonAnalyticsMetrics,
  QuestionAnalyticsRow,
  VocabularyEngagementRow,
} from "@/lib/supabase/admin-analytics";
import type { LessonContent } from "@/types/lesson-content";

export type AdminTaskCategory =
  | "content"
  | "qa"
  | "media"
  | "release"
  | "analytics"
  | "backup"
  | "system";

export type AdminTaskSeverity = "critical" | "warning" | "info" | "success";

export type AdminTask = {
  id: string;
  category: AdminTaskCategory;
  severity: AdminTaskSeverity;
  title: string;
  description: string;
  lessonId?: string;
  lessonTitle?: string;
  actionLabel?: string;
  actionHref?: string;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
  createdFrom: string;
};

export type AdminTaskGeneratorInput = {
  reports: LessonQaReport[];
  lessonAnalytics: LessonAnalyticsMetrics[];
  difficultQuestions: QuestionAnalyticsRow[];
  vocabularyEngagement: VocabularyEngagementRow[];
  warnings?: string[];
  limitedByRls?: boolean;
  supabaseConfigured?: boolean;
};

export type AdminTaskSummary = {
  totalTasks: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  successCount: number;
  readyToPublishCount: number;
  needsContentCount: number;
  mediaIssuesCount: number;
};

const SEVERITY_RANK: Record<AdminTaskSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
  success: 3,
};

const LOW_COMPLETION_THRESHOLD = 40;
const LOW_QUIZ_SCORE_THRESHOLD = 70;

function editHref(lessonId: string): string {
  return `/admin/lessons/${lessonId}/edit`;
}

function analyticsHref(lessonId: string): string {
  return `/admin/analytics/lessons/${lessonId}`;
}

function taskId(
  category: AdminTaskCategory,
  slug: string,
  lessonId?: string
): string {
  return [category, lessonId ?? "global", slug].join(":");
}

function pushTask(tasks: AdminTask[], task: AdminTask): void {
  if (!tasks.some((existing) => existing.id === task.id)) {
    tasks.push(task);
  }
}

function hasEnoughContent(report: LessonQaReport): boolean {
  return (
    report.subtitleCount > 0 &&
    report.vocabularyActual >= MIN_VOCABULARY_FOR_PUBLISH &&
    report.quizActual >= MIN_QUIZ_FOR_PUBLISH
  );
}

function generateContentTasks(
  tasks: AdminTask[],
  report: LessonQaReport
): void {
  const { lesson } = report;
  const lessonId = lesson.id;
  const title = lesson.title;
  const publishStatus = getAdminPublishStatus(lesson);

  if (report.subtitleCount === 0) {
    pushTask(tasks, {
      id: taskId("content", "no-subtitles", lessonId),
      category: "content",
      severity: "critical",
      title: `Lesson ${lessonId} has no subtitles`,
      description: `${title} — subtitle мөр байхгүй. Bulk import эсвэл editor ашиглана.`,
      lessonId,
      lessonTitle: title,
      actionLabel: "Edit lesson",
      actionHref: editHref(lessonId),
      createdFrom: "content.subtitleCount",
    });
  }

  if (report.vocabularyActual === 0) {
    pushTask(tasks, {
      id: taskId("content", "no-vocabulary", lessonId),
      category: "content",
      severity: "critical",
      title: `Lesson ${lessonId} has no vocabulary`,
      description: `${title} — vocabulary хоосон.`,
      lessonId,
      lessonTitle: title,
      actionLabel: "Edit lesson",
      actionHref: editHref(lessonId),
      createdFrom: "content.vocabularyCount",
    });
  } else if (report.vocabularyActual < MIN_VOCABULARY_FOR_PUBLISH) {
    pushTask(tasks, {
      id: taskId("content", "low-vocabulary", lessonId),
      category: "content",
      severity: "warning",
      title: `Lesson ${lessonId} vocabulary below minimum`,
      description: `${report.vocabularyActual}/${MIN_VOCABULARY_FOR_PUBLISH} үг — publish-д хүрэлцэхгүй.`,
      lessonId,
      lessonTitle: title,
      actionLabel: "Edit vocabulary",
      actionHref: editHref(lessonId),
      createdFrom: "content.vocabularyMinimum",
    });
  }

  if (report.quizActual === 0) {
    pushTask(tasks, {
      id: taskId("content", "no-quiz", lessonId),
      category: "content",
      severity: "critical",
      title: `Lesson ${lessonId} has no quiz questions`,
      description: `${title} — quiz асуулт байхгүй.`,
      lessonId,
      lessonTitle: title,
      actionLabel: "Edit lesson",
      actionHref: editHref(lessonId),
      createdFrom: "content.quizCount",
    });
  } else if (report.quizActual < MIN_QUIZ_FOR_PUBLISH) {
    pushTask(tasks, {
      id: taskId("content", "low-quiz", lessonId),
      category: "content",
      severity: "warning",
      title: `Lesson ${lessonId} quiz below minimum`,
      description: `${report.quizActual}/${MIN_QUIZ_FOR_PUBLISH} асуулт — publish-д хүрэлцэхгүй.`,
      lessonId,
      lessonTitle: title,
      actionLabel: "Edit quiz",
      actionHref: editHref(lessonId),
      createdFrom: "content.quizMinimum",
    });
  }

  if (
    publishStatus === "draft" &&
    (report.subtitleCount === 0 ||
      report.vocabularyActual === 0 ||
      report.quizActual === 0)
  ) {
    pushTask(tasks, {
      id: taskId("content", "draft-needs-content", lessonId),
      category: "content",
      severity: "warning",
      title: `Draft lesson ${lessonId} needs content`,
      description: `${title} — ноорог хичээл, контент дутуу.`,
      lessonId,
      lessonTitle: title,
      actionLabel: "Open Lesson Builder",
      actionHref: "/admin/lesson-builder",
      secondaryActionLabel: "Edit lesson",
      secondaryActionHref: editHref(lessonId),
      createdFrom: "content.draftIncomplete",
    });
  }
}

function generateQaTasks(tasks: AdminTask[], lesson: LessonContent): void {
  const lessonId = lesson.id;
  const title = lesson.title;
  const workflowQa = lesson.qaStatus ?? "needs_review";
  const releaseStatus = lesson.releaseStatus ?? "draft";

  if (workflowQa === "failed") {
    pushTask(tasks, {
      id: taskId("qa", "failed", lessonId),
      category: "qa",
      severity: "critical",
      title: `Lesson ${lessonId} QA failed`,
      description: `${title} — workflow QA failed. Засвар хийж дахин шалгана.`,
      lessonId,
      lessonTitle: title,
      actionLabel: "Review QA",
      actionHref: `${editHref(lessonId)}#release-readiness`,
      createdFrom: "qa.workflowFailed",
    });
  }

  if (releaseStatus === "in_review") {
    pushTask(tasks, {
      id: taskId("qa", "in-review", lessonId),
      category: "qa",
      severity: "info",
      title: `Lesson ${lessonId} in review`,
      description: `${title} — release workflow in_review төлөвт байна.`,
      lessonId,
      lessonTitle: title,
      actionLabel: "Approval controls",
      actionHref: `${editHref(lessonId)}#release-readiness`,
      createdFrom: "qa.inReview",
    });
  }
}

function generateQaReviewTask(
  tasks: AdminTask[],
  report: LessonQaReport
): void {
  const { lesson } = report;
  const workflowQa = lesson.qaStatus ?? "needs_review";

  if (workflowQa !== "needs_review" || !hasEnoughContent(report)) {
    return;
  }

  pushTask(tasks, {
    id: taskId("qa", "needs-review", lesson.id),
    category: "qa",
    severity: "warning",
    title: `Lesson ${lesson.id} needs QA review`,
    description: `${lesson.title} — контент хангалттай, workflow QA шалгалт хүлээж байна.`,
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    actionLabel: "Review & approve",
    actionHref: `${editHref(lesson.id)}#release-readiness`,
    createdFrom: "qa.needsReviewWithContent",
  });
}

function generateMediaTasks(tasks: AdminTask[], report: LessonQaReport): void {
  const { lesson } = report;
  const lessonId = lesson.id;
  const title = lesson.title;
  const mediaStatus = normalizeMediaStatus(lesson.mediaStatus);
  const publishStatus = getAdminPublishStatus(lesson);

  if (mediaStatus === "missing") {
    pushTask(tasks, {
      id: taskId("media", "missing", lessonId),
      category: "media",
      severity: "warning",
      title: `Lesson ${lessonId} media missing`,
      description: `${title} — media_status missing.`,
      lessonId,
      lessonTitle: title,
      actionLabel: "Upload media",
      actionHref: editHref(lessonId),
      createdFrom: "media.statusMissing",
    });
  } else if (mediaStatus === "pending") {
    pushTask(tasks, {
      id: taskId("media", "pending", lessonId),
      category: "media",
      severity: "info",
      title: `Lesson ${lessonId} media pending`,
      description: `${title} — media upload эхэлсэн, video URL нэмнэ.`,
      lessonId,
      lessonTitle: title,
      actionLabel: "Upload media",
      actionHref: editHref(lessonId),
      createdFrom: "media.statusPending",
    });
  }

  if (publishStatus === "available" && !hasVideoUrl(lesson)) {
    pushTask(tasks, {
      id: taskId("media", "available-no-video", lessonId),
      category: "media",
      severity: "warning",
      title: `Lesson ${lessonId} published without video`,
      description: `${title} — нийтлэгдсэн боловч video URL байхгүй.`,
      lessonId,
      lessonTitle: title,
      actionLabel: "Add video",
      actionHref: editHref(lessonId),
      createdFrom: "media.availableNoVideo",
    });
  }

  if (!hasThumbnailUrl(lesson) && hasEnoughContent(report)) {
    pushTask(tasks, {
      id: taskId("media", "no-thumbnail", lessonId),
      category: "media",
      severity: "info",
      title: `Lesson ${lessonId} thumbnail missing`,
      description: `${title} — thumbnail URL нэмэхийг зөвлөж байна.`,
      lessonId,
      lessonTitle: title,
      actionLabel: "Upload thumbnail",
      actionHref: editHref(lessonId),
      createdFrom: "media.noThumbnail",
    });
  }
}

function generateReleaseTasks(tasks: AdminTask[], report: LessonQaReport): void {
  const { lesson } = report;
  const lessonId = lesson.id;
  const title = lesson.title;
  const publishStatus = getAdminPublishStatus(lesson);
  const releaseStatus = lesson.releaseStatus ?? "draft";
  const readiness = calculateReleaseReadiness(lesson);

  if (readiness.readyToApprove && releaseStatus !== "approved") {
    pushTask(tasks, {
      id: taskId("release", "ready-to-approve", lessonId),
      category: "release",
      severity: "warning",
      title: `Lesson ${lessonId} ready to approve`,
      description: `${title} — контент бэлэн, admin approval хүлээж байна.`,
      lessonId,
      lessonTitle: title,
      actionLabel: "Approve lesson",
      actionHref: `${editHref(lessonId)}#release-readiness`,
      createdFrom: "release.readyToApprove",
    });
  }

  if (readiness.readyToPublish && publishStatus !== "available") {
    pushTask(tasks, {
      id: taskId("release", "ready-to-publish", lessonId),
      category: "release",
      severity: "success",
      title: `Lesson ${lessonId} ready to publish`,
      description: `${title} — approval/QA passed, publish хийж болно.`,
      lessonId,
      lessonTitle: title,
      actionLabel: "Open release controls",
      actionHref: `${editHref(lessonId)}#release-readiness`,
      createdFrom: "release.readyToPublish",
    });
  }

  if (publishStatus === "available" && releaseStatus !== "published") {
    pushTask(tasks, {
      id: taskId("release", "available-not-published", lessonId),
      category: "release",
      severity: "warning",
      title: `Lesson ${lessonId} live but release_status not published`,
      description: `${title} — public available боловч release_status sync шаардлагатай.`,
      lessonId,
      lessonTitle: title,
      actionLabel: "Release controls",
      actionHref: `${editHref(lessonId)}#release-readiness`,
      createdFrom: "release.statusMismatch",
    });
  }

  if (
    (publishStatus === "archived" && releaseStatus === "published") ||
    (publishStatus === "available" && releaseStatus === "archived")
  ) {
    pushTask(tasks, {
      id: taskId("release", "status-mismatch", lessonId),
      category: "release",
      severity: "critical",
      title: `Lesson ${lessonId} status mismatch`,
      description: `${title} — publish status (${publishStatus}) vs release_status (${releaseStatus}) зөрж байна.`,
      lessonId,
      lessonTitle: title,
      actionLabel: "Fix status",
      actionHref: editHref(lessonId),
      createdFrom: "release.archivedMismatch",
    });
  }
}

function generateBackupTasks(tasks: AdminTask[], report: LessonQaReport): void {
  const { lesson } = report;
  const lessonId = lesson.id;
  const title = lesson.title;
  const publishStatus = getAdminPublishStatus(lesson);
  const readiness = calculateReleaseReadiness(lesson);
  const hasContent =
    report.subtitleCount > 0 ||
    report.vocabularyActual > 0 ||
    report.quizActual > 0;

  if (!hasContent) return;

  if (readiness.readyToApprove && publishStatus !== "available") {
    pushTask(tasks, {
      id: taskId("backup", "export-before-publish", lessonId),
      category: "backup",
      severity: "info",
      title: `Export backup recommended — lesson ${lessonId}`,
      description: `${title} — publish-ийн өмнө JSON export хийхийг зөвлөж байна.`,
      lessonId,
      lessonTitle: title,
      actionLabel: "Edit & export",
      actionHref: editHref(lessonId),
      createdFrom: "backup.prePublish",
    });
  }
}

function generateAnalyticsTasks(
  tasks: AdminTask[],
  metrics: LessonAnalyticsMetrics,
  difficultForLesson: QuestionAnalyticsRow[],
  lowEngagementCount: number
): void {
  const { lessonId, title, status } = metrics;

  if (
    metrics.averageQuizPercentage != null &&
    metrics.averageQuizPercentage < LOW_QUIZ_SCORE_THRESHOLD &&
    metrics.quizAttemptCount > 0
  ) {
    pushTask(tasks, {
      id: taskId("analytics", "low-quiz-score", lessonId),
      category: "analytics",
      severity: "warning",
      title: `Lesson ${lessonId} low average quiz score`,
      description: `${title} — дундаж ${metrics.averageQuizPercentage}% (< ${LOW_QUIZ_SCORE_THRESHOLD}%).`,
      lessonId,
      lessonTitle: title,
      actionLabel: "View analytics",
      actionHref: analyticsHref(lessonId),
      secondaryActionLabel: "Generate prompt",
      secondaryActionHref: `${editHref(lessonId)}#content-improvement`,
      createdFrom: "analytics.lowQuizScore",
    });
  }

  if (status === "available" && metrics.quizAttemptCount === 0) {
    pushTask(tasks, {
      id: taskId("analytics", "no-quiz-attempts", lessonId),
      category: "analytics",
      severity: "info",
      title: `Lesson ${lessonId} has no quiz attempts yet`,
      description: `${title} — нийтлэгдсэн боловч суралцагч quiz оролдож байхгүй.`,
      lessonId,
      lessonTitle: title,
      actionLabel: "View analytics",
      actionHref: analyticsHref(lessonId),
      createdFrom: "analytics.noAttempts",
    });
  }

  if (
    metrics.completionRate != null &&
    metrics.startedCount >= 2 &&
    metrics.completionRate < LOW_COMPLETION_THRESHOLD
  ) {
    pushTask(tasks, {
      id: taskId("analytics", "low-completion", lessonId),
      category: "analytics",
      severity: "warning",
      title: `Lesson ${lessonId} low completion rate`,
      description: `${title} — completion ${metrics.completionRate}% (< ${LOW_COMPLETION_THRESHOLD}%).`,
      lessonId,
      lessonTitle: title,
      actionLabel: "View analytics",
      actionHref: analyticsHref(lessonId),
      secondaryActionLabel: "Question insights",
      secondaryActionHref: `/admin/analytics/questions?lesson=${lessonId}`,
      createdFrom: "analytics.lowCompletion",
    });
  }

  if (difficultForLesson.length > 0) {
    pushTask(tasks, {
      id: taskId("analytics", "difficult-questions", lessonId),
      category: "analytics",
      severity: "warning",
      title: `Lesson ${lessonId} has difficult questions`,
      description: `${title} — ${difficultForLesson.length} асуултын accuracy < ${LOW_QUIZ_SCORE_THRESHOLD}%.`,
      lessonId,
      lessonTitle: title,
      actionLabel: "Question insights",
      actionHref: `/admin/analytics/questions?lesson=${lessonId}`,
      secondaryActionLabel: "Edit lesson",
      secondaryActionHref: editHref(lessonId),
      createdFrom: "analytics.difficultQuestions",
    });
  }

  if (lowEngagementCount >= 3 && status === "available") {
    pushTask(tasks, {
      id: taskId("analytics", "low-vocab-engagement", lessonId),
      category: "analytics",
      severity: "warning",
      title: `Lesson ${lessonId} vocabulary low engagement`,
      description: `${title} — ${lowEngagementCount} үг бага engagement-тэй.`,
      lessonId,
      lessonTitle: title,
      actionLabel: "Vocabulary insights",
      actionHref: `/admin/analytics/vocabulary?lesson=${lessonId}`,
      secondaryActionLabel: "Generate prompt",
      secondaryActionHref: `${editHref(lessonId)}#content-improvement`,
      createdFrom: "analytics.lowVocabEngagement",
    });
  }
}

function generateSystemTasks(
  tasks: AdminTask[],
  input: AdminTaskGeneratorInput
): void {
  if (input.limitedByRls) {
    pushTask(tasks, {
      id: taskId("system", "rls-progress", undefined),
      category: "system",
      severity: "warning",
      title: "Learner analytics may be limited",
      description:
        "Some learner analytics may require admin progress read policies.",
      actionLabel: "View analytics",
      actionHref: "/admin/analytics",
      createdFrom: "system.rlsLimited",
    });
  }

  if (input.supabaseConfigured === false) {
    pushTask(tasks, {
      id: taskId("system", "no-supabase", undefined),
      category: "system",
      severity: "info",
      title: "Supabase not configured",
      description:
        "Task center uses local fallback — configure Supabase for full analytics tasks.",
      createdFrom: "system.noSupabase",
    });
  }

  for (const warning of input.warnings ?? []) {
    if (warning.toLowerCase().includes("migration")) {
      pushTask(tasks, {
        id: taskId("system", "migration", undefined),
        category: "system",
        severity: "warning",
        title: "Database migration pending",
        description: warning,
        actionLabel: "Release workflow docs",
        actionHref: "/admin/tasks",
        createdFrom: "system.migration",
      });
      break;
    }
  }
}

export function generateAdminTasks(input: AdminTaskGeneratorInput): AdminTask[] {
  const tasks: AdminTask[] = [];

  const analyticsByLesson = new Map(
    input.lessonAnalytics.map((row) => [row.lessonId, row])
  );

  const difficultByLesson = new Map<string, QuestionAnalyticsRow[]>();
  for (const row of input.difficultQuestions) {
    const list = difficultByLesson.get(row.lessonId) ?? [];
    list.push(row);
    difficultByLesson.set(row.lessonId, list);
  }

  const lowEngagementByLesson = new Map<string, number>();
  for (const row of input.vocabularyEngagement) {
    if (row.engagement === "low" || row.engagement === "none") {
      lowEngagementByLesson.set(
        row.lessonId,
        (lowEngagementByLesson.get(row.lessonId) ?? 0) + 1
      );
    }
  }

  for (const report of input.reports) {
    generateContentTasks(tasks, report);
    generateQaTasks(tasks, report.lesson);
    generateQaReviewTask(tasks, report);
    generateMediaTasks(tasks, report);
    generateReleaseTasks(tasks, report);
    generateBackupTasks(tasks, report);

    const metrics = analyticsByLesson.get(report.lesson.id);
    if (metrics) {
      generateAnalyticsTasks(
        tasks,
        metrics,
        difficultByLesson.get(report.lesson.id) ?? [],
        lowEngagementByLesson.get(report.lesson.id) ?? 0
      );
    }
  }

  generateSystemTasks(tasks, input);

  return tasks;
}

export function getTaskSeverity(task: AdminTask): AdminTaskSeverity {
  return task.severity;
}

export function groupTasksByCategory(
  tasks: AdminTask[]
): Record<AdminTaskCategory, AdminTask[]> {
  const groups: Record<AdminTaskCategory, AdminTask[]> = {
    content: [],
    qa: [],
    media: [],
    release: [],
    analytics: [],
    backup: [],
    system: [],
  };

  for (const task of tasks) {
    groups[task.category].push(task);
  }

  return groups;
}

export function sortAdminTasks(tasks: AdminTask[]): AdminTask[] {
  return tasks.slice().sort((a, b) => {
    const severityDiff = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    if (severityDiff !== 0) return severityDiff;

    const categoryDiff = a.category.localeCompare(b.category);
    if (categoryDiff !== 0) return categoryDiff;

    const lessonA = a.lessonId ?? "";
    const lessonB = b.lessonId ?? "";
    if (lessonA !== lessonB) {
      const numA = Number(lessonA);
      const numB = Number(lessonB);
      if (!Number.isNaN(numA) && !Number.isNaN(numB)) return numA - numB;
      return lessonA.localeCompare(lessonB);
    }

    return a.title.localeCompare(b.title);
  });
}

export function summarizeAdminTasks(tasks: AdminTask[]): AdminTaskSummary {
  let criticalCount = 0;
  let warningCount = 0;
  let infoCount = 0;
  let successCount = 0;
  let readyToPublishCount = 0;
  let needsContentCount = 0;
  let mediaIssuesCount = 0;

  for (const task of tasks) {
    if (task.severity === "critical") criticalCount += 1;
    if (task.severity === "warning") warningCount += 1;
    if (task.severity === "info") infoCount += 1;
    if (task.severity === "success") successCount += 1;

    if (task.createdFrom === "release.readyToPublish") {
      readyToPublishCount += 1;
    }

    if (task.category === "content") {
      needsContentCount += 1;
    }

    if (
      task.category === "media" &&
      (task.severity === "critical" || task.severity === "warning")
    ) {
      mediaIssuesCount += 1;
    }
  }

  return {
    totalTasks: tasks.length,
    criticalCount,
    warningCount,
    infoCount,
    successCount,
    readyToPublishCount,
    needsContentCount,
    mediaIssuesCount,
  };
}

export function filterTasksForLesson(
  tasks: AdminTask[],
  lessonId: string
): AdminTask[] {
  return tasks.filter(
    (task) => task.lessonId != null && task.lessonId === lessonId
  );
}
