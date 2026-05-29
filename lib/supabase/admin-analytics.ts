import "server-only";

import {
  MIN_QUIZ_FOR_PUBLISH,
  MIN_VOCABULARY_FOR_PUBLISH,
} from "@/lib/admin/import-qa";
import { getHsk5LessonsWithQa, getAdminLessonsByCourseId } from "@/lib/admin/lesson-fetch";
import { getAdminPublishStatus } from "@/lib/admin/lesson-status";
import type { LessonQaReport, LessonQaStatus } from "@/lib/admin/lesson-qa";
import { canonicalLessonId, lessonIdsMatch } from "@/lib/lesson-id";
import {
  parseQuizAttemptAnswers,
  questionAnalyticsKey,
} from "@/lib/quiz-answers";
import {
  hasAudioUrl,
  hasThumbnailUrl,
  hasVideoUrl,
  isMediaReady,
  normalizeMediaStatus,
} from "@/lib/lesson-media";
import { hasSupabaseConfig } from "@/lib/supabase/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type LessonStatusMetrics = {
  totalLessons: number;
  draftCount: number;
  availableCount: number;
  archivedCount: number;
};

export type ContentTotalsMetrics = {
  totalSubtitleLines: number;
  totalVocabularyWords: number;
  totalQuizQuestions: number;
};

export type ContentQaMetrics = {
  lessonsMissingSubtitles: number;
  lessonsMissingVocabulary: number;
  lessonsMissingQuiz: number;
  lessonsReadyToPublish: number;
  needsReviewCount: number;
};

export type MediaReadinessMetrics = {
  mediaReadyCount: number;
  mediaPendingCount: number;
  mediaMissingCount: number;
  withThumbnailCount: number;
  withVideoCount: number;
  withAudioCount: number;
};

export type LearnerProgressMetrics = {
  usersWithLessonProgress: number;
  completedLessonRows: number;
  learnedVocabularyRows: number;
  quizAttempts: number;
  averageQuizPercentage: number | null;
  limitedByRls: boolean;
};

export type RecentQuizAttemptRow = {
  id: string;
  lessonId: string;
  score: number;
  total: number;
  percentage: number;
  createdAt: string;
};

export type RecentLessonProgressRow = {
  id: string;
  lessonId: string;
  status: string;
  progressPercent: number;
  updatedAt: string;
};

export type AttentionLesson = {
  lessonId: string;
  title: string;
  issues: string[];
};

export type AdminDashboardMetrics = {
  lessonStatus: LessonStatusMetrics;
  contentTotals: ContentTotalsMetrics;
  contentQa: ContentQaMetrics;
  media: MediaReadinessMetrics;
  learnerProgress: LearnerProgressMetrics;
  needsAttention: AttentionLesson[];
  recentQuizAttempts: RecentQuizAttemptRow[];
  recentLessonProgress: RecentLessonProgressRow[];
  warnings: string[];
};

const DEFAULT_COURSE_ID = "hsk5";

async function getServerClient() {
  if (!hasSupabaseConfig) {
    return null;
  }
  return createServerSupabaseClient();
}

function isPublishReadyReport(report: LessonQaReport): boolean {
  return (
    report.subtitleCount > 0 &&
    report.vocabularyActual >= MIN_VOCABULARY_FOR_PUBLISH &&
    report.quizActual >= MIN_QUIZ_FOR_PUBLISH
  );
}

function computeContentQaFromReports(
  reports: LessonQaReport[]
): ContentQaMetrics {
  let lessonsMissingSubtitles = 0;
  let lessonsMissingVocabulary = 0;
  let lessonsMissingQuiz = 0;
  let lessonsReadyToPublish = 0;
  let needsReviewCount = 0;

  for (const report of reports) {
    if (report.subtitleCount === 0) lessonsMissingSubtitles += 1;
    if (report.vocabularyActual === 0) lessonsMissingVocabulary += 1;
    if (report.quizActual === 0) lessonsMissingQuiz += 1;
    if (isPublishReadyReport(report)) lessonsReadyToPublish += 1;
    if (report.qaStatus === "needs_review") needsReviewCount += 1;
  }

  return {
    lessonsMissingSubtitles,
    lessonsMissingVocabulary,
    lessonsMissingQuiz,
    lessonsReadyToPublish,
    needsReviewCount,
  };
}

function sumContentTotalsFromReports(
  reports: LessonQaReport[]
): ContentTotalsMetrics {
  let totalSubtitleLines = 0;
  let totalVocabularyWords = 0;
  let totalQuizQuestions = 0;

  for (const report of reports) {
    totalSubtitleLines += report.subtitleCount;
    totalVocabularyWords += report.vocabularyActual;
    totalQuizQuestions += report.quizActual;
  }

  return {
    totalSubtitleLines,
    totalVocabularyWords,
    totalQuizQuestions,
  };
}

function buildAttentionList(reports: LessonQaReport[]): AttentionLesson[] {
  const items: AttentionLesson[] = [];

  for (const report of reports) {
    const issues: string[] = [];

    if (report.subtitleCount === 0) {
      issues.push("Missing subtitles");
    }
    if (report.vocabularyActual === 0) {
      issues.push("Missing vocabulary");
    } else if (report.vocabularyActual < MIN_VOCABULARY_FOR_PUBLISH) {
      issues.push(`Vocabulary below ${MIN_VOCABULARY_FOR_PUBLISH}`);
    }
    if (report.quizActual === 0) {
      issues.push("Missing quiz");
    } else if (report.quizActual < MIN_QUIZ_FOR_PUBLISH) {
      issues.push(`Quiz below ${MIN_QUIZ_FOR_PUBLISH}`);
    }
    if (
      normalizeMediaStatus(report.lesson.mediaStatus) === "missing" ||
      !hasVideoUrl(report.lesson)
    ) {
      issues.push("Media missing");
    }
    if (report.qaStatus === "needs_review" && issues.length === 0) {
      issues.push("Needs review");
    }

    if (issues.length > 0) {
      items.push({
        lessonId: report.lesson.id,
        title: report.lesson.title,
        issues,
      });
    }
  }

  return items.sort((a, b) => Number(a.lessonId) - Number(b.lessonId));
}

export async function getLessonStatusMetrics(): Promise<LessonStatusMetrics> {
  const lessons = await getAdminLessonsByCourseId(DEFAULT_COURSE_ID);

  let draftCount = 0;
  let availableCount = 0;
  let archivedCount = 0;

  for (const lesson of lessons) {
    const status = getAdminPublishStatus(lesson);
    if (status === "available") availableCount += 1;
    else if (status === "archived") archivedCount += 1;
    else draftCount += 1;
  }

  return {
    totalLessons: lessons.length,
    draftCount,
    availableCount,
    archivedCount,
  };
}

export async function getContentQaMetrics(): Promise<ContentQaMetrics> {
  const reports = await getHsk5LessonsWithQa();
  return computeContentQaFromReports(reports);
}

export async function getMediaReadinessMetrics(): Promise<MediaReadinessMetrics> {
  const lessons = await getAdminLessonsByCourseId(DEFAULT_COURSE_ID);

  let mediaReadyCount = 0;
  let mediaPendingCount = 0;
  let mediaMissingCount = 0;
  let withThumbnailCount = 0;
  let withVideoCount = 0;
  let withAudioCount = 0;

  for (const lesson of lessons) {
    const status = normalizeMediaStatus(lesson.mediaStatus);

    if (isMediaReady(lesson)) {
      mediaReadyCount += 1;
    } else if (status === "pending") {
      mediaPendingCount += 1;
    } else {
      mediaMissingCount += 1;
    }

    if (hasThumbnailUrl(lesson)) withThumbnailCount += 1;
    if (hasVideoUrl(lesson)) withVideoCount += 1;
    if (hasAudioUrl(lesson)) withAudioCount += 1;
  }

  return {
    mediaReadyCount,
    mediaPendingCount,
    mediaMissingCount,
    withThumbnailCount,
    withVideoCount,
    withAudioCount,
  };
}

async function countTableRows(
  table: "subtitle_lines" | "vocabulary_words" | "quiz_questions"
): Promise<{ count: number; error: string | null }> {
  const client = await getServerClient();
  if (!client) {
    return { count: 0, error: "Supabase not configured." };
  }

  try {
    const { count, error } = await client
      .from(table)
      .select("*", { count: "exact", head: true });

    if (error) {
      return { count: 0, error: error.message };
    }

    return { count: count ?? 0, error: null };
  } catch {
    return { count: 0, error: `Failed to count ${table}.` };
  }
}

async function enrichContentTotalsFromDb(
  base: ContentTotalsMetrics
): Promise<{ metrics: ContentTotalsMetrics; warnings: string[] }> {
  const warnings: string[] = [];
  let metrics = { ...base };

  const [subs, vocab, quiz] = await Promise.all([
    countTableRows("subtitle_lines"),
    countTableRows("vocabulary_words"),
    countTableRows("quiz_questions"),
  ]);

  for (const result of [subs, vocab, quiz]) {
    if (result.error) {
      warnings.push(result.error);
    }
  }

  if (!subs.error && subs.count > 0) {
    metrics = { ...metrics, totalSubtitleLines: subs.count };
  }
  if (!vocab.error && vocab.count > 0) {
    metrics = { ...metrics, totalVocabularyWords: vocab.count };
  }
  if (!quiz.error && quiz.count > 0) {
    metrics = { ...metrics, totalQuizQuestions: quiz.count };
  }

  return { metrics, warnings };
}

export async function getContentTotalsMetrics(): Promise<{
  metrics: ContentTotalsMetrics;
  warnings: string[];
}> {
  const reports = await getHsk5LessonsWithQa();
  return enrichContentTotalsFromDb(sumContentTotalsFromReports(reports));
}

export async function getLearnerProgressMetrics(): Promise<{
  metrics: LearnerProgressMetrics;
  warnings: string[];
}> {
  const warnings: string[] = [];
  const empty: LearnerProgressMetrics = {
    usersWithLessonProgress: 0,
    completedLessonRows: 0,
    learnedVocabularyRows: 0,
    quizAttempts: 0,
    averageQuizPercentage: null,
    limitedByRls: false,
  };

  const client = await getServerClient();
  if (!client) {
    warnings.push("Supabase not configured — learner metrics unavailable.");
    return { metrics: empty, warnings };
  }

  try {
    const [lessonProgress, vocabProgress, quizAttempts] = await Promise.all([
      client.from("user_lesson_progress").select("user_id, status"),
      client
        .from("user_vocabulary_progress")
        .select("user_id, status"),
      client.from("user_quiz_attempts").select("percentage"),
    ]);

    const progressErrors = [
      lessonProgress.error,
      vocabProgress.error,
      quizAttempts.error,
    ].filter(Boolean);

    if (progressErrors.length > 0) {
      warnings.push(
        "Some analytics may require admin read policies for progress tables."
      );
      for (const err of progressErrors) {
        if (err?.message) warnings.push(err.message);
      }
      return {
        metrics: { ...empty, limitedByRls: true },
        warnings,
      };
    }

    const lessonRows = lessonProgress.data ?? [];
    const vocabRows = vocabProgress.data ?? [];
    const quizRows = quizAttempts.data ?? [];

    const uniqueUsers = new Set(
      lessonRows
        .map((row) => row.user_id)
        .filter((id): id is string => Boolean(id))
    );

    const completedLessonRows = lessonRows.filter(
      (row) => row.status === "completed"
    ).length;

    const learnedVocabularyRows = vocabRows.filter(
      (row) => row.status === "learned"
    ).length;

    const percentages = quizRows
      .map((row) => row.percentage)
      .filter((value): value is number => typeof value === "number");

    const averageQuizPercentage =
      percentages.length > 0
        ? Math.round(
            percentages.reduce((sum, value) => sum + value, 0) /
              percentages.length
          )
        : null;

    const limitedByRls =
      lessonRows.length === 0 &&
      vocabRows.length === 0 &&
      quizRows.length === 0;

    if (limitedByRls) {
      warnings.push(
        "Learner progress metrics may be limited by RLS (admin sees own rows only until admin read policies are added)."
      );
    }

    return {
      metrics: {
        usersWithLessonProgress: uniqueUsers.size,
        completedLessonRows,
        learnedVocabularyRows,
        quizAttempts: quizRows.length,
        averageQuizPercentage,
        limitedByRls,
      },
      warnings,
    };
  } catch {
    warnings.push(
      "Some analytics may require admin read policies for progress tables."
    );
    return {
      metrics: { ...empty, limitedByRls: true },
      warnings,
    };
  }
}

export async function getRecentQuizAttempts(
  limit = 8
): Promise<{ rows: RecentQuizAttemptRow[]; warnings: string[] }> {
  const warnings: string[] = [];
  const client = await getServerClient();

  if (!client) {
    warnings.push("Supabase not configured.");
    return { rows: [], warnings };
  }

  try {
    const { data, error } = await client
      .from("user_quiz_attempts")
      .select("id, lesson_id, score, total, percentage, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      warnings.push(
        error.message ||
          "Quiz attempts unavailable — admin read policy may be required."
      );
      return { rows: [], warnings };
    }

    return {
      rows: (data ?? []).map((row) => ({
        id: String(row.id),
        lessonId: String(row.lesson_id),
        score: row.score ?? 0,
        total: row.total ?? 0,
        percentage: row.percentage ?? 0,
        createdAt: row.created_at ?? "",
      })),
      warnings,
    };
  } catch {
    warnings.push("Failed to load recent quiz attempts.");
    return { rows: [], warnings };
  }
}

export async function getRecentLessonProgress(
  limit = 8
): Promise<{ rows: RecentLessonProgressRow[]; warnings: string[] }> {
  const warnings: string[] = [];
  const client = await getServerClient();

  if (!client) {
    warnings.push("Supabase not configured.");
    return { rows: [], warnings };
  }

  try {
    const { data, error } = await client
      .from("user_lesson_progress")
      .select("id, lesson_id, status, progress_percent, updated_at")
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (error) {
      warnings.push(
        error.message ||
          "Lesson progress unavailable — admin read policy may be required."
      );
      return { rows: [], warnings };
    }

    return {
      rows: (data ?? []).map((row) => ({
        id: String(row.id),
        lessonId: String(row.lesson_id),
        status: String(row.status ?? "unknown"),
        progressPercent: row.progress_percent ?? 0,
        updatedAt: row.updated_at ?? "",
      })),
      warnings,
    };
  } catch {
    warnings.push("Failed to load recent lesson progress.");
    return { rows: [], warnings };
  }
}

export async function getAdminDashboardMetrics(): Promise<AdminDashboardMetrics> {
  const warnings: string[] = [];

  const reports = await getHsk5LessonsWithQa();
  const contentQa = computeContentQaFromReports(reports);
  const needsAttention = buildAttentionList(reports);

  const [
    lessonStatus,
    media,
    contentTotalsResult,
    learnerResult,
    recentQuiz,
    recentProgress,
  ] = await Promise.all([
    getLessonStatusMetrics(),
    getMediaReadinessMetrics(),
    enrichContentTotalsFromDb(sumContentTotalsFromReports(reports)),
    getLearnerProgressMetrics(),
    getRecentQuizAttempts(8),
    getRecentLessonProgress(8),
  ]);

  warnings.push(
    ...contentTotalsResult.warnings,
    ...learnerResult.warnings,
    ...recentQuiz.warnings,
    ...recentProgress.warnings
  );

  return {
    lessonStatus,
    contentTotals: contentTotalsResult.metrics,
    contentQa,
    media,
    learnerProgress: learnerResult.metrics,
    needsAttention,
    recentQuizAttempts: recentQuiz.rows,
    recentLessonProgress: recentProgress.rows,
    warnings: [...new Set(warnings)],
  };
}

/** Lightweight summary for /admin/lessons header. */
export async function getAdminLessonsPageSummary(): Promise<{
  totalLessons: number;
  needsReview: number;
  readyToPublish: number;
  mediaMissing: number;
}> {
  const [lessonStatus, contentQa, media] = await Promise.all([
    getLessonStatusMetrics(),
    getContentQaMetrics(),
    getMediaReadinessMetrics(),
  ]);

  return {
    totalLessons: lessonStatus.totalLessons,
    needsReview: contentQa.needsReviewCount,
    readyToPublish: contentQa.lessonsReadyToPublish,
    mediaMissing: media.mediaMissingCount,
  };
}

// ---------------------------------------------------------------------------
// Per-lesson learning analytics (Phase 5 Step 18)
// ---------------------------------------------------------------------------

export type LessonAnalyticsMetrics = {
  lessonId: string;
  title: string;
  chineseTitle: string;
  status: string;
  startedCount: number;
  completedCount: number;
  completionRate: number | null;
  learnedVocabularyCount: number;
  uniqueLearnedWords: number;
  quizAttemptCount: number;
  averageQuizPercentage: number | null;
  bestQuizPercentage: number | null;
  latestQuizAttemptAt: string | null;
  subtitleCount: number;
  vocabularyCount: number;
  quizQuestionCount: number;
  mediaStatus: string;
  qaStatus: LessonQaStatus;
};

export type LessonAnalyticsOverview = {
  totalLessons: number;
  totalStarted: number;
  totalCompleted: number;
  totalQuizAttempts: number;
  averageQuizScore: number | null;
  lessons: LessonAnalyticsMetrics[];
  warnings: string[];
  limitedByRls: boolean;
};

export type LessonQuizAnalytics = {
  attemptCount: number;
  averagePercentage: number | null;
  bestPercentage: number | null;
  latestAttemptAt: string | null;
  recentAttempts: Array<RecentQuizAttemptRow & { userIdShort: string }>;
};

export type LessonVocabularyAnalytics = {
  totalWords: number;
  learnedRows: number;
  uniqueLearnedWords: number;
};

export type LessonProgressAnalytics = {
  startedCount: number;
  completedCount: number;
  completionRate: number | null;
  recentProgress: Array<RecentLessonProgressRow & { userId: string }>;
};

export type LessonAnalyticsDetail = {
  metrics: LessonAnalyticsMetrics;
  quiz: LessonQuizAnalytics;
  vocabulary: LessonVocabularyAnalytics;
  progress: LessonProgressAnalytics;
  questionPerformance: QuestionAnalyticsRow[];
  vocabularyEngagement: VocabularyEngagementRow[];
  contentWarnings: string[];
  warnings: string[];
  limitedByRls: boolean;
  hasDetailedQuizAnswers: boolean;
};

type ProgressSnapshot = {
  lessonProgress: Array<{
    id: string;
    lesson_id: string | number;
    user_id: string | null;
    status: string;
    progress_percent: number;
    updated_at: string;
  }>;
  vocabProgress: Array<{
    vocabulary_word_id: number;
    user_id: string | null;
    status: string;
  }>;
  quizAttempts: Array<{
    id: string;
    lesson_id: string | number;
    user_id: string | null;
    score: number;
    total: number;
    percentage: number;
    answers: unknown;
    created_at: string;
  }>;
  vocabularyWords: Array<{
    id: number;
    lesson_id: string;
    chinese: string;
    pinyin: string | null;
    mongolian: string;
    hsk_level: string | null;
    order_index: number;
  }>;
  lessonTitleById: Map<string, string>;
  wordIdToLessonId: Map<number, string>;
  warnings: string[];
  limitedByRls: boolean;
};

function shortenUserId(userId: string | null | undefined): string {
  if (!userId) return "—";
  if (userId.length <= 10) return userId;
  return `${userId.slice(0, 8)}…`;
}

function averagePercentages(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
}

function completionRate(started: number, completed: number): number | null {
  if (started <= 0) return null;
  return Math.round((completed / started) * 100);
}

async function fetchProgressSnapshot(): Promise<ProgressSnapshot> {
  const empty: ProgressSnapshot = {
    lessonProgress: [],
    vocabProgress: [],
    quizAttempts: [],
    vocabularyWords: [],
    lessonTitleById: new Map(),
    wordIdToLessonId: new Map(),
    warnings: [],
    limitedByRls: false,
  };

  const client = await getServerClient();
  if (!client) {
    return {
      ...empty,
      warnings: ["Supabase not configured — learner metrics unavailable."],
      limitedByRls: true,
    };
  }

  try {
    const [lessonProgress, vocabProgress, quizAttempts, vocabWords, lessons] =
      await Promise.all([
        client
          .from("user_lesson_progress")
          .select(
            "id, lesson_id, user_id, status, progress_percent, updated_at"
          ),
        client
          .from("user_vocabulary_progress")
          .select("vocabulary_word_id, user_id, status"),
        client
          .from("user_quiz_attempts")
          .select(
            "id, lesson_id, user_id, score, total, percentage, answers, created_at"
          ),
        client
          .from("vocabulary_words")
          .select(
            "id, lesson_id, chinese, pinyin, mongolian, hsk_level, order_index"
          ),
        client.from("lessons").select("id, title"),
      ]);

    const errors = [
      lessonProgress.error,
      vocabProgress.error,
      quizAttempts.error,
      vocabWords.error,
      lessons.error,
    ].filter(Boolean);

    if (errors.length > 0) {
      const warnings = [
        "Some analytics may require admin read policies for progress tables.",
        ...errors.map((e) => e!.message),
      ];
      return { ...empty, warnings, limitedByRls: true };
    }

    const wordIdToLessonId = new Map<number, string>();
    for (const word of vocabWords.data ?? []) {
      wordIdToLessonId.set(
        Number(word.id),
        canonicalLessonId(String(word.lesson_id))
      );
    }

    const lessonTitleById = new Map<string, string>();
    for (const lesson of lessons.data ?? []) {
      lessonTitleById.set(
        canonicalLessonId(String(lesson.id)),
        String(lesson.title ?? lesson.id)
      );
    }

    const limitedByRls =
      (lessonProgress.data ?? []).length === 0 &&
      (vocabProgress.data ?? []).length === 0 &&
      (quizAttempts.data ?? []).length === 0;

    const warnings = limitedByRls
      ? [
          "Learner progress metrics may be limited by RLS (admin sees own rows only until admin read policies are added).",
        ]
      : [];

    return {
      lessonProgress: (lessonProgress.data ?? []) as ProgressSnapshot["lessonProgress"],
      vocabProgress: (vocabProgress.data ?? []) as ProgressSnapshot["vocabProgress"],
      quizAttempts: (quizAttempts.data ?? []) as ProgressSnapshot["quizAttempts"],
      vocabularyWords: (vocabWords.data ?? []) as ProgressSnapshot["vocabularyWords"],
      lessonTitleById,
      wordIdToLessonId,
      warnings,
      limitedByRls,
    };
  } catch {
    return {
      ...empty,
      warnings: [
        "Some analytics may require admin read policies for progress tables.",
      ],
      limitedByRls: true,
    };
  }
}

function rowsForLesson<T extends { lesson_id: string | number }>(
  rows: T[],
  lessonId: string
): T[] {
  return rows.filter((row) => lessonIdsMatch(row.lesson_id, lessonId));
}

function buildLessonMetricsFromReport(
  report: LessonQaReport,
  snapshot: ProgressSnapshot
): LessonAnalyticsMetrics {
  const lessonId = report.lesson.id;
  const progressRows = rowsForLesson(snapshot.lessonProgress, lessonId);
  const quizRows = rowsForLesson(snapshot.quizAttempts, lessonId);

  const startedUsers = new Set<string>();
  let completedCount = 0;

  for (const row of progressRows) {
    if (row.user_id) startedUsers.add(row.user_id);
    if (row.status === "completed") completedCount += 1;
  }

  const startedCount = startedUsers.size || progressRows.length;

  const quizPercentages = quizRows
    .map((row) => row.percentage)
    .filter((v): v is number => typeof v === "number");

  const latestQuiz = quizRows
    .slice()
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];

  const learnedWordIds = new Set<number>();
  let learnedRows = 0;

  for (const row of snapshot.vocabProgress) {
    if (row.status !== "learned") continue;
    const wordLessonId = snapshot.wordIdToLessonId.get(row.vocabulary_word_id);
    if (wordLessonId && lessonIdsMatch(wordLessonId, lessonId)) {
      learnedRows += 1;
      learnedWordIds.add(row.vocabulary_word_id);
    }
  }

  return {
    lessonId,
    title: report.lesson.title,
    chineseTitle: report.lesson.chineseTitle,
    status: getAdminPublishStatus(report.lesson),
    startedCount,
    completedCount,
    completionRate: completionRate(startedCount, completedCount),
    learnedVocabularyCount: learnedRows,
    uniqueLearnedWords: learnedWordIds.size,
    quizAttemptCount: quizRows.length,
    averageQuizPercentage: averagePercentages(quizPercentages),
    bestQuizPercentage:
      quizPercentages.length > 0 ? Math.max(...quizPercentages) : null,
    latestQuizAttemptAt: latestQuiz?.created_at ?? null,
    subtitleCount: report.subtitleCount,
    vocabularyCount: report.vocabularyActual,
    quizQuestionCount: report.quizActual,
    mediaStatus: normalizeMediaStatus(report.lesson.mediaStatus),
    qaStatus: report.qaStatus,
  };
}

export async function getLessonQuizAnalytics(
  lessonId: string,
  snapshot?: ProgressSnapshot
): Promise<LessonQuizAnalytics & { warnings: string[] }> {
  const snap = snapshot ?? (await fetchProgressSnapshot());
  const normalizedId = canonicalLessonId(lessonId);
  const quizRows = rowsForLesson(snap.quizAttempts, normalizedId);

  const percentages = quizRows
    .map((row) => row.percentage)
    .filter((v): v is number => typeof v === "number");

  const sorted = quizRows
    .slice()
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  return {
    attemptCount: quizRows.length,
    averagePercentage: averagePercentages(percentages),
    bestPercentage: percentages.length > 0 ? Math.max(...percentages) : null,
    latestAttemptAt: sorted[0]?.created_at ?? null,
    recentAttempts: sorted.slice(0, 10).map((row) => ({
      id: String(row.id),
      lessonId: canonicalLessonId(row.lesson_id),
      score: row.score ?? 0,
      total: row.total ?? 0,
      percentage: row.percentage ?? 0,
      createdAt: row.created_at ?? "",
      userIdShort: shortenUserId(row.user_id),
    })),
    warnings: snap.warnings,
  };
}

export async function getLessonVocabularyAnalytics(
  lessonId: string,
  totalWords: number,
  snapshot?: ProgressSnapshot
): Promise<LessonVocabularyAnalytics> {
  const snap = snapshot ?? (await fetchProgressSnapshot());
  const normalizedId = canonicalLessonId(lessonId);

  const learnedWordIds = new Set<number>();
  let learnedRows = 0;

  for (const row of snap.vocabProgress) {
    if (row.status !== "learned") continue;
    const wordLessonId = snap.wordIdToLessonId.get(row.vocabulary_word_id);
    if (wordLessonId && lessonIdsMatch(wordLessonId, normalizedId)) {
      learnedRows += 1;
      learnedWordIds.add(row.vocabulary_word_id);
    }
  }

  return {
    totalWords,
    learnedRows,
    uniqueLearnedWords: learnedWordIds.size,
  };
}

export async function getLessonProgressAnalytics(
  lessonId: string,
  snapshot?: ProgressSnapshot
): Promise<LessonProgressAnalytics> {
  const snap = snapshot ?? (await fetchProgressSnapshot());
  const normalizedId = canonicalLessonId(lessonId);
  const progressRows = rowsForLesson(snap.lessonProgress, normalizedId);

  const startedUsers = new Set<string>();
  let completedCount = 0;

  for (const row of progressRows) {
    if (row.user_id) startedUsers.add(row.user_id);
    if (row.status === "completed") completedCount += 1;
  }

  const startedCount = startedUsers.size || progressRows.length;

  const recentProgress = progressRows
    .slice()
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )
    .slice(0, 10)
    .map((row) => ({
      id: String(row.id),
      lessonId: canonicalLessonId(row.lesson_id),
      status: String(row.status ?? "unknown"),
      progressPercent: row.progress_percent ?? 0,
      updatedAt: row.updated_at ?? "",
      userId: shortenUserId(row.user_id),
    }));

  return {
    startedCount,
    completedCount,
    completionRate: completionRate(startedCount, completedCount),
    recentProgress,
  };
}

export async function getLessonAnalyticsOverview(): Promise<LessonAnalyticsOverview> {
  const [reports, snapshot] = await Promise.all([
    getHsk5LessonsWithQa(),
    fetchProgressSnapshot(),
  ]);

  const lessons = reports.map((report) =>
    buildLessonMetricsFromReport(report, snapshot)
  );

  let totalStarted = 0;
  let totalCompleted = 0;
  let totalQuizAttempts = 0;
  const allQuizPercentages: number[] = [];

  for (const lesson of lessons) {
    totalStarted += lesson.startedCount;
    totalCompleted += lesson.completedCount;
    totalQuizAttempts += lesson.quizAttemptCount;
    if (lesson.averageQuizPercentage != null) {
      allQuizPercentages.push(lesson.averageQuizPercentage);
    }
  }

  return {
    totalLessons: lessons.length,
    totalStarted,
    totalCompleted,
    totalQuizAttempts,
    averageQuizScore: averagePercentages(allQuizPercentages),
    lessons: lessons.sort(
      (a, b) => Number(a.lessonId) - Number(b.lessonId)
    ),
    warnings: snapshot.warnings,
    limitedByRls: snapshot.limitedByRls,
  };
}

export async function getLessonAnalyticsById(
  lessonId: string
): Promise<LessonAnalyticsDetail | null> {
  const normalizedId = canonicalLessonId(lessonId);
  const [reports, snapshot] = await Promise.all([
    getHsk5LessonsWithQa(),
    fetchProgressSnapshot(),
  ]);

  const report = reports.find((r) =>
    lessonIdsMatch(r.lesson.id, normalizedId)
  );
  if (!report) {
    return null;
  }

  const metrics = buildLessonMetricsFromReport(report, snapshot);
  const quiz = await getLessonQuizAnalytics(normalizedId, snapshot);
  const vocabulary = await getLessonVocabularyAnalytics(
    normalizedId,
    metrics.vocabularyCount,
    snapshot
  );
  const progress = await getLessonProgressAnalytics(normalizedId, snapshot);
  const questionPerformance = getQuestionLevelAnalyticsByLesson(
    normalizedId,
    snapshot
  );
  const vocabularyEngagement = getVocabularyEngagementByLesson(
    normalizedId,
    snapshot
  );
  const hasDetailedQuizAnswers = snapshot.quizAttempts.some((row) =>
    lessonIdsMatch(row.lesson_id, normalizedId)
      ? parseQuizAttemptAnswers(row.answers).length > 0
      : false
  );

  const detailWarnings = [...new Set([...snapshot.warnings, ...quiz.warnings])];
  if (!hasDetailedQuizAnswers && quiz.attemptCount > 0) {
    detailWarnings.push(
      "Older quiz attempts may not include detailed answer data."
    );
  }

  return {
    metrics,
    quiz: {
      attemptCount: quiz.attemptCount,
      averagePercentage: quiz.averagePercentage,
      bestPercentage: quiz.bestPercentage,
      latestAttemptAt: quiz.latestAttemptAt,
      recentAttempts: quiz.recentAttempts,
    },
    vocabulary,
    progress,
    questionPerformance,
    vocabularyEngagement,
    contentWarnings: report.warnings,
    warnings: detailWarnings,
    limitedByRls: snapshot.limitedByRls,
    hasDetailedQuizAnswers,
  };
}

export { shortenUserId as shortenUserIdForDisplay };

// ---------------------------------------------------------------------------
// Question-level & vocabulary engagement analytics (Phase 5 Step 19)
// ---------------------------------------------------------------------------

export type QuestionAnalyticsRow = {
  lessonId: string;
  lessonTitle: string;
  questionKey: string;
  questionId?: string | number;
  orderIndex: number;
  question: string;
  type: string;
  correctAnswer: string;
  attemptsCount: number;
  correctCount: number;
  wrongCount: number;
  accuracyPercent: number | null;
  mostCommonWrongAnswers: string[];
  needsReview: boolean;
};

export type VocabularyEngagementLevel = "high" | "medium" | "low" | "none";

export type VocabularyEngagementRow = {
  vocabularyWordId: number;
  lessonId: string;
  lessonTitle: string;
  chinese: string;
  pinyin: string;
  mongolian: string;
  hskLevel: string;
  learnedCount: number;
  uniqueLearnersCount: number;
  engagement: VocabularyEngagementLevel;
};

export type QuestionInsightsOverview = {
  totalQuizAttempts: number;
  totalAnsweredQuestions: number;
  averageQuestionAccuracy: number | null;
  difficultQuestionsCount: number;
  questions: QuestionAnalyticsRow[];
  hasDetailedAnswers: boolean;
  warnings: string[];
  limitedByRls: boolean;
};

export type VocabularyInsightsOverview = {
  totalVocabularyWords: number;
  learnedRows: number;
  uniqueLearnedWords: number;
  wordsNeverLearned: number;
  words: VocabularyEngagementRow[];
  warnings: string[];
  limitedByRls: boolean;
};

export type AnalyticsQuickSummary = {
  difficultQuestionsCount: number;
  wordsNeverLearnedCount: number;
};

const DIFFICULT_QUESTION_ACCURACY_THRESHOLD = 70;

type QuestionAggregate = {
  lessonId: string;
  questionKey: string;
  questionId?: string | number;
  orderIndex: number;
  question: string;
  type: string;
  correctAnswer: string;
  attemptsCount: number;
  correctCount: number;
  wrongAnswers: string[];
};

function lessonTitleFor(
  snapshot: ProgressSnapshot,
  lessonId: string
): string {
  return snapshot.lessonTitleById.get(canonicalLessonId(lessonId)) ?? lessonId;
}

function aggregateQuestionRows(
  snapshot: ProgressSnapshot,
  lessonFilter?: string
): QuestionAnalyticsRow[] {
  const aggregates = new Map<string, QuestionAggregate>();

  for (const attempt of snapshot.quizAttempts) {
    const lessonId = canonicalLessonId(attempt.lesson_id);
    if (lessonFilter && !lessonIdsMatch(lessonId, lessonFilter)) continue;

    const answers = parseQuizAttemptAnswers(attempt.answers);
    for (const answer of answers) {
      const key = `${lessonId}::${questionAnalyticsKey(answer)}`;
      const existing = aggregates.get(key);
      if (!existing) {
        aggregates.set(key, {
          lessonId,
          questionKey: questionAnalyticsKey(answer),
          questionId: answer.questionId ?? answer.dbId,
          orderIndex: answer.orderIndex,
          question: answer.question,
          type: String(answer.type),
          correctAnswer: answer.correctAnswer,
          attemptsCount: 1,
          correctCount: answer.isCorrect ? 1 : 0,
          wrongAnswers: answer.isCorrect ? [] : [answer.selectedAnswer],
        });
        continue;
      }

      existing.attemptsCount += 1;
      if (answer.isCorrect) {
        existing.correctCount += 1;
      } else {
        existing.wrongAnswers.push(answer.selectedAnswer);
      }
    }
  }

  return [...aggregates.values()]
    .map((row) => {
      const wrongCount = row.attemptsCount - row.correctCount;
      const accuracyPercent =
        row.attemptsCount > 0
          ? Math.round((row.correctCount / row.attemptsCount) * 100)
          : null;
      const wrongFrequency = new Map<string, number>();
      for (const wrong of row.wrongAnswers) {
        wrongFrequency.set(wrong, (wrongFrequency.get(wrong) ?? 0) + 1);
      }
      const mostCommonWrongAnswers = [...wrongFrequency.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([answer]) => answer);

      return {
        lessonId: row.lessonId,
        lessonTitle: lessonTitleFor(snapshot, row.lessonId),
        questionKey: row.questionKey,
        questionId: row.questionId,
        orderIndex: row.orderIndex,
        question: row.question,
        type: row.type,
        correctAnswer: row.correctAnswer,
        attemptsCount: row.attemptsCount,
        correctCount: row.correctCount,
        wrongCount,
        accuracyPercent,
        mostCommonWrongAnswers,
        needsReview:
          row.attemptsCount >= 1 &&
          accuracyPercent != null &&
          accuracyPercent < DIFFICULT_QUESTION_ACCURACY_THRESHOLD,
      };
    })
    .sort((a, b) => {
      const lessonCmp = Number(a.lessonId) - Number(b.lessonId);
      if (lessonCmp !== 0) return lessonCmp;
      return a.orderIndex - b.orderIndex;
    });
}

function vocabularyEngagementLevel(
  learnedCount: number
): VocabularyEngagementLevel {
  if (learnedCount <= 0) return "none";
  if (learnedCount <= 2) return "low";
  if (learnedCount <= 5) return "medium";
  return "high";
}

function buildVocabularyEngagementRows(
  snapshot: ProgressSnapshot,
  lessonFilter?: string
): VocabularyEngagementRow[] {
  const learnedByWord = new Map<number, { count: number; users: Set<string> }>();

  for (const row of snapshot.vocabProgress) {
    if (row.status !== "learned") continue;
    const current = learnedByWord.get(row.vocabulary_word_id) ?? {
      count: 0,
      users: new Set<string>(),
    };
    current.count += 1;
    if (row.user_id) current.users.add(row.user_id);
    learnedByWord.set(row.vocabulary_word_id, current);
  }

  return snapshot.vocabularyWords
    .filter((word) => {
      const lessonId = canonicalLessonId(word.lesson_id);
      return !lessonFilter || lessonIdsMatch(lessonId, lessonFilter);
    })
    .map((word) => {
      const lessonId = canonicalLessonId(word.lesson_id);
      const stats = learnedByWord.get(Number(word.id));
      const learnedCount = stats?.count ?? 0;
      return {
        vocabularyWordId: Number(word.id),
        lessonId,
        lessonTitle: lessonTitleFor(snapshot, lessonId),
        chinese: word.chinese,
        pinyin: word.pinyin ?? "",
        mongolian: word.mongolian,
        hskLevel: word.hsk_level ?? "",
        learnedCount,
        uniqueLearnersCount: stats?.users.size ?? 0,
        engagement: vocabularyEngagementLevel(learnedCount),
      };
    })
    .sort((a, b) => {
      const lessonCmp = Number(a.lessonId) - Number(b.lessonId);
      if (lessonCmp !== 0) return lessonCmp;
      return a.chinese.localeCompare(b.chinese);
    });
}

export async function getQuestionLevelAnalytics(): Promise<QuestionAnalyticsRow[]> {
  const snapshot = await fetchProgressSnapshot();
  return aggregateQuestionRows(snapshot);
}

export function getQuestionLevelAnalyticsByLesson(
  lessonId: string,
  snapshot: ProgressSnapshot
): QuestionAnalyticsRow[] {
  return aggregateQuestionRows(snapshot, canonicalLessonId(lessonId));
}

export async function getDifficultQuestions(
  limit: number
): Promise<QuestionAnalyticsRow[]> {
  const snapshot = await fetchProgressSnapshot();
  return aggregateQuestionRows(snapshot)
    .filter((row) => row.needsReview)
    .sort((a, b) => (a.accuracyPercent ?? 100) - (b.accuracyPercent ?? 100))
    .slice(0, limit);
}

export async function getVocabularyEngagementAnalytics(): Promise<
  VocabularyEngagementRow[]
> {
  const snapshot = await fetchProgressSnapshot();
  return buildVocabularyEngagementRows(snapshot);
}

export function getVocabularyEngagementByLesson(
  lessonId: string,
  snapshot: ProgressSnapshot
): VocabularyEngagementRow[] {
  return buildVocabularyEngagementRows(snapshot, canonicalLessonId(lessonId));
}

export async function getMostLearnedVocabulary(
  limit: number
): Promise<VocabularyEngagementRow[]> {
  const snapshot = await fetchProgressSnapshot();
  return buildVocabularyEngagementRows(snapshot)
    .filter((row) => row.learnedCount > 0)
    .sort((a, b) => b.learnedCount - a.learnedCount)
    .slice(0, limit);
}

export async function getLeastLearnedVocabulary(
  limit: number
): Promise<VocabularyEngagementRow[]> {
  const snapshot = await fetchProgressSnapshot();
  return buildVocabularyEngagementRows(snapshot)
    .sort((a, b) => a.learnedCount - b.learnedCount)
    .slice(0, limit);
}

export async function getQuestionInsightsOverview(): Promise<QuestionInsightsOverview> {
  const snapshot = await fetchProgressSnapshot();
  const questions = aggregateQuestionRows(snapshot);
  const hasDetailedAnswers = snapshot.quizAttempts.some(
    (row) => parseQuizAttemptAnswers(row.answers).length > 0
  );

  let totalAnsweredQuestions = 0;
  let totalCorrect = 0;
  for (const row of questions) {
    totalAnsweredQuestions += row.attemptsCount;
    totalCorrect += row.correctCount;
  }

  const warnings = [...snapshot.warnings];
  if (!hasDetailedAnswers && snapshot.quizAttempts.length > 0) {
    warnings.push(
      "Older quiz attempts may not include detailed answer data."
    );
  }

  return {
    totalQuizAttempts: snapshot.quizAttempts.length,
    totalAnsweredQuestions,
    averageQuestionAccuracy:
      totalAnsweredQuestions > 0
        ? Math.round((totalCorrect / totalAnsweredQuestions) * 100)
        : null,
    difficultQuestionsCount: questions.filter((q) => q.needsReview).length,
    questions,
    hasDetailedAnswers,
    warnings: [...new Set(warnings)],
    limitedByRls: snapshot.limitedByRls,
  };
}

export async function getVocabularyInsightsOverview(): Promise<VocabularyInsightsOverview> {
  const snapshot = await fetchProgressSnapshot();
  const words = buildVocabularyEngagementRows(snapshot);

  const learnedRows = snapshot.vocabProgress.filter(
    (row) => row.status === "learned"
  ).length;
  const uniqueLearnedWords = new Set(
    learnedRows > 0
      ? snapshot.vocabProgress
          .filter((row) => row.status === "learned")
          .map((row) => row.vocabulary_word_id)
      : []
  ).size;

  return {
    totalVocabularyWords: words.length,
    learnedRows,
    uniqueLearnedWords,
    wordsNeverLearned: words.filter((w) => w.learnedCount === 0).length,
    words,
    warnings: snapshot.warnings,
    limitedByRls: snapshot.limitedByRls,
  };
}

export async function getAnalyticsQuickSummary(): Promise<AnalyticsQuickSummary> {
  const snapshot = await fetchProgressSnapshot();
  const questions = aggregateQuestionRows(snapshot);
  const words = buildVocabularyEngagementRows(snapshot);
  return {
    difficultQuestionsCount: questions.filter((q) => q.needsReview).length,
    wordsNeverLearnedCount: words.filter((w) => w.learnedCount === 0).length,
  };
}
