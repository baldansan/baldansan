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
  | "system"
  | "b2b";

export type AdminTaskSeverity = "critical" | "warning" | "info" | "success";

export type AdminTaskStatus = "open" | "in_progress" | "resolved" | "dismissed";

export type AdminTaskPriority = "low" | "normal" | "high" | "urgent";

export type AdminTask = {
  id: string;
  taskKey: string;
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
  status: AdminTaskStatus;
  priority: AdminTaskPriority;
  dueDate?: string | null;
  adminNote?: string | null;
  assignedTo?: string | null;
  resolvedAt?: string | null;
  dismissedAt?: string | null;
  /** Still generated from current lesson/analytics data */
  isGenerated?: boolean;
  /** Row exists in admin_tasks */
  isPersisted?: boolean;
};

export type AdminTaskGeneratorInput = {
  reports: LessonQaReport[];
  lessonAnalytics: LessonAnalyticsMetrics[];
  difficultQuestions: QuestionAnalyticsRow[];
  vocabularyEngagement: VocabularyEngagementRow[];
  warnings?: string[];
  limitedByRls?: boolean;
  supabaseConfigured?: boolean;
  b2bCrm?: {
    newInquiryCount: number;
    demoScheduledCount: number;
    pilotOrgCount: number;
    migrationPending: boolean;
  };
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
  openCount: number;
  inProgressCount: number;
  overdueCount: number;
  urgentCount: number;
  resolvedCount: number;
  dismissedCount: number;
  activeCount: number;
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

export function buildTaskKey(
  category: AdminTaskCategory,
  slug: string,
  lessonId?: string
): string {
  return `${category}:${slug}:${lessonId ?? "global"}`;
}

function pushTask(
  tasks: AdminTask[],
  task: Omit<
    AdminTask,
    "taskKey" | "status" | "priority" | "isGenerated" | "isPersisted"
  > &
    Partial<Pick<AdminTask, "taskKey" | "status" | "priority">>
): void {
  const taskKey = task.taskKey ?? task.id;
  const full: AdminTask = {
    ...task,
    id: taskKey,
    taskKey,
    status: task.status ?? "open",
    priority: task.priority ?? "normal",
    isGenerated: true,
  };
  if (!tasks.some((existing) => existing.taskKey === full.taskKey)) {
    tasks.push(full);
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
      id: buildTaskKey("content", "no-subtitles", lessonId),
      category: "content",
      severity: "critical",
      title: `Хичээл ${lessonId}: хадмал алга`,
      description: `${title} — хадмалын мөр алга. Багцаар оруулах эсвэл засварлагчаар нэмнэ үү.`,
      lessonId,
      lessonTitle: title,
      actionLabel: "Хичээл засах",
      actionHref: editHref(lessonId),
      createdFrom: "content.subtitleCount",
    });
  }

  if (report.vocabularyActual === 0) {
    pushTask(tasks, {
      id: buildTaskKey("content", "no-vocabulary", lessonId),
      category: "content",
      severity: "critical",
      title: `Хичээл ${lessonId}: үгсийн сан алга`,
      description: `${title} — үгсийн сан хоосон байна.`,
      lessonId,
      lessonTitle: title,
      actionLabel: "Хичээл засах",
      actionHref: editHref(lessonId),
      createdFrom: "content.vocabularyCount",
    });
  } else if (report.vocabularyActual < MIN_VOCABULARY_FOR_PUBLISH) {
    pushTask(tasks, {
      id: buildTaskKey("content", "low-vocabulary", lessonId),
      category: "content",
      severity: "warning",
      title: `Хичээл ${lessonId}: үгсийн сан хүрэлцэхгүй`,
      description: `${report.vocabularyActual}/${MIN_VOCABULARY_FOR_PUBLISH} үг — нийтлэхэд хүрэлцэхгүй.`,
      lessonId,
      lessonTitle: title,
      actionLabel: "Үгсийн сан засах",
      actionHref: editHref(lessonId),
      createdFrom: "content.vocabularyMinimum",
    });
  }

  if (report.quizActual === 0) {
    pushTask(tasks, {
      id: buildTaskKey("content", "no-quiz", lessonId),
      category: "content",
      severity: "critical",
      title: `Хичээл ${lessonId}: дасгалын асуулт алга`,
      description: `${title} — дасгалын асуулт алга.`,
      lessonId,
      lessonTitle: title,
      actionLabel: "Хичээл засах",
      actionHref: editHref(lessonId),
      createdFrom: "content.quizCount",
    });
  } else if (report.quizActual < MIN_QUIZ_FOR_PUBLISH) {
    pushTask(tasks, {
      id: buildTaskKey("content", "low-quiz", lessonId),
      category: "content",
      severity: "warning",
      title: `Хичээл ${lessonId}: дасгал хүрэлцэхгүй`,
      description: `${report.quizActual}/${MIN_QUIZ_FOR_PUBLISH} асуулт — нийтлэхэд хүрэлцэхгүй.`,
      lessonId,
      lessonTitle: title,
      actionLabel: "Дасгал засах",
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
      id: buildTaskKey("content", "draft-needs-content", lessonId),
      category: "content",
      severity: "warning",
      title: `Ноорог хичээл ${lessonId}: агуулга дутуу`,
      description: `${title} — ноорог хичээл, агуулга дутуу байна.`,
      lessonId,
      lessonTitle: title,
      actionLabel: "Хичээл бүтээгч нээх",
      actionHref: "/admin/lesson-builder",
      secondaryActionLabel: "Хичээл засах",
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
      id: buildTaskKey("qa", "failed", lessonId),
      category: "qa",
      severity: "critical",
      title: `Хичээл ${lessonId}: чанарын шалгалт давсангүй`,
      description: `${title} — чанарын шалгалт давсангүй. Засвар хийж дахин шалгана уу.`,
      lessonId,
      lessonTitle: title,
      actionLabel: "Шалгалт харах",
      actionHref: `${editHref(lessonId)}#release-readiness`,
      createdFrom: "qa.workflowFailed",
    });
  }

  if (releaseStatus === "in_review") {
    pushTask(tasks, {
      id: buildTaskKey("qa", "in-review", lessonId),
      category: "qa",
      severity: "info",
      title: `Хичээл ${lessonId}: шалгалтад байна`,
      description: `${title} — хувилбар гаргах урсгалд шалгалтын төлөвт байна.`,
      lessonId,
      lessonTitle: title,
      actionLabel: "Баталгааны хэсэг",
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
    id: buildTaskKey("qa", "needs-review", lesson.id),
    category: "qa",
    severity: "warning",
    title: `Хичээл ${lesson.id}: чанарын шалгалт хүлээж байна`,
    description: `${lesson.title} — агуулга хангалттай, чанарын шалгалт хүлээж байна.`,
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    actionLabel: "Шалгаад батлах",
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
      id: buildTaskKey("media", "missing", lessonId),
      category: "media",
      severity: "warning",
      title: `Хичээл ${lessonId}: медиа алга`,
      description: `${title} — медиа байршуулаагүй байна (media_status: missing).`,
      lessonId,
      lessonTitle: title,
      actionLabel: "Медиа байршуулах",
      actionHref: editHref(lessonId),
      createdFrom: "media.statusMissing",
    });
  } else if (mediaStatus === "pending") {
    pushTask(tasks, {
      id: buildTaskKey("media", "pending", lessonId),
      category: "media",
      severity: "info",
      title: `Хичээл ${lessonId}: медиа хүлээгдэж байна`,
      description: `${title} — медиа байршуулж эхэлсэн, бичлэгийн URL нэмнэ үү.`,
      lessonId,
      lessonTitle: title,
      actionLabel: "Медиа байршуулах",
      actionHref: editHref(lessonId),
      createdFrom: "media.statusPending",
    });
  }

  if (publishStatus === "available" && !hasVideoUrl(lesson)) {
    pushTask(tasks, {
      id: buildTaskKey("media", "available-no-video", lessonId),
      category: "media",
      severity: "warning",
      title: `Хичээл ${lessonId}: бичлэггүй нийтлэгдсэн`,
      description: `${title} — нийтлэгдсэн боловч бичлэгийн URL алга.`,
      lessonId,
      lessonTitle: title,
      actionLabel: "Бичлэг нэмэх",
      actionHref: editHref(lessonId),
      createdFrom: "media.availableNoVideo",
    });
  }

  if (!hasThumbnailUrl(lesson) && hasEnoughContent(report)) {
    pushTask(tasks, {
      id: buildTaskKey("media", "no-thumbnail", lessonId),
      category: "media",
      severity: "info",
      title: `Хичээл ${lessonId}: нүүр зураг алга`,
      description: `${title} — нүүр зургийн URL нэмэхийг зөвлөж байна.`,
      lessonId,
      lessonTitle: title,
      actionLabel: "Нүүр зураг байршуулах",
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
      id: buildTaskKey("release", "ready-to-approve", lessonId),
      category: "release",
      severity: "warning",
      title: `Хичээл ${lessonId}: батлахад бэлэн`,
      description: `${title} — агуулга бэлэн, админы баталгаа хүлээж байна.`,
      lessonId,
      lessonTitle: title,
      actionLabel: "Хичээл батлах",
      actionHref: `${editHref(lessonId)}#release-readiness`,
      createdFrom: "release.readyToApprove",
    });
  }

  if (readiness.readyToPublish && publishStatus !== "available") {
    pushTask(tasks, {
      id: buildTaskKey("release", "ready-to-publish", lessonId),
      category: "release",
      severity: "success",
      title: `Хичээл ${lessonId}: нийтлэхэд бэлэн`,
      description: `${title} — баталгаа, чанарын шалгалт давсан. Одоо нийтэлж болно.`,
      lessonId,
      lessonTitle: title,
      actionLabel: "Нийтлэх хэсэг нээх",
      actionHref: `${editHref(lessonId)}#release-readiness`,
      createdFrom: "release.readyToPublish",
    });
  }

  if (publishStatus === "available" && releaseStatus !== "published") {
    pushTask(tasks, {
      id: buildTaskKey("release", "available-not-published", lessonId),
      category: "release",
      severity: "warning",
      title: `Хичээл ${lessonId}: нийтлэгдсэн ч төлөв тохирохгүй`,
      description: `${title} — хэрэглэгчид харагдаж байгаа ч release_status-ыг тааруулах шаардлагатай.`,
      lessonId,
      lessonTitle: title,
      actionLabel: "Нийтлэх хэсэг",
      actionHref: `${editHref(lessonId)}#release-readiness`,
      createdFrom: "release.statusMismatch",
    });
  }

  if (
    (publishStatus === "archived" && releaseStatus === "published") ||
    (publishStatus === "available" && releaseStatus === "archived")
  ) {
    pushTask(tasks, {
      id: buildTaskKey("release", "status-mismatch", lessonId),
      category: "release",
      severity: "critical",
      title: `Хичээл ${lessonId}: төлөв зөрчилдөж байна`,
      description: `${title} — нийтлэлийн төлөв (${publishStatus}) ба release_status (${releaseStatus}) хоёр зөрж байна.`,
      lessonId,
      lessonTitle: title,
      actionLabel: "Төлөв засах",
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
      id: buildTaskKey("backup", "export-before-publish", lessonId),
      category: "backup",
      severity: "info",
      title: `Хичээл ${lessonId}: нөөц хуулбар авахыг зөвлөж байна`,
      description: `${title} — нийтлэхийн өмнө JSON нөөц хуулбар гаргахыг зөвлөж байна.`,
      lessonId,
      lessonTitle: title,
      actionLabel: "Засаад гаргах",
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
      id: buildTaskKey("analytics", "low-quiz-score", lessonId),
      category: "analytics",
      severity: "warning",
      title: `Хичээл ${lessonId}: дасгалын дундаж оноо бага`,
      description: `${title} — дундаж ${metrics.averageQuizPercentage}% (< ${LOW_QUIZ_SCORE_THRESHOLD}%).`,
      lessonId,
      lessonTitle: title,
      actionLabel: "Тайлан харах",
      actionHref: analyticsHref(lessonId),
      secondaryActionLabel: "Prompt үүсгэх",
      secondaryActionHref: `${editHref(lessonId)}#content-improvement`,
      createdFrom: "analytics.lowQuizScore",
    });
  }

  if (status === "available" && metrics.quizAttemptCount === 0) {
    pushTask(tasks, {
      id: buildTaskKey("analytics", "no-quiz-attempts", lessonId),
      category: "analytics",
      severity: "info",
      title: `Хичээл ${lessonId}: дасгал хийсэн оролдлого алга`,
      description: `${title} — нийтлэгдсэн боловч суралцагчид дасгалыг хийж үзээгүй байна.`,
      lessonId,
      lessonTitle: title,
      actionLabel: "Тайлан харах",
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
      id: buildTaskKey("analytics", "low-completion", lessonId),
      category: "analytics",
      severity: "warning",
      title: `Хичээл ${lessonId}: дуусгасан хувь бага`,
      description: `${title} — дуусгасан ${metrics.completionRate}% (< ${LOW_COMPLETION_THRESHOLD}%).`,
      lessonId,
      lessonTitle: title,
      actionLabel: "Тайлан харах",
      actionHref: analyticsHref(lessonId),
      secondaryActionLabel: "Асуултын дүн шинжилгээ",
      secondaryActionHref: `/admin/analytics/questions?lesson=${lessonId}`,
      createdFrom: "analytics.lowCompletion",
    });
  }

  if (difficultForLesson.length > 0) {
    pushTask(tasks, {
      id: buildTaskKey("analytics", "difficult-questions", lessonId),
      category: "analytics",
      severity: "warning",
      title: `Хичээл ${lessonId}: хэцүү асуултууд байна`,
      description: `${title} — ${difficultForLesson.length} асуултын зөв хариултын хувь ${LOW_QUIZ_SCORE_THRESHOLD}%-иас бага.`,
      lessonId,
      lessonTitle: title,
      actionLabel: "Асуултын дүн шинжилгээ",
      actionHref: `/admin/analytics/questions?lesson=${lessonId}`,
      secondaryActionLabel: "Хичээл засах",
      secondaryActionHref: editHref(lessonId),
      createdFrom: "analytics.difficultQuestions",
    });
  }

  if (lowEngagementCount >= 3 && status === "available") {
    pushTask(tasks, {
      id: buildTaskKey("analytics", "low-vocab-engagement", lessonId),
      category: "analytics",
      severity: "warning",
      title: `Хичээл ${lessonId}: үгсийн санг бага давтаж байна`,
      description: `${title} — ${lowEngagementCount} үгийг суралцагчид бараг давтахгүй байна.`,
      lessonId,
      lessonTitle: title,
      actionLabel: "Үгсийн сангийн дүн шинжилгээ",
      actionHref: `/admin/analytics/vocabulary?lesson=${lessonId}`,
      secondaryActionLabel: "Prompt үүсгэх",
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
      id: buildTaskKey("system", "rls-progress", undefined),
      category: "system",
      severity: "warning",
      title: "Суралцагчийн тайлан дутуу байж магадгүй",
      description:
        "Зарим суралцагчийн ахицыг харахад админы унших эрх (RLS дүрэм) шаардлагатай.",
      actionLabel: "Тайлан харах",
      actionHref: "/admin/analytics",
      createdFrom: "system.rlsLimited",
    });
  }

  if (input.supabaseConfigured === false) {
    pushTask(tasks, {
      id: buildTaskKey("system", "no-supabase", undefined),
      category: "system",
      severity: "info",
      title: "Supabase тохируулаагүй байна",
      description:
        "Ажлын төв түр өгөгдлөөр ажиллаж байна — бүрэн тайлан гаргахын тулд Supabase-ээ тохируулна уу.",
      createdFrom: "system.noSupabase",
    });
  }

  for (const warning of input.warnings ?? []) {
    if (warning.toLowerCase().includes("migration")) {
      pushTask(tasks, {
        id: buildTaskKey("system", "migration", undefined),
        category: "system",
        severity: "warning",
        title: "Өгөгдлийн сангийн шинэчлэл хүлээгдэж байна",
        description: warning,
        actionLabel: "Хувилбар гаргах заавар",
        actionHref: "/admin/tasks",
        createdFrom: "system.migration",
      });
      break;
    }
  }

  generateB2bCrmTasks(tasks, input.b2bCrm);
}

function generateB2bCrmTasks(
  tasks: AdminTask[],
  b2bCrm?: AdminTaskGeneratorInput["b2bCrm"]
): void {
  if (!b2bCrm) return;

  if (b2bCrm.migrationPending) {
    pushTask(tasks, {
      id: buildTaskKey("b2b", "migration-pending", undefined),
      category: "b2b",
      severity: "warning",
      title: "Сургуулийн хүсэлт шинэчлэл хүлээж байна",
      description:
        "Хүсэлт, байгууллагуудыг харахын тулд supabase/migrations/012_school_organizations_b2b_crm.sql файлыг ажиллуулна уу.",
      actionLabel: "Сургууль, байгууллага",
      actionHref: "/admin/b2b",
      createdFrom: "b2b.migrationPending",
    });
    return;
  }

  if (b2bCrm.newInquiryCount > 0) {
    pushTask(tasks, {
      id: buildTaskKey("b2b", "new-inquiries", undefined),
      category: "b2b",
      severity: "warning",
      title: `${b2bCrm.newInquiryCount} шинэ B2B хүсэлттэй хараахан холбогдоогүй`,
      description: "Сургууль, байгууллагын хэсэгт хүсэлтийн төлөвийг шалгаж шинэчилнэ үү.",
      actionLabel: "Хүсэлтүүд харах",
      actionHref: "/admin/b2b/inquiries",
      createdFrom: "b2b.newInquiry",
    });
  }

  if (b2bCrm.demoScheduledCount > 0) {
    pushTask(tasks, {
      id: buildTaskKey("b2b", "demo-scheduled", undefined),
      category: "b2b",
      severity: "info",
      title: `${b2bCrm.demoScheduledCount} хүсэлтэд танилцуулга товлосон`,
      description:
        "Танилцуулгын дараа эргэж холбогдоод хүсэлтийн төлөвийг шинэчилнэ үү.",
      actionLabel: "Сургууль, байгууллага",
      actionHref: "/admin/b2b",
      createdFrom: "b2b.demoScheduled",
    });
  }

  if (b2bCrm.pilotOrgCount > 0) {
    pushTask(tasks, {
      id: buildTaskKey("b2b", "pilot-orgs", undefined),
      category: "b2b",
      severity: "info",
      title: `${b2bCrm.pilotOrgCount} идэвхтэй/туршилтын байгууллага`,
      description: "Туршилтын байгууллага, гишүүдийн тохиргоог шалгана уу.",
      actionLabel: "Байгууллагууд",
      actionHref: "/admin/b2b/organizations",
      createdFrom: "b2b.pilotOrg",
    });
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
    b2b: [],
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
    openCount: 0,
    inProgressCount: 0,
    overdueCount: 0,
    urgentCount: 0,
    resolvedCount: 0,
    dismissedCount: 0,
    activeCount: tasks.length,
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
