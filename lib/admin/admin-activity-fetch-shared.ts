import type { SupabaseClient } from "@supabase/supabase-js";
import {
  mapActivityLogRow,
  type AdminActivityLogOptions,
  type AdminActivityRow,
} from "@/lib/admin/admin-activity-shared";

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

function migrationWarning(message: string): string | null {
  if (message.includes("admin_activity_log") || message.includes("does not exist")) {
    return "Run supabase/migrations/007_admin_activity_log.sql for activity log.";
  }
  if (
    message.includes("before_snapshot") ||
    message.includes("after_snapshot") ||
    message.includes("diff_summary")
  ) {
    return "Run supabase/migrations/008_admin_activity_snapshots.sql for snapshot columns.";
  }
  return null;
}

function isRlsError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("row-level security") ||
    lower.includes("policy") ||
    lower.includes("42501")
  );
}

export function formatActivityFetchError(message: string): string {
  const migration = migrationWarning(message);
  if (migration) return migration;
  if (isRlsError(message)) {
    return `Activity log RLS blocked read (${message}). Confirm admin_profiles row and migration 007 policies.`;
  }
  return message;
}

const CORE_ACTIVITY_COLUMNS =
  "id, actor_user_id, actor_email, action, entity_type, entity_id, lesson_id, title, description, metadata, created_at";

const FULL_ACTIVITY_COLUMNS = `${CORE_ACTIVITY_COLUMNS}, before_snapshot, after_snapshot, diff_summary`;

function isSnapshotColumnError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("before_snapshot") ||
    lower.includes("after_snapshot") ||
    lower.includes("diff_summary")
  );
}

function enrichRowFromMetadata(row: Record<string, unknown>): Record<string, unknown> {
  const metadata =
    row.metadata && typeof row.metadata === "object"
      ? (row.metadata as Record<string, unknown>)
      : {};

  if (!row.before_snapshot && metadata.beforeSnapshot) {
    row.before_snapshot = metadata.beforeSnapshot;
  }
  if (!row.after_snapshot && metadata.afterSnapshot) {
    row.after_snapshot = metadata.afterSnapshot;
  }
  if (
    (!row.diff_summary ||
      (typeof row.diff_summary === "object" &&
        Object.keys(row.diff_summary as object).length === 0)) &&
    metadata.diffSummary
  ) {
    row.diff_summary = metadata.diffSummary;
  }

  return row;
}

async function runActivityLogQuery(
  client: SupabaseClient,
  options: AdminActivityLogOptions,
  selectColumns: string
): Promise<{ rows: AdminActivityRow[]; error: string | null }> {
  let query = client
    .from("admin_activity_log")
    .select(selectColumns)
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
    return { rows: [], error: error.message ?? "Activity log query failed." };
  }

  let rows = (data ?? []).map((row) =>
    mapActivityLogRow(
      enrichRowFromMetadata(row as unknown as Record<string, unknown>)
    )
  );

  const search = options.search?.trim().toLowerCase();
  if (search) {
    rows = rows.filter((row) => matchesSearch(row, search));
  }

  return { rows, error: null };
}

/** Query admin_activity_log and map snake_case DB columns to camelCase UI rows. */
export async function queryAdminActivityLog(
  client: SupabaseClient,
  options: AdminActivityLogOptions = {}
): Promise<{ rows: AdminActivityRow[]; error: string | null }> {
  const full = await runActivityLogQuery(client, options, FULL_ACTIVITY_COLUMNS);
  if (!full.error) return full;

  if (isSnapshotColumnError(full.error)) {
    return runActivityLogQuery(client, options, CORE_ACTIVITY_COLUMNS);
  }

  return full;
}

export async function queryAdminActivityById(
  client: SupabaseClient,
  id: string
): Promise<{ row: AdminActivityRow | null; error: string | null }> {
  async function runSelect(selectColumns: string) {
    return client
      .from("admin_activity_log")
      .select(selectColumns)
      .eq("id", id)
      .maybeSingle();
  }

  let { data, error } = await runSelect(FULL_ACTIVITY_COLUMNS);

  if (error && isSnapshotColumnError(error.message ?? "")) {
    ({ data, error } = await runSelect(CORE_ACTIVITY_COLUMNS));
  }

  if (error) {
    return { row: null, error: error.message ?? "Activity detail query failed." };
  }

  if (!data) {
    return { row: null, error: null };
  }

  return {
    row: mapActivityLogRow(
      enrichRowFromMetadata(data as unknown as Record<string, unknown>)
    ),
    error: null,
  };
}
