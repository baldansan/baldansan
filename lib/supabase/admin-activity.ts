import {
  mapActivityLogRow,
  type AdminActivityRow,
} from "@/lib/admin/admin-activity-shared";
import {
  buildShallowDiffSummary,
  getActivityDiff,
  type ActivityDiffResult,
} from "@/lib/admin/admin-activity-diff";
import { getCurrentUser } from "@/lib/supabase/auth";
import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";

export type AdminActivityInput = {
  action: string;
  entityType: string;
  entityId?: string;
  lessonId?: string;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  beforeSnapshot?: Record<string, unknown>;
  afterSnapshot?: Record<string, unknown>;
  diffSummary?: Record<string, unknown>;
};

export const ADMIN_ACTIVITY_ACTIONS = {
  lessonCreated: "lesson_created",
  lessonMetadataUpdated: "lesson_metadata_updated",
  lessonStatusChanged: "lesson_status_changed",
  lessonPublished: "lesson_published",
  lessonUnpublished: "lesson_unpublished",
  lessonArchived: "lesson_archived",
  lessonDeleted: "lesson_deleted",
  subtitleCreated: "subtitle_created",
  subtitleDeleted: "subtitle_deleted",
  vocabularyCreated: "vocabulary_created",
  vocabularyDeleted: "vocabulary_deleted",
  quizCreated: "quiz_created",
  quizDeleted: "quiz_deleted",
  bulkImportCompleted: "bulk_import_completed",
  backupExported: "backup_exported",
  lessonDuplicated: "lesson_duplicated",
  backupRestored: "backup_restored",
  mediaUploaded: "media_uploaded",
  mediaUpdated: "media_updated",
  mediaCleared: "media_cleared",
  taskStarted: "task_started",
  taskResolved: "task_resolved",
  taskDismissed: "task_dismissed",
  taskUpdated: "task_updated",
  releaseStatusUpdated: "release_status_updated",
  qaStatusUpdated: "qa_status_updated",
  lessonApproved: "lesson_approved",
  releaseNotesUpdated: "release_notes_updated",
  rollbackExecuted: "rollback_executed",
} as const;

export { getActivityDiff, buildShallowDiffSummary };
export type { ActivityDiffResult };

type ActivityActor = {
  id: string | null;
  email: string | null;
};

type ActivityLogInsertRow = {
  actor_user_id: string | null;
  actor_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  lesson_id: string | null;
  title: string;
  description: string | null;
  metadata: Record<string, unknown>;
  before_snapshot?: Record<string, unknown> | null;
  after_snapshot?: Record<string, unknown> | null;
  diff_summary?: Record<string, unknown>;
};

async function resolveActivityActor(): Promise<ActivityActor> {
  if (!supabase) {
    return { id: null, email: null };
  }

  const { data: user } = await getCurrentUser();
  if (user?.id) {
    return { id: user.id, email: user.email ?? null };
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const sessionUser = sessionData.session?.user;
  if (sessionUser?.id) {
    return { id: sessionUser.id, email: sessionUser.email ?? null };
  }

  const { data: userData } = await supabase.auth.getUser();
  if (userData.user?.id) {
    return { id: userData.user.id, email: userData.user.email ?? null };
  }

  return { id: null, email: null };
}

function buildCoreInsertRow(
  input: AdminActivityInput,
  actor: ActivityActor
): ActivityLogInsertRow {
  return {
    actor_user_id: actor.id,
    actor_email: actor.email,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    lesson_id: input.lessonId ?? null,
    title: input.title,
    description: input.description ?? null,
    metadata: input.metadata ?? {},
  };
}

function isSnapshotColumnError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("before_snapshot") ||
    lower.includes("after_snapshot") ||
    lower.includes("diff_summary") ||
    (lower.includes("column") && lower.includes("does not exist"))
  );
}

function isRlsError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("row-level security") ||
    lower.includes("policy") ||
    lower.includes("42501")
  );
}

function formatInsertError(message: string): string {
  if (isRlsError(message)) {
    return `${message} — confirm admin_profiles row and migration 007 RLS policies.`;
  }
  if (isSnapshotColumnError(message)) {
    return `${message} — run migration 008 or use metadata fallback.`;
  }
  return message;
}

async function insertActivityLogRow(
  row: ActivityLogInsertRow
): Promise<string | null> {
  if (!supabase) return "Supabase client unavailable.";

  const { error } = await supabase.from("admin_activity_log").insert(row);
  return error?.message ?? null;
}

/** Best-effort audit log — never throws; does not block caller. */
export async function logAdminActivity(
  input: AdminActivityInput
): Promise<void> {
  try {
    if (!supabase || !hasSupabaseConfig) return;

    const actor = await resolveActivityActor();
    if (!actor.id) {
      console.warn(
        "[admin-activity] No authenticated user for log insert:",
        input.action
      );
    }

    const diffSummary =
      input.diffSummary ??
      (input.beforeSnapshot || input.afterSnapshot
        ? buildShallowDiffSummary(input.beforeSnapshot, input.afterSnapshot)
        : {});

    const coreRow = buildCoreInsertRow(input, actor);
    const rowWithSnapshots: ActivityLogInsertRow = {
      ...coreRow,
      before_snapshot: input.beforeSnapshot ?? null,
      after_snapshot: input.afterSnapshot ?? null,
      diff_summary: diffSummary,
    };

    let errorMessage = await insertActivityLogRow(rowWithSnapshots);

    if (errorMessage && isSnapshotColumnError(errorMessage)) {
      const fallbackRow: ActivityLogInsertRow = {
        ...coreRow,
        metadata: {
          ...(input.metadata ?? {}),
          beforeSnapshot: input.beforeSnapshot ?? null,
          afterSnapshot: input.afterSnapshot ?? null,
          diffSummary,
        },
      };
      errorMessage = await insertActivityLogRow(fallbackRow);
    }

    if (errorMessage) {
      console.warn(
        "[admin-activity] Log insert failed:",
        formatInsertError(errorMessage),
        { action: input.action, entityType: input.entityType }
      );
    }
  } catch (err) {
    console.warn("[admin-activity] Log insert error:", err);
  }
}

export function logAdminActivityFireAndForget(input: AdminActivityInput): void {
  void logAdminActivity(input);
}

export async function getAdminActivityById(
  id: string
): Promise<AdminActivityRow | null> {
  try {
    if (!supabase || !hasSupabaseConfig) return null;

    const { data, error } = await supabase
      .from("admin_activity_log")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;
    return mapActivityLogRow(data as Record<string, unknown>);
  } catch {
    return null;
  }
}

export function publishActionForStatus(
  status: string
): (typeof ADMIN_ACTIVITY_ACTIONS)[keyof typeof ADMIN_ACTIVITY_ACTIONS] {
  if (status === "available") return ADMIN_ACTIVITY_ACTIONS.lessonPublished;
  if (status === "archived") return ADMIN_ACTIVITY_ACTIONS.lessonArchived;
  if (status === "draft") return ADMIN_ACTIVITY_ACTIONS.lessonUnpublished;
  return ADMIN_ACTIVITY_ACTIONS.lessonStatusChanged;
}
