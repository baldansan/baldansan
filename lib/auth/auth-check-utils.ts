import { getSupabaseEnvPresence } from "@/lib/dev/local-debug";
import type { ClientAuthCheckResult } from "@/lib/auth/client-auth-check";

export function buildFallbackAuthCheckResult(
  route: string,
  error: string
): ClientAuthCheckResult {
  const env = getSupabaseEnvPresence();
  return {
    user: null,
    isAdmin: false,
    error,
    timedOut: true,
    supabaseConfigured: env.supabaseUrlPresent && env.supabaseAnonKeyPresent,
    sessionPresent: false,
    env,
  };
}

export function isAdminImportDevPreviewRoute(pathname: string): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    pathname.startsWith("/admin/import")
  );
}
