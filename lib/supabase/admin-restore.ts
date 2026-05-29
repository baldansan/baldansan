import type { AdminContentStatus } from "@/lib/admin/lesson-status";
import type { LessonExportLessonMeta } from "@/lib/supabase/admin-export";
import {
  bulkImportLessonContent,
  parseAndValidateLessonImport,
  type BulkImportMode,
  type ImportValidationResult,
  type LessonImportPayload,
} from "@/lib/supabase/admin-import";
import { isCurrentUserAdmin } from "@/lib/supabase/admin";
import {
  refreshLessonCounts,
  getLessonCompleteness,
  updateLessonMetadata,
  type AdminContentResult,
} from "@/lib/supabase/admin-content";
import { hasSupabaseConfig } from "@/lib/supabase/client";
import {
  ADMIN_ACTIVITY_ACTIONS,
  buildShallowDiffSummary,
  logAdminActivityFireAndForget,
} from "@/lib/supabase/admin-activity";

export type AdminRestoreResult<T> = {
  data: T | null;
  error: string | null;
};

export type LessonBackupSummary = {
  sourceLessonId: string | null;
  title: string | null;
  subtitleCount: number;
  vocabularyCount: number;
  quizCount: number;
  exportedAt: string | null;
};

export type LessonBackupPreview = {
  summary: LessonBackupSummary;
  validation: ImportValidationResult;
  lessonMeta: LessonExportLessonMeta | null;
};

export type RestoreLessonBackupOptions = {
  mode: BulkImportMode;
  /** When true, apply title/description/etc. from backup `lesson` block (never changes lesson id). */
  restoreMetadata: boolean;
  /** Current lesson order_index on edit page. */
  currentOrderIndex: number;
};

const NOT_CONFIGURED_MESSAGE =
  "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.";

function notConfigured<T>(): AdminRestoreResult<T> {
  return { data: null, error: NOT_CONFIGURED_MESSAGE };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function num(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function parseLessonMetaFromRaw(
  raw: Record<string, unknown>
): LessonExportLessonMeta | null {
  const lessonRaw = raw.lesson;
  if (!isRecord(lessonRaw)) return null;

  const id = str(lessonRaw.id);
  const courseId = str(lessonRaw.courseId ?? lessonRaw.course_id);
  const title = str(lessonRaw.title);
  const chineseTitle = str(
    lessonRaw.chineseTitle ?? lessonRaw.chinese_title
  );
  const orderIndex = num(lessonRaw.orderIndex ?? lessonRaw.order_index);

  if (!id && !title) return null;

  return {
    id,
    courseId,
    title,
    chineseTitle,
    subtitle: str(lessonRaw.subtitle),
    description: str(lessonRaw.description),
    duration: str(lessonRaw.duration),
    status: str(lessonRaw.status) || "draft",
    orderIndex: orderIndex ?? 1,
  };
}

export function parseLessonBackupPreview(rawText: string): LessonBackupPreview & {
  parseError?: string;
} {
  const parsed = parseAndValidateLessonImport(rawText);
  if (parsed.parseError) {
    return {
      summary: {
        sourceLessonId: null,
        title: null,
        subtitleCount: 0,
        vocabularyCount: 0,
        quizCount: 0,
        exportedAt: null,
      },
      validation: {
        valid: false,
        errors: parsed.errors,
        warnings: parsed.warnings,
        payload: parsed.payload,
        counts: parsed.counts,
      },
      lessonMeta: null,
      parseError: parsed.parseError,
    };
  }

  let lessonMeta: LessonExportLessonMeta | null = null;
  let exportedAt: string | null = null;

  try {
    const root = JSON.parse(rawText.trim()) as unknown;
    if (isRecord(root)) {
      lessonMeta = parseLessonMetaFromRaw(root);
      const at = root.exportedAt;
      if (typeof at === "string" && at.trim()) {
        exportedAt = at.trim();
      }
    }
  } catch {
    // parseAndValidateLessonImport already validated JSON
  }

  return {
    summary: {
      sourceLessonId: lessonMeta?.id ?? null,
      title: lessonMeta?.title ?? null,
      subtitleCount: parsed.counts.subtitles,
      vocabularyCount: parsed.counts.vocabulary,
      quizCount: parsed.counts.quizQuestions,
      exportedAt,
    },
    validation: {
      valid: parsed.valid,
      errors: parsed.errors,
      warnings: parsed.warnings,
      payload: parsed.payload,
      counts: parsed.counts,
    },
    lessonMeta,
  };
}

async function requireAdmin(): Promise<AdminRestoreResult<true>> {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    return { data: null, error: "Admin эрх шаардлагатай." };
  }
  return { data: true, error: null };
}

function mapMetaToMetadataUpdate(
  meta: LessonExportLessonMeta,
  payload: LessonImportPayload,
  currentOrderIndex: number
): {
  title: string;
  chineseTitle: string;
  subtitle?: string;
  description?: string;
  duration?: string;
  status: AdminContentStatus;
  orderIndex: number;
  vocabularyCount: number;
  quizCount: number;
} {
  const status: AdminContentStatus =
    meta.status === "available" ||
    meta.status === "archived" ||
    meta.status === "draft"
      ? meta.status
      : "draft";

  return {
    title: meta.title,
    chineseTitle: meta.chineseTitle,
    subtitle: meta.subtitle,
    description: meta.description,
    duration: meta.duration,
    status: meta.status === "available" ? "draft" : status,
    orderIndex: currentOrderIndex,
    vocabularyCount: payload.vocabulary.length,
    quizCount: payload.quizQuestions.length,
  };
}

export async function restoreLessonFromBackup(
  lessonId: string,
  rawText: string,
  options: RestoreLessonBackupOptions
): Promise<
  AdminRestoreResult<{
    mode: BulkImportMode;
    restoreMetadata: boolean;
    subtitlesInserted: number;
    vocabularyInserted: number;
    quizQuestionsInserted: number;
  }>
> {
  if (!hasSupabaseConfig) {
    return notConfigured();
  }

  const gate = await requireAdmin();
  if (gate.error) {
    return { data: null, error: gate.error };
  }

  const preview = parseLessonBackupPreview(rawText);
  if (!preview.validation.valid) {
    return {
      data: null,
      error: preview.validation.errors.join(" ") || "Backup JSON буруу байна.",
    };
  }

  const payload = preview.validation.payload;
  if (
    payload.subtitles.length === 0 &&
    payload.vocabulary.length === 0 &&
    payload.quizQuestions.length === 0
  ) {
    return {
      data: null,
      error: "Backup-д restore хийх контент байхгүй.",
    };
  }

  const beforeCompleteness = await getLessonCompleteness(lessonId);
  const beforeSnapshot = beforeCompleteness.data
    ? {
        subtitleCount: beforeCompleteness.data.subtitleCount,
        vocabularyCount: beforeCompleteness.data.vocabularyCount,
        quizCount: beforeCompleteness.data.quizCount,
      }
    : undefined;

  if (options.restoreMetadata && preview.lessonMeta) {
    const metaUpdate = mapMetaToMetadataUpdate(
      preview.lessonMeta,
      payload,
      options.currentOrderIndex
    );
    const updated = await updateLessonMetadata(lessonId, metaUpdate);
    if (updated.error) {
      return { data: null, error: updated.error };
    }
  }

  const imported = await bulkImportLessonContent(lessonId, payload, {
    mode: options.mode,
  });

  if (imported.error) {
    return { data: null, error: imported.error };
  }

  await refreshLessonCounts(lessonId);

  const summary = imported.data;
  const afterCompleteness = await getLessonCompleteness(lessonId);
  const afterSnapshot = afterCompleteness.data
    ? {
        subtitleCount: afterCompleteness.data.subtitleCount,
        vocabularyCount: afterCompleteness.data.vocabularyCount,
        quizCount: afterCompleteness.data.quizCount,
      }
    : {
        subtitleCount: summary?.subtitlesInserted ?? payload.subtitles.length,
        vocabularyCount: summary?.vocabularyInserted ?? payload.vocabulary.length,
        quizCount: summary?.quizQuestionsInserted ?? payload.quizQuestions.length,
      };

  logAdminActivityFireAndForget({
    action: ADMIN_ACTIVITY_ACTIONS.backupRestored,
    entityType: "lesson",
    entityId: lessonId,
    lessonId,
    title: `Backup restored for lesson ${lessonId}`,
    metadata: {
      mode: options.mode,
      restoreMetadata: options.restoreMetadata,
      subtitlesInserted: summary?.subtitlesInserted ?? payload.subtitles.length,
      vocabularyInserted: summary?.vocabularyInserted ?? payload.vocabulary.length,
      quizQuestionsInserted:
        summary?.quizQuestionsInserted ?? payload.quizQuestions.length,
    },
    beforeSnapshot,
    afterSnapshot,
    diffSummary: {
      mode: options.mode,
      restoreMetadata: options.restoreMetadata,
      ...buildShallowDiffSummary(beforeSnapshot, afterSnapshot),
    },
  });
  return {
    data: {
      mode: options.mode,
      restoreMetadata: options.restoreMetadata,
      subtitlesInserted: summary?.subtitlesInserted ?? payload.subtitles.length,
      vocabularyInserted:
        summary?.vocabularyInserted ?? payload.vocabulary.length,
      quizQuestionsInserted:
        summary?.quizQuestionsInserted ?? payload.quizQuestions.length,
    },
    error: null,
  };
}
