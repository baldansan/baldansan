import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/client";
import type {
  AdminActivityLogOptions,
  AdminActivityRow,
  AdminActivitySummary,
} from "@/lib/admin/admin-activity-shared";
import {
  formatActivityActor,
  mapActivityLogRow,
} from "@/lib/admin/admin-activity-shared";
import { summarizeActivityRows } from "@/lib/admin/admin-activity-summary";

export type {
  AdminActivityRow,
  AdminActivitySummary,
  AdminActivityLogOptions,
} from "@/lib/admin/admin-activity-shared";

export { formatActivityActor };

function mapRow(row: Record<string, unknown>): AdminActivityRow {
  return mapActivityLogRow(row);
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
  return summarizeActivityRows(rows);
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

export async function getAdminActivityById(
  id: string
): Promise<{ row: AdminActivityRow | null; warnings: string[] }> {
  if (!hasSupabaseConfig) {
    return { row: null, warnings: ["Supabase not configured."] };
  }

  const client = await createServerSupabaseClient();
  if (!client) {
    return { row: null, warnings: ["Supabase client unavailable."] };
  }

  try {
    const { data, error } = await client
      .from("admin_activity_log")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      const message = error.message ?? "";
      if (message.includes("admin_activity_log") || message.includes("does not exist")) {
        return {
          row: null,
          warnings: [
            "Run supabase/migrations/007_admin_activity_log.sql for activity log.",
          ],
        };
      }
      if (
        message.includes("before_snapshot") ||
        message.includes("after_snapshot")
      ) {
        return {
          row: null,
          warnings: [
            "Run supabase/migrations/008_admin_activity_snapshots.sql for snapshot columns.",
          ],
        };
      }
      return { row: null, warnings: [`Activity log error: ${message}`] };
    }

    if (!data) {
      return { row: null, warnings: [] };
    }

    return {
      row: mapRow(data as Record<string, unknown>),
      warnings: [],
    };
  } catch {
    return { row: null, warnings: ["Could not load activity detail."] };
  }
}
