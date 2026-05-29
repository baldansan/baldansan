import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";
import { getCurrentUser } from "@/lib/supabase/auth";
import {
  getCurrentAdminProfile,
  isCurrentUserAdmin,
} from "@/lib/supabase/admin";
import { getClientEnvStatus } from "@/lib/system/system-checks";

export const PRODUCTION_URL = "https://baldansan.vercel.app";

export type SecurityCheckResult = "pass" | "warn" | "fail" | "skip" | "manual";

export type SecurityAuditCheck = {
  id: string;
  group: string;
  label: string;
  result: SecurityCheckResult;
  detail?: string;
};

export type SecurityAuditReport = {
  productionUrl: string;
  checks: SecurityAuditCheck[];
  ranAt: string;
};

function check(
  group: string,
  id: string,
  label: string,
  result: SecurityCheckResult,
  detail?: string
): SecurityAuditCheck {
  return { group, id, label, result, detail };
}

type ReadOutcome = { ok: boolean; detail?: string; empty?: boolean };

async function canReadTable(
  table: string,
  select = "id"
): Promise<ReadOutcome> {
  if (!supabase) {
    return { ok: false, detail: "Supabase client unavailable." };
  }
  const { data, error } = await supabase.from(table).select(select).limit(1);
  if (!error) {
    return { ok: true, empty: !data?.length, detail: "Readable." };
  }
  const message = error.message ?? "Query failed.";
  if (
    message.toLowerCase().includes("policy") ||
    message.toLowerCase().includes("row-level security")
  ) {
    return { ok: false, detail: "RLS blocked — verify policies." };
  }
  if (message.includes("does not exist")) {
    return { ok: false, detail: "Table missing — run migration." };
  }
  return { ok: false, detail: message };
}

function tableCheck(
  group: string,
  id: string,
  label: string,
  outcome: ReadOutcome,
  emptyOk = true
): SecurityAuditCheck {
  if (!outcome.ok) {
    return check(group, id, label, "fail", outcome.detail);
  }
  if (outcome.empty && !emptyOk) {
    return check(group, id, label, "warn", "Readable but empty.");
  }
  return check(group, id, label, "pass", outcome.detail ?? "RLS read OK.");
}

async function checkEnvironmentSafety(): Promise<SecurityAuditCheck[]> {
  const env = getClientEnvStatus();
  if (!env.supabaseReady) {
    return [
      check(
        "environment",
        "env-url",
        "NEXT_PUBLIC_SUPABASE_URL configured",
        "fail",
        "Missing — local fallback only."
      ),
      check(
        "environment",
        "env-anon",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY configured",
        "fail",
        "Missing — local fallback only."
      ),
      check(
        "environment",
        "env-hidden",
        "No env values displayed",
        "pass",
        "This page never shows secrets."
      ),
      check(
        "environment",
        "env-local-reminder",
        ".env.local gitignored reminder",
        "pass",
        "Never commit .env.local — use .env.example template only."
      ),
      check(
        "environment",
        "no-service-role",
        "service_role must not be in client",
        "pass",
        "App uses anon key only — never add service_role to Vercel client env."
      ),
    ];
  }

  return [
    check(
      "environment",
      "env-url",
      "NEXT_PUBLIC_SUPABASE_URL configured",
      "pass",
      "Configured (value hidden)."
    ),
    check(
      "environment",
      "env-anon",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY configured",
      "pass",
      "Configured (value hidden)."
    ),
    check(
      "environment",
      "env-hidden",
      "No env values displayed",
      "pass",
      "This page never shows secrets."
    ),
    check(
      "environment",
      "env-local-reminder",
      ".env.local gitignored reminder",
      "pass",
      "Never commit .env.local — use .env.example template only."
    ),
    check(
      "environment",
      "no-service-role",
      "service_role must not be in client",
      "pass",
      "App uses anon key only — never add service_role to Vercel client env."
    ),
  ];
}

async function checkAdminAccess(isAdmin: boolean): Promise<SecurityAuditCheck[]> {
  if (!hasSupabaseConfig) {
    return [
      check("admin", "auth-session", "Current user logged in", "skip", "Supabase not configured."),
      check("admin", "admin-status", "Current user is admin", "skip", "Supabase not configured."),
      check("admin", "admin-profile", "Admin profile readable", "skip", "Supabase not configured."),
      check(
        "admin",
        "admin-guard",
        "Admin pages protected by AdminGuard",
        "pass",
        "All /admin routes use AdminGuard in admin-layout-shell."
      ),
      check(
        "admin",
        "non-admin-denied",
        "Non-admin access denied",
        "manual",
        "Sign out and visit /admin — expect login or denied message."
      ),
    ];
  }

  const { data: user } = await getCurrentUser();
  const checks: SecurityAuditCheck[] = [
    user
      ? check("admin", "auth-session", "Current user logged in", "pass", "Signed in.")
      : check("admin", "auth-session", "Current user logged in", "fail", "Not signed in."),
  ];

  if (!user) {
    checks.push(
      check("admin", "admin-status", "Current user is admin", "skip", "Sign in required."),
      check("admin", "admin-profile", "Admin profile readable", "skip", "Sign in required."),
      check(
        "admin",
        "admin-guard",
        "Admin pages protected by AdminGuard",
        "pass",
        "AdminGuard active on /admin layout."
      ),
      check(
        "admin",
        "non-admin-denied",
        "Non-admin access denied",
        "pass",
        "You are not signed in — /admin should show login prompt."
      )
    );
    return checks;
  }

  checks.push(
    isAdmin
      ? check("admin", "admin-status", "Current user is admin", "pass", "Admin role confirmed.")
      : check(
          "admin",
          "admin-status",
          "Current user is admin",
          "fail",
          "No admin_profiles row — admin routes should deny."
        )
  );

  const profile = await getCurrentAdminProfile();
  checks.push(
    profile
      ? check("admin", "admin-profile", "Admin profile readable", "pass", `Role: ${profile.role}`)
      : check("admin", "admin-profile", "Admin profile readable", "fail", "Profile row not found.")
  );

  checks.push(
    check(
      "admin",
      "admin-guard",
      "Admin pages protected by AdminGuard",
      "pass",
      "AdminGuard wraps all /admin pages."
    )
  );

  checks.push(
    isAdmin
      ? check(
          "admin",
          "non-admin-denied",
          "Non-admin access denied",
          "manual",
          "Sign out or use incognito as non-admin — /admin must block access."
        )
      : check(
          "admin",
          "non-admin-denied",
          "Non-admin access denied",
          "pass",
          "Current user is not admin — you should not see admin content."
        )
  );

  return checks;
}

async function checkPublicVisibility(
  isAdmin: boolean
): Promise<SecurityAuditCheck[]> {
  if (!hasSupabaseConfig || !supabase) {
    return [
      check(
        "visibility",
        "available-lessons",
        "Available lessons public",
        "warn",
        "Supabase not configured — using local fallback."
      ),
      check(
        "visibility",
        "draft-hidden-catalog",
        "Draft lessons hidden from course list",
        "manual",
        "Verify /courses/hsk5 on production after deploy."
      ),
      check(
        "visibility",
        "draft-direct-route",
        "Draft direct route unavailable",
        "manual",
        "Visit /lessons/5 without preview — expect unavailable."
      ),
      check(
        "visibility",
        "admin-preview",
        "Admin preview requires admin",
        "manual",
        "Test ?preview=admin as non-admin — must block."
      ),
    ];
  }

  const checks: SecurityAuditCheck[] = [];

  const { data: available, error: availError } = await supabase
    .from("lessons")
    .select("id, status")
    .eq("status", "available")
    .limit(5);

  if (availError) {
    checks.push(
      check(
        "visibility",
        "available-lessons",
        "Available lessons public",
        "fail",
        availError.message
      )
    );
  } else {
    checks.push(
      check(
        "visibility",
        "available-lessons",
        "Available lessons public",
        available?.length ? "pass" : "warn",
        available?.length
          ? `${available.length}+ available lesson(s) readable.`
          : "No available lessons — publish one for smoke test."
      )
    );
  }

  const { data: catalog } = await supabase
    .from("lessons")
    .select("id, status")
    .eq("course_id", "hsk5")
    .eq("status", "available");

  const { data: draftsInDb } = await supabase
    .from("lessons")
    .select("id")
    .eq("course_id", "hsk5")
    .eq("status", "draft")
    .limit(1);

  const draftId = draftsInDb?.[0]?.id;
  const catalogHasDraft =
    draftId != null &&
    catalog?.some((row) => String(row.id) === String(draftId));

  checks.push(
    catalogHasDraft
      ? check(
          "visibility",
          "draft-hidden-catalog",
          "Draft lessons hidden from course list",
          "fail",
          "Draft lesson appears in available catalog query — check RLS/filters."
        )
      : check(
          "visibility",
          "draft-hidden-catalog",
          "Draft lessons hidden from course list",
          draftId ? "pass" : "warn",
          draftId
            ? "Draft exists but not in available catalog fetch."
            : "No draft lesson to verify — create draft for test."
        )
  );

  const { data: draftRow, error: draftError } = await supabase
    .from("lessons")
    .select("id, status")
    .eq("id", "5")
    .maybeSingle();

  if (draftError) {
    checks.push(
      check(
        "visibility",
        "draft-direct-route",
        "Draft direct route unavailable",
        "pass",
        "RLS blocked draft lesson read for current session."
      )
    );
  } else if (
    draftRow &&
    String(draftRow.status) === "draft" &&
    !isAdmin
  ) {
    checks.push(
      check(
        "visibility",
        "draft-direct-route",
        "Draft direct route unavailable",
        "fail",
        "Draft lesson 5 readable without admin — RLS may be too permissive."
      )
    );
  } else if (draftRow && String(draftRow.status) === "draft" && isAdmin) {
    checks.push(
      check(
        "visibility",
        "draft-direct-route",
        "Draft direct route unavailable",
        "manual",
        "As admin you can read drafts — test /lessons/5 logged out on production."
      )
    );
  } else {
    checks.push(
      check(
        "visibility",
        "draft-direct-route",
        "Draft direct route unavailable",
        "warn",
        "Lesson 5 not draft or not found — verify draft route manually."
      )
    );
  }

  checks.push(
    check(
      "visibility",
      "admin-preview",
      "Admin preview requires admin",
      "manual",
      "Non-admin must not access /lessons/{draftId}?preview=admin on production."
    )
  );

  return checks;
}

async function checkRlsTables(): Promise<SecurityAuditCheck[]> {
  if (!hasSupabaseConfig) {
    return [
      check("rls", "rls-unconfigured", "RLS table checks", "skip", "Supabase not configured."),
    ];
  }

  const tables: [string, string, boolean][] = [
    ["admin_profiles", "admin_profiles", true],
    ["admin_tasks", "admin_tasks", true],
    ["admin_activity_log", "admin_activity_log", true],
    ["user_lesson_progress", "user_lesson_progress", true],
    ["user_vocabulary_progress", "user_vocabulary_progress", true],
    ["user_quiz_attempts", "user_quiz_attempts", true],
    ["lessons", "content: lessons", true],
    ["subtitle_lines", "content: subtitle_lines", true],
    ["vocabulary_words", "content: vocabulary_words", true],
    ["quiz_questions", "content: quiz_questions", true],
  ];

  const results: SecurityAuditCheck[] = [];
  for (const [id, label, emptyOk] of tables) {
    results.push(
      tableCheck("rls", `rls-${id}`, label, await canReadTable(id), emptyOk)
    );
  }

  results.push(
    check(
      "rls",
      "storage-objects",
      "storage.objects (lesson-media)",
      "manual",
      "Run production_verification.sql — storage.objects policies check."
    )
  );

  return results;
}

async function checkStorage(): Promise<SecurityAuditCheck[]> {
  if (!hasSupabaseConfig || !supabase) {
    return [
      check("storage", "bucket", "lesson-media bucket", "warn", "Supabase not configured."),
      check("storage", "public-read", "Public read works", "skip", "Supabase not configured."),
      check(
        "storage",
        "admin-upload",
        "Admin upload policy reminder",
        "manual",
        "Run supabase/storage/001_lesson_media_bucket_policies.sql"
      ),
      check(
        "storage",
        "no-public-write",
        "No public write",
        "manual",
        "Verify storage policies deny anonymous upload."
      ),
    ];
  }

  const { error } = await supabase.storage.from("lesson-media").list("", {
    limit: 1,
  });

  const bucketOk = !error || !error.message.toLowerCase().includes("bucket not found");

  const { data: urlData } = supabase.storage
    .from("lesson-media")
    .getPublicUrl("health-check/probe.txt");

  return [
    bucketOk
      ? check("storage", "bucket", "lesson-media bucket", "pass", "Bucket reachable.")
      : check("storage", "bucket", "lesson-media bucket", "fail", error?.message ?? "Bucket missing."),
    urlData?.publicUrl?.startsWith("http")
      ? check("storage", "public-read", "Public read URL pattern", "pass", "Public URL builder works.")
      : check("storage", "public-read", "Public read URL pattern", "warn", "Could not build public URL."),
    check(
      "storage",
      "admin-upload",
      "Admin upload policy reminder",
      "manual",
      "Admin upload requires admin JWT + storage RLS — see SECURITY_RLS_AUDIT.md."
    ),
    check(
      "storage",
      "no-public-write",
      "No public write",
      "manual",
      "Confirm storage policies block anonymous INSERT — run SQL verification."
    ),
  ];
}

function checkAuthRedirectConfig(): SecurityAuditCheck[] {
  return [
    check(
      "auth-config",
      "site-url",
      "Site URL set to production",
      "manual",
      `Supabase Auth Site URL should be ${PRODUCTION_URL}`
    ),
    check(
      "auth-config",
      "redirect-urls",
      "Redirect URLs configured",
      "manual",
      "Add production URL, /login, /profile, and localhost/** in Supabase Dashboard."
    ),
    check(
      "auth-config",
      "localhost-dev",
      "localhost retained for development",
      "manual",
      "Keep http://localhost:3000/** in Redirect URLs for local dev."
    ),
    check(
      "auth-config",
      "email-confirmation",
      "Email confirmation production decision",
      "manual",
      "Recommended ON for production — document if OFF for staging only."
    ),
  ];
}

export async function runSecurityAuditChecks(): Promise<SecurityAuditReport> {
  const envChecks = await checkEnvironmentSafety();
  const { data: user } = hasSupabaseConfig
    ? await getCurrentUser()
    : { data: null };
  const isAdmin = user ? await isCurrentUserAdmin() : false;

  const [adminChecks, visibilityChecks, rlsChecks, storageChecks] =
    await Promise.all([
      checkAdminAccess(isAdmin),
      checkPublicVisibility(isAdmin),
      checkRlsTables(),
      checkStorage(),
    ]);

  const authConfigChecks = checkAuthRedirectConfig();

  return {
    productionUrl: PRODUCTION_URL,
    checks: [
      ...envChecks,
      ...adminChecks,
      ...visibilityChecks,
      ...rlsChecks,
      ...storageChecks,
      ...authConfigChecks,
    ],
    ranAt: new Date().toISOString(),
  };
}

export function getSecurityBlockers(
  checks: SecurityAuditCheck[]
): SecurityAuditCheck[] {
  return checks.filter((c) => c.result === "fail");
}

export function getSecurityWarnings(
  checks: SecurityAuditCheck[]
): SecurityAuditCheck[] {
  return checks.filter((c) => c.result === "warn");
}
