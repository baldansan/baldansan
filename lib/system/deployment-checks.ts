import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";
import {
  getClientEnvStatus,
  type CheckResult,
} from "@/lib/system/system-checks";

export type DeploymentCheckItem = {
  id: string;
  label: string;
  result: CheckResult;
  detail?: string;
};

export type DeploymentCheckReport = {
  checks: DeploymentCheckItem[];
  ranAt: string;
  nodeEnv: string;
};

function item(
  id: string,
  label: string,
  result: CheckResult,
  detail?: string
): DeploymentCheckItem {
  return { id, label, result, detail };
}

function getNodeEnvLabel(): string {
  const env = process.env.NODE_ENV;
  if (env === "production") return "production";
  if (env === "development") return "development";
  if (env === "test") return "test";
  return env ?? "unknown";
}

async function canReadPublicCourses(): Promise<DeploymentCheckItem> {
  if (!hasSupabaseConfig || !supabase) {
    return item(
      "public-courses",
      "Can read public courses",
      "warn",
      "Supabase not configured — local fallback active."
    );
  }

  const { data, error } = await supabase
    .from("courses")
    .select("id, title")
    .limit(5);

  if (error) {
    return item(
      "public-courses",
      "Can read public courses",
      "fail",
      error.message
    );
  }

  if (!data || data.length === 0) {
    return item(
      "public-courses",
      "Can read public courses",
      "warn",
      "Readable but no course rows found."
    );
  }

  return item(
    "public-courses",
    "Can read public courses",
    "pass",
    `${data.length} course row(s) readable.`
  );
}

async function canReadAvailableHsk5Lessons(): Promise<DeploymentCheckItem> {
  if (!hasSupabaseConfig || !supabase) {
    return item(
      "hsk5-lessons",
      "Can read available HSK5 lessons",
      "warn",
      "Supabase not configured — local fallback active."
    );
  }

  const { data, error } = await supabase
    .from("lessons")
    .select("id, title, status")
    .eq("course_id", "hsk5")
    .eq("status", "available")
    .order("order_index")
    .limit(10);

  if (error) {
    return item(
      "hsk5-lessons",
      "Can read available HSK5 lessons",
      "fail",
      error.message
    );
  }

  if (!data || data.length === 0) {
    return item(
      "hsk5-lessons",
      "Can read available HSK5 lessons",
      "warn",
      "No available HSK5 lessons — publish at least one for smoke test."
    );
  }

  return item(
    "hsk5-lessons",
    "Can read available HSK5 lessons",
    "pass",
    `${data.length} available lesson(s) found.`
  );
}

/** Public-safe deployment smoke checks — no secrets, no admin data. */
export async function runDeploymentChecks(): Promise<DeploymentCheckReport> {
  const env = getClientEnvStatus();

  const checks: DeploymentCheckItem[] = [
    item("app-rendered", "App rendered", "pass", "Deployment check page loaded."),
    item(
      "env-url",
      "Supabase URL configured",
      env.supabaseUrl === "configured" ? "pass" : "warn",
      env.supabaseUrl === "configured" ? "Yes." : "No — local fallback active."
    ),
    item(
      "env-anon-key",
      "Supabase anon key configured",
      env.supabaseAnonKey === "configured" ? "pass" : "warn",
      env.supabaseAnonKey === "configured" ? "Yes." : "No — local fallback active."
    ),
    await canReadPublicCourses(),
    await canReadAvailableHsk5Lessons(),
    item(
      "node-env",
      "Current environment",
      "pass",
      getNodeEnvLabel()
    ),
  ];

  return {
    checks,
    ranAt: new Date().toISOString(),
    nodeEnv: getNodeEnvLabel(),
  };
}
