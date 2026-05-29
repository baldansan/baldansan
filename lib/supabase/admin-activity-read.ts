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
import { isCurrentUserAdmin } from "@/lib/supabase/admin";
import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";

export type AdminActivityFetchResult = {
  rows: AdminActivityRow[];
  summary: AdminActivitySummary;
  warnings: string[];
};

function notConfigured(): AdminActivityFetchResult {
  return {
    rows: [],
    summary: summarizeActivityRows([]),
    warnings: ["Supabase not configured."],
  };
}

/** Load activity log using the browser Supabase session (same auth as admin writes). */
export async function fetchAdminActivityLogClient(
  options: AdminActivityLogOptions = {}
): Promise<AdminActivityFetchResult> {
  if (!supabase || !hasSupabaseConfig) {
    return notConfigured();
  }

  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    console.warn("[admin-activity] Fetch skipped: current user is not admin.");
    return {
      rows: [],
      summary: summarizeActivityRows([]),
      warnings: ["Admin эрх шаардлагатай activity log уншихад."],
    };
  }

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session?.user) {
    console.warn(
      "[admin-activity] Fetch with no browser session — sign in again if logs are missing."
    );
  }

  try {
    const { rows, error } = await queryAdminActivityLog(supabase, options);

    if (error) {
      console.warn("[admin-activity] Fetch failed:", error);
      return {
        rows: [],
        summary: summarizeActivityRows([]),
        warnings: [formatActivityFetchError(error)],
      };
    }

    return {
      rows,
      summary: summarizeActivityRows(rows),
      warnings: [],
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not load admin activity log.";
    console.warn("[admin-activity] Fetch error:", message);
    return {
      rows: [],
      summary: summarizeActivityRows([]),
      warnings: [message],
    };
  }
}

export async function fetchAdminActivityByIdClient(
  id: string
): Promise<{ row: AdminActivityRow | null; warnings: string[] }> {
  if (!supabase || !hasSupabaseConfig) {
    return { row: null, warnings: ["Supabase not configured."] };
  }

  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    console.warn("[admin-activity] Detail fetch skipped: not admin.");
    return {
      row: null,
      warnings: ["Admin эрх шаардлагатай activity detail уншихад."],
    };
  }

  try {
    const { row, error } = await queryAdminActivityById(supabase, id);

    if (error) {
      console.warn("[admin-activity] Detail fetch failed:", error);
      return { row: null, warnings: [formatActivityFetchError(error)] };
    }

    return { row, warnings: [] };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not load activity detail.";
    console.warn("[admin-activity] Detail fetch error:", message);
    return { row: null, warnings: [message] };
  }
}
