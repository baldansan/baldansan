import { activityRollbackAvailable } from "@/lib/admin/admin-rollback-eligibility";
import type {
  AdminActivityRow,
  AdminActivitySummary,
} from "@/lib/admin/admin-activity-shared";

const LESSON_ACTIONS = new Set([
  "lesson_created",
  "lesson_metadata_updated",
  "lesson_status_changed",
  "lesson_published",
  "lesson_unpublished",
  "lesson_archived",
  "lesson_duplicated",
]);

const CONTENT_ACTIONS = new Set([
  "lesson_metadata_updated",
  "media_updated",
  "media_cleared",
  "subtitle_created",
  "subtitle_deleted",
  "vocabulary_created",
  "vocabulary_deleted",
  "quiz_created",
  "quiz_deleted",
  "bulk_import_completed",
  "backup_exported",
  "backup_restored",
]);

const PUBLISH_ACTIONS = new Set([
  "lesson_published",
  "lesson_unpublished",
  "lesson_archived",
  "release_status_updated",
  "qa_status_updated",
  "lesson_approved",
  "release_notes_updated",
]);

const TASK_ACTIONS = new Set([
  "task_started",
  "task_resolved",
  "task_dismissed",
  "task_updated",
]);

function startOfTodayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function summarizeActivityRows(
  rows: AdminActivityRow[]
): AdminActivitySummary {
  const todayStart = startOfTodayIso();
  let today = 0;
  let lessonActions = 0;
  let contentActions = 0;
  let publishReleaseActions = 0;
  let taskActions = 0;
  let rollbackAvailable = 0;

  for (const row of rows) {
    if (row.createdAt >= todayStart) today += 1;
    if (LESSON_ACTIONS.has(row.action)) lessonActions += 1;
    if (CONTENT_ACTIONS.has(row.action)) contentActions += 1;
    if (PUBLISH_ACTIONS.has(row.action)) publishReleaseActions += 1;
    if (TASK_ACTIONS.has(row.action)) taskActions += 1;
    if (activityRollbackAvailable(row)) rollbackAvailable += 1;
  }

  return {
    total: rows.length,
    today,
    lessonActions,
    contentActions,
    publishReleaseActions,
    taskActions,
    rollbackAvailable,
  };
}

export {
  LESSON_ACTIONS,
  CONTENT_ACTIONS,
  PUBLISH_ACTIONS,
  TASK_ACTIONS,
};
