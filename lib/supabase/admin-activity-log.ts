import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/client";
import type {
  AdminActivityLogOptions,
  AdminActivityRow,
  AdminActivitySummary,
} from "@/lib/admin/admin-activity-shared";
import { formatActivityActor } from "@/lib/admin/admin-activity-shared";

export type {
  AdminActivityRow,
  AdminActivitySummary,
  AdminActivityLogOptions,
} from "@/lib/admin/admin-activity-shared";

export { formatActivityActor };

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

function mapRow(row: Record<string, unknown>): AdminActivityRow {
  return {
    id: String(row.id),
    actorUserId: row.actor_user_id ? String(row.actor_user_id) : null,
    actorEmail: row.actor_email ? String(row.actor_email) : null,
    action: String(row.action),
    entityType: String(row.entity_type),
    entityId: row.entity_id ? String(row.entity_id) : null,
    lessonId: row.lesson_id ? String(row.lesson_id) : null,
    title: String(row.title),
    description: row.description ? String(row.description) : null,
    metadata:
      row.metadata && typeof row.metadata === "object"
        ? (row.metadata as Record<string, unknown>)
        : {},
    createdAt: String(row.created_at),
  };
}

function startOfTodayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function matchesSearch(row: AdminActivityRow, query: string): boolean {
  const haystack = [
    row.title,
    row.description ?? "",
    row.action,
    row.entityType,
    row.lessonId ?? "",
    row.actorEmail ?? "",
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

function summarizeRows(rows: AdminActivityRow[]): AdminActivitySummary {
  const todayStart = startOfTodayIso();
  let today = 0;
  let lessonActions = 0;
  let contentActions = 0;
  let publishReleaseActions = 0;
  let taskActions = 0;

  for (const row of rows) {
    if (row.createdAt >= todayStart) today += 1;
    if (LESSON_ACTIONS.has(row.action)) lessonActions += 1;
    if (CONTENT_ACTIONS.has(row.action)) contentActions += 1;
    if (PUBLISH_ACTIONS.has(row.action)) publishReleaseActions += 1;
    if (TASK_ACTIONS.has(row.action)) taskActions += 1;
  }

  return {
    total: rows.length,
    today,
    lessonActions,
    contentActions,
    publishReleaseActions,
    taskActions,
  };
}

async function fetchActivityRows(
  options: AdminActivityLogOptions = {}
): Promise<{ rows: AdminActivityRow[]; warnings: string[] }> {
  if (!hasSupabaseConfig) {
    return { rows: [], warnings: ["Supabase not configured."] };
  }

  const client = await createServerSupabaseClient();
  if (!client) {
    return { rows: [], warnings: ["Supabase client unavailable."] };
  }

  try {
    let query = client
      .from("admin_activity_log")
      .select("*")
      .order("created_at", { ascending: false });

    const limit = options.limit ?? 200;
    query = query.limit(limit);

    if (options.action) query = query.eq("action", options.action);
    if (options.entityType) query = query.eq("entity_type", options.entityType);
    if (options.lessonId) query = query.eq("lesson_id", options.lessonId);
    if (options.actorUserId) {
      query = query.eq("actor_user_id", options.actorUserId);
    }

    if (options.dateRange === "today") {
      query = query.gte("created_at", startOfTodayIso());
    } else if (options.dateRange === "7d") {
      query = query.gte("created_at", daysAgoIso(7));
    } else if (options.dateRange === "30d") {
      query = query.gte("created_at", daysAgoIso(30));
    }

    const { data, error } = await query;

    if (error) {
      const message = error.message ?? "";
      if (message.includes("admin_activity_log") || message.includes("does not exist")) {
        return {
          rows: [],
          warnings: [
            "Run supabase/migrations/007_admin_activity_log.sql for activity log.",
          ],
        };
      }
      return { rows: [], warnings: [`Activity log error: ${message}`] };
    }

    let rows = (data ?? []).map((row) =>
      mapRow(row as Record<string, unknown>)
    );

    const search = options.search?.trim().toLowerCase();
    if (search) {
      rows = rows.filter((row) => matchesSearch(row, search));
    }

    return { rows, warnings: [] };
  } catch {
    return { rows: [], warnings: ["Could not load admin activity log."] };
  }
}

export async function getAdminActivityLog(
  options: AdminActivityLogOptions = {}
): Promise<{
  rows: AdminActivityRow[];
  summary: AdminActivitySummary;
  warnings: string[];
}> {
  const { rows, warnings } = await fetchActivityRows(options);
  return {
    rows,
    summary: summarizeRows(rows),
    warnings,
  };
}

export async function getLessonActivityLog(
  lessonId: string,
  limit = 10
): Promise<{ rows: AdminActivityRow[]; warnings: string[] }> {
  const { rows, warnings } = await fetchActivityRows({
    lessonId,
    limit,
  });
  return { rows, warnings };
}

export async function getRecentAdminActivity(limit = 5): Promise<{
  rows: AdminActivityRow[];
  warnings: string[];
}> {
  const { rows, warnings } = await fetchActivityRows({ limit });
  return { rows, warnings };
}
