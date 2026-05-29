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
} as const;

export { getActivityDiff, buildShallowDiffSummary };
export type { ActivityDiffResult };

/** Best-effort audit log — never throws; does not block caller. */
export async function logAdminActivity(
  input: AdminActivityInput
): Promise<void> {
  try {
    if (!supabase || !hasSupabaseConfig) return;

    const { data: user } = await getCurrentUser();

    const diffSummary =
      input.diffSummary ??
      (input.beforeSnapshot || input.afterSnapshot
        ? buildShallowDiffSummary(input.beforeSnapshot, input.afterSnapshot)
        : {});

    const { error } = await supabase.from("admin_activity_log").insert({
      actor_user_id: user?.id ?? null,
      actor_email: user?.email ?? null,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      lesson_id: input.lessonId ?? null,
      title: input.title,
      description: input.description ?? null,
      metadata: input.metadata ?? {},
      before_snapshot: input.beforeSnapshot ?? null,
      after_snapshot: input.afterSnapshot ?? null,
      diff_summary: diffSummary,
    });

    if (error) {
      console.warn("[admin-activity] Log insert failed:", error.message);
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
