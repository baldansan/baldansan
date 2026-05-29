import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";
import { getCurrentUser } from "@/lib/supabase/auth";
import {
  getCurrentAdminProfile,
  isCurrentUserAdmin,
} from "@/lib/supabase/admin";

export type ConfigStatus = "configured" | "missing";

export type CheckResult = "pass" | "fail" | "missing" | "skip";

export type SystemCheckItem = {
  id: string;
  label: string;
  result: CheckResult;
  detail?: string;
};

export type ClientEnvStatus = {
  supabaseUrl: ConfigStatus;
  supabaseAnonKey: ConfigStatus;
  supabaseReady: boolean;
};

export type SystemCheckReport = {
  env: ClientEnvStatus;
  checks: SystemCheckItem[];
  ranAt: string;
};

/** Safe env presence check — never returns secret values. */
export function getClientEnvStatus(): ClientEnvStatus {
  const urlConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim());
  const keyConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  );

  return {
    supabaseUrl: urlConfigured ? "configured" : "missing",
    supabaseAnonKey: keyConfigured ? "configured" : "missing",
    supabaseReady: hasSupabaseConfig,
  };
}

function item(
  id: string,
  label: string,
  result: CheckResult,
  detail?: string
): SystemCheckItem {
  return { id, label, result, detail };
}

async function canReadTable(
  table: string,
  select = "id"
): Promise<{ ok: boolean; detail?: string }> {
  if (!supabase) {
    return { ok: false, detail: "Supabase client unavailable." };
  }

  const { error } = await supabase.from(table).select(select).limit(1);

  if (!error) return { ok: true };

  const message = error.message ?? "Query failed.";
  if (
    message.includes("does not exist") ||
    message.includes("Could not find the table")
  ) {
    return { ok: false, detail: "Table not found — run migration." };
  }
  if (
    message.toLowerCase().includes("policy") ||
    message.toLowerCase().includes("row-level security")
  ) {
    return { ok: false, detail: "RLS blocked read — check policies." };
  }
  return { ok: false, detail: message };
}

async function canAccessStorageBucket(): Promise<{ ok: boolean; detail?: string }> {
  if (!supabase) {
    return { ok: false, detail: "Supabase client unavailable." };
  }

  const { data, error } = await supabase.storage
    .from("lesson-media")
    .list("", { limit: 1 });

  if (!error) {
    return { ok: true, detail: "lesson-media bucket reachable." };
  }

  const message = error.message ?? "Storage check failed.";
  if (message.toLowerCase().includes("bucket not found")) {
    return { ok: false, detail: "Bucket lesson-media not found." };
  }
  if (
    message.toLowerCase().includes("policy") ||
    message.toLowerCase().includes("row-level security")
  ) {
    return {
      ok: false,
      detail: "Storage policy blocked — verify storage RLS.",
    };
  }
  return { ok: false, detail: message };
}

/** Auth + admin profile checks for the signed-in browser session. */
export async function checkAdminReadiness(): Promise<SystemCheckItem[]> {
  const env = getClientEnvStatus();
  if (!env.supabaseReady) {
    return [
      item("auth-session", "Auth session", "missing", "Supabase not configured."),
      item("admin-status", "Admin status", "missing", "Supabase not configured."),
      item(
        "admin-profile",
        "Admin profile row",
        "missing",
        "Supabase not configured."
      ),
    ];
  }

  const checks: SystemCheckItem[] = [];
  const { data: user } = await getCurrentUser();

  checks.push(
    user
      ? item("auth-session", "Auth session", "pass", "Signed in.")
      : item("auth-session", "Auth session", "fail", "Not signed in.")
  );

  if (!user) {
    checks.push(
      item("admin-status", "Admin status", "skip", "Sign in required."),
      item("admin-profile", "Admin profile row", "skip", "Sign in required.")
    );
    return checks;
  }

  const isAdmin = await isCurrentUserAdmin();
  checks.push(
    isAdmin
      ? item("admin-status", "Admin status", "pass", "Admin role confirmed.")
      : item(
          "admin-status",
          "Admin status",
          "fail",
          "No admin_profiles row for this user."
        )
  );

  const profile = await getCurrentAdminProfile();
  checks.push(
    profile
      ? item(
          "admin-profile",
          "Admin profile row",
          "pass",
          `Role: ${profile.role}`
        )
      : item(
          "admin-profile",
          "Admin profile row",
          "fail",
          "admin_profiles row not found."
        )
  );

  return checks;
}

/** Supabase table/storage connectivity for admin session. */
export async function checkSupabaseReadiness(): Promise<SystemCheckItem[]> {
  const env = getClientEnvStatus();
  if (!env.supabaseReady) {
    return [
      item(
        "admin-tasks-table",
        "admin_tasks table",
        "missing",
        "Supabase not configured."
      ),
      item(
        "activity-log-table",
        "admin_activity_log table",
        "missing",
        "Supabase not configured."
      ),
      item(
        "storage-bucket",
        "Storage bucket (lesson-media)",
        "missing",
        "Supabase not configured."
      ),
    ];
  }

  const checks: SystemCheckItem[] = [];

  const tasks = await canReadTable("admin_tasks", "task_key");
  checks.push(
    item(
      "admin-tasks-table",
      "admin_tasks table",
      tasks.ok ? "pass" : "fail",
      tasks.detail
    )
  );

  const activity = await canReadTable("admin_activity_log", "id");
  checks.push(
    item(
      "activity-log-table",
      "admin_activity_log table",
      activity.ok ? "pass" : "fail",
      activity.detail
    )
  );

  const storage = await canAccessStorageBucket();
  checks.push(
    item(
      "storage-bucket",
      "Storage bucket (lesson-media)",
      storage.ok ? "pass" : "fail",
      storage.detail
    )
  );

  return checks;
}

/** Public content read path (lessons catalog). */
export async function checkContentReadiness(): Promise<SystemCheckItem[]> {
  const env = getClientEnvStatus();
  if (!env.supabaseReady) {
    return [
      item(
        "lessons-read",
        "Lessons table read",
        "missing",
        "Supabase not configured — local fallback active."
      ),
    ];
  }

  const lessons = await canReadTable("lessons", "id, status");
  return [
    item(
      "lessons-read",
      "Lessons table read",
      lessons.ok ? "pass" : "fail",
      lessons.detail
    ),
  ];
}

export async function runSystemChecks(): Promise<SystemCheckReport> {
  const env = getClientEnvStatus();
  const envChecks: SystemCheckItem[] = [
    item(
      "env-url",
      "NEXT_PUBLIC_SUPABASE_URL",
      env.supabaseUrl === "configured" ? "pass" : "fail",
      env.supabaseUrl === "configured" ? "Configured." : "Missing."
    ),
    item(
      "env-anon-key",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      env.supabaseAnonKey === "configured" ? "pass" : "fail",
      env.supabaseAnonKey === "configured" ? "Configured." : "Missing."
    ),
  ];

  const [content, admin, supabaseChecks] = await Promise.all([
    checkContentReadiness(),
    checkAdminReadiness(),
    checkSupabaseReadiness(),
  ]);

  return {
    env,
    checks: [...envChecks, ...content, ...admin, ...supabaseChecks],
    ranAt: new Date().toISOString(),
  };
}
