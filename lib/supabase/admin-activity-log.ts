import "server-only";

import {
  formatActivityFetchError,
  queryAdminActivityById,
  queryAdminActivityLog,
} from "@/lib/admin/admin-activity-fetch-shared";
import { summarizeActivityRows } from "@/lib/admin/admin-activity-summary";
import type {
  AdminActivityLogOptions,
  AdminActivityRow,
  AdminActivitySummary,
} from "@/lib/admin/admin-activity-shared";
import { formatActivityActor } from "@/lib/admin/admin-activity-shared";
import { hasSupabaseConfig } from "@/lib/supabase/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type {
  AdminActivityRow,
  AdminActivitySummary,
  AdminActivityLogOptions,
} from "@/lib/admin/admin-activity-shared";

export { formatActivityActor };

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
    const {
      data: { user },
    } = await client.auth.getUser();

    const { rows, error } = await queryAdminActivityLog(client, options);

    if (error) {
      console.warn("[admin-activity] Server fetch failed:", error);
      return {
        rows: [],
        warnings: [formatActivityFetchError(error)],
      };
    }

    const warnings: string[] = [];
    if (rows.length === 0 && !user) {
      warnings.push(
        "Server session not found — activity log may appear empty here. Open /admin/activity in your signed-in browser session."
      );
    }

    return { rows, warnings };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not load admin activity log.";
    console.warn("[admin-activity] Server fetch error:", message);
    return { rows: [], warnings: [message] };
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
    summary: summarizeActivityRows(rows),
    warnings,
  };
}

export async function getLessonActivityLog(
  lessonId: string,
  limit = 10
): Promise<{ rows: AdminActivityRow[]; warnings: string[] }> {
  return fetchActivityRows({ lessonId, limit });
}

export async function getRecentAdminActivity(limit = 5): Promise<{
  rows: AdminActivityRow[];
  warnings: string[];
}> {
  return fetchActivityRows({ limit });
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
    const { row, error } = await queryAdminActivityById(client, id);

    if (error) {
      console.warn("[admin-activity] Server detail fetch failed:", error);
      return { row: null, warnings: [formatActivityFetchError(error)] };
    }

    return { row, warnings: [] };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not load activity detail.";
    console.warn("[admin-activity] Server detail fetch error:", message);
    return { row: null, warnings: [message] };
  }
}
