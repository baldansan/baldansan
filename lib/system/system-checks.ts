import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";
import { getCurrentUser } from "@/lib/supabase/auth";
import {
  getCurrentAdminProfile,
  isCurrentUserAdmin,
} from "@/lib/supabase/admin";

export type ConfigStatus = "configured" | "missing";

export type CheckResult = "pass" | "warn" | "fail" | "missing" | "skip";

export type SystemCheckItem = {
  id: string;
  group: string;
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

export const SQL_VERIFICATION_INSTRUCTIONS =
  "Run supabase/verify/production_verification.sql in Supabase SQL Editor.";

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
  group: string,
  id: string,
  label: string,
  result: CheckResult,
  detail?: string
): SystemCheckItem {
  return { group, id, label, result, detail };
}

type ReadOutcome = {
  ok: boolean;
  empty?: boolean;
  detail?: string;
};

async function canReadTable(
  table: string,
  select = "id"
): Promise<ReadOutcome> {
  if (!supabase) {
    return { ok: false, detail: "Supabase client unavailable." };
  }

  const { data, error } = await supabase.from(table).select(select).limit(1);

  if (!error) {
    return { ok: true, empty: !data || data.length === 0 };
  }

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

async function canReadLesson(
  lessonId: string,
  select: string
): Promise<ReadOutcome & { row?: Record<string, unknown> }> {
  if (!supabase) {
    return { ok: false, detail: "Supabase client unavailable." };
  }

  const { data, error } = await supabase
    .from("lessons")
    .select(select)
    .eq("id", lessonId)
    .maybeSingle();

  if (error) {
    const message = error.message ?? "Query failed.";
    if (
      message.includes("does not exist") ||
      message.includes("column") ||
      message.includes("Could not find")
    ) {
      return { ok: false, detail: message };
    }
    if (
      message.toLowerCase().includes("policy") ||
      message.toLowerCase().includes("row-level security")
    ) {
      return { ok: false, detail: "RLS blocked lesson read." };
    }
    return { ok: false, detail: message };
  }

  if (!data) {
    return { ok: true, empty: true, detail: `Lesson ${lessonId} not found.` };
  }

  return { ok: true, row: data as unknown as Record<string, unknown> };
}

async function canAccessStorageBucket(): Promise<ReadOutcome> {
  if (!supabase) {
    return { ok: false, detail: "Supabase client unavailable." };
  }

  const { error } = await supabase.storage.from("lesson-media").list("", {
    limit: 1,
  });

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

function tableCheck(
  group: string,
  id: string,
  label: string,
  outcome: ReadOutcome,
  emptyAs: "pass" | "warn" = "pass"
): SystemCheckItem {
  if (!outcome.ok) {
    return item(group, id, label, "fail", outcome.detail);
  }
  if (outcome.empty) {
    return item(
      group,
      id,
      label,
      emptyAs,
      outcome.detail ?? "Readable but empty."
    );
  }
  return item(group, id, label, "pass", outcome.detail ?? "Readable.");
}

/** Auth + admin profile checks for the signed-in browser session. */
export async function checkAdminReadiness(): Promise<SystemCheckItem[]> {
  const env = getClientEnvStatus();
  if (!env.supabaseReady) {
    return [
      item("auth", "auth-session", "Auth session", "missing", "Supabase not configured."),
      item("auth", "admin-status", "Admin status", "missing", "Supabase not configured."),
      item(
        "auth",
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
      ? item("auth", "auth-session", "Auth session", "pass", "Signed in.")
      : item("auth", "auth-session", "Auth session", "fail", "Not signed in.")
  );

  if (!user) {
    checks.push(
      item("auth", "admin-status", "Admin status", "skip", "Sign in required."),
      item("auth", "admin-profile", "Admin profile row", "skip", "Sign in required."),
      item(
        "auth",
        "admin-profile-own",
        "admin_profiles own row",
        "skip",
        "Sign in required."
      )
    );
    return checks;
  }

  const isAdmin = await isCurrentUserAdmin();
  checks.push(
    isAdmin
      ? item("auth", "admin-status", "Admin status", "pass", "Admin role confirmed.")
      : item(
          "auth",
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
          "auth",
          "admin-profile",
          "Admin profile row",
          "pass",
          `Role: ${profile.role}`
        )
      : item(
          "auth",
          "admin-profile",
          "Admin profile row",
          "fail",
          "admin_profiles row not found."
        )
  );

  if (supabase && user.id) {
    const { data, error } = await supabase
      .from("admin_profiles")
      .select("user_id, role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      checks.push(
        item(
          "auth",
          "admin-profile-own",
          "admin_profiles own row",
          "fail",
          error.message
        )
      );
    } else if (data) {
      checks.push(
        item(
          "auth",
          "admin-profile-own",
          "admin_profiles own row",
          "pass",
          "Own profile readable."
        )
      );
    } else {
      checks.push(
        item(
          "auth",
          "admin-profile-own",
          "admin_profiles own row",
          "fail",
          "No row for current user."
        )
      );
    }
  }

  return checks;
}

/** Supabase admin tables, storage, progress. */
export async function checkSupabaseReadiness(): Promise<SystemCheckItem[]> {
  const env = getClientEnvStatus();
  if (!env.supabaseReady) {
    return [
      item("supabase", "admin-tasks-table", "admin_tasks table", "missing", "Supabase not configured."),
      item("supabase", "activity-log-table", "admin_activity_log table", "missing", "Supabase not configured."),
      item("supabase", "storage-bucket", "Storage bucket (lesson-media)", "missing", "Supabase not configured."),
      item("supabase", "progress-lesson", "user_lesson_progress", "missing", "Supabase not configured."),
      item("supabase", "progress-vocab", "user_vocabulary_progress", "missing", "Supabase not configured."),
      item("supabase", "progress-quiz", "user_quiz_attempts", "missing", "Supabase not configured."),
    ];
  }

  const checks: SystemCheckItem[] = [];

  checks.push(
    tableCheck(
      "supabase",
      "admin-tasks-table",
      "admin_tasks table",
      await canReadTable("admin_tasks", "task_key")
    )
  );

  checks.push(
    tableCheck(
      "supabase",
      "activity-log-table",
      "admin_activity_log table",
      await canReadTable("admin_activity_log", "id"),
      "warn"
    )
  );

  for (const [id, label, table] of [
    ["progress-lesson", "user_lesson_progress", "user_lesson_progress"],
    ["progress-vocab", "user_vocabulary_progress", "user_vocabulary_progress"],
    ["progress-quiz", "user_quiz_attempts", "user_quiz_attempts"],
  ] as const) {
    checks.push(
      tableCheck(
        "supabase",
        id,
        label,
        await canReadTable(table, "id"),
        "warn"
      )
    );
  }

  const storage = await canAccessStorageBucket();
  checks.push(
    item(
      "supabase",
      "storage-bucket",
      "Storage bucket (lesson-media)",
      storage.ok ? "pass" : "fail",
      storage.detail
    )
  );

  if (supabase && storage.ok) {
    const { data } = supabase.storage.from("lesson-media").getPublicUrl("health-check/probe.txt");
    const url = data?.publicUrl ?? "";
    checks.push(
      item(
        "supabase",
        "storage-public-url",
        "Storage public URL pattern",
        url.startsWith("http") ? "pass" : "warn",
        url.startsWith("http")
          ? "Public URL builder works."
          : "Could not build public URL."
      )
    );
  }

  return checks;
}

/** Lesson content reads and media columns. */
export async function checkContentReadiness(
  isAdmin: boolean
): Promise<SystemCheckItem[]> {
  const env = getClientEnvStatus();
  if (!env.supabaseReady) {
    return [
      item(
        "content",
        "lessons-read",
        "Lessons table read",
        "missing",
        "Supabase not configured — local fallback active."
      ),
    ];
  }

  const checks: SystemCheckItem[] = [];

  checks.push(
    tableCheck(
      "content",
      "lessons-read",
      "Lessons table read",
      await canReadTable("lessons", "id, status")
    )
  );

  const lesson1 = await canReadLesson(
    "1",
    "id, status, title, video_url, thumbnail_url, audio_url, media_status"
  );
  if (!lesson1.ok) {
    checks.push(
      item("content", "lesson-1", "Read Lesson 1", "fail", lesson1.detail)
    );
  } else if (lesson1.empty) {
    checks.push(
      item("content", "lesson-1", "Read Lesson 1", "warn", lesson1.detail)
    );
  } else {
    checks.push(
      item("content", "lesson-1", "Read Lesson 1", "pass", "Lesson 1 found.")
    );
    const row = lesson1.row ?? {};
    const hasMediaCols =
      "video_url" in row ||
      "thumbnail_url" in row ||
      "media_status" in row;
    checks.push(
      item(
        "content",
        "lesson-media-fields",
        "Lesson media columns",
        hasMediaCols ? "pass" : "warn",
        hasMediaCols
          ? "Media columns present on lesson row."
          : "Media columns missing — run 002_lesson_media_fields.sql."
      )
    );
  }

  if (isAdmin) {
    const lesson5 = await canReadLesson("5", "id, status, title");
    if (!lesson5.ok) {
      checks.push(
        item(
          "content",
          "lesson-5-draft",
          "Read Lesson 5 (admin)",
          "fail",
          lesson5.detail
        )
      );
    } else if (lesson5.empty) {
      checks.push(
        item(
          "content",
          "lesson-5-draft",
          "Read Lesson 5 (admin)",
          "warn",
          "Lesson 5 not in database."
        )
      );
    } else {
      const status = String(lesson5.row?.status ?? "");
      checks.push(
        item(
          "content",
          "lesson-5-draft",
          "Read Lesson 5 (admin)",
          "pass",
          `Lesson 5 found (status: ${status}).`
        )
      );
    }
  } else {
    checks.push(
      item(
        "content",
        "lesson-5-draft",
        "Read Lesson 5 (admin)",
        "skip",
        "Admin sign-in required."
      )
    );
  }

  return checks;
}

export async function runSystemChecks(): Promise<SystemCheckReport> {
  const env = getClientEnvStatus();
  const envChecks: SystemCheckItem[] = [
    item(
      "environment",
      "env-url",
      "NEXT_PUBLIC_SUPABASE_URL",
      env.supabaseUrl === "configured" ? "pass" : "fail",
      env.supabaseUrl === "configured" ? "Configured." : "Missing."
    ),
    item(
      "environment",
      "env-anon-key",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      env.supabaseAnonKey === "configured" ? "pass" : "fail",
      env.supabaseAnonKey === "configured" ? "Configured." : "Missing."
    ),
  ];

  const { data: user } = env.supabaseReady
    ? await getCurrentUser()
    : { data: null };
  const isAdmin = user ? await isCurrentUserAdmin() : false;

  const [content, admin, supabaseChecks] = await Promise.all([
    checkContentReadiness(isAdmin),
    checkAdminReadiness(),
    checkSupabaseReadiness(),
  ]);

  const deploymentChecks: SystemCheckItem[] = [
    item(
      "deployment",
      "deployment-check-route",
      "Deployment check route",
      "pass",
      "Public smoke test at /deployment-check."
    ),
  ];

  return {
    env,
    checks: [
      ...envChecks,
      ...deploymentChecks,
      ...admin,
      ...content,
      ...supabaseChecks,
    ],
    ranAt: new Date().toISOString(),
  };
}
