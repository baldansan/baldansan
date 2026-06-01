import { withTimeout, AsyncTimeoutError } from "@/lib/async/with-timeout";
import { authDevLog } from "@/lib/auth/auth-dev-log";
import { getSupabaseEnvPresence } from "@/lib/dev/local-debug";
import { isCurrentUserAdmin } from "@/lib/supabase/admin";
import { getCurrentUser, hasSupabaseConfig } from "@/lib/supabase/auth";
import type { AuthUser } from "@/types/auth";

export const CLIENT_AUTH_CHECK_TIMEOUT_MS = 8000;

export type ClientAuthCheckResult = {
  user: AuthUser | null;
  userEmail?: string;
  isAdmin: boolean;
  error: string | null;
  timedOut: boolean;
  supabaseConfigured: boolean;
  sessionPresent: boolean;
  env: {
    supabaseUrlPresent: boolean;
    supabaseAnonKeyPresent: boolean;
  };
};

export async function runClientAuthCheck(options?: {
  includeAdmin?: boolean;
  timeoutMs?: number;
  route?: string;
}): Promise<ClientAuthCheckResult> {
  const timeoutMs = options?.timeoutMs ?? CLIENT_AUTH_CHECK_TIMEOUT_MS;
  const includeAdmin = options?.includeAdmin ?? false;
  const route =
    options?.route ??
    (typeof window !== "undefined" ? window.location.pathname : "unknown");
  const env = getSupabaseEnvPresence();

  authDevLog("auth check started", { route, includeAdmin, timeoutMs });

  if (!hasSupabaseConfig) {
    authDevLog("supabase config missing");
    return {
      user: null,
      isAdmin: false,
      error: "Supabase тохиргоо дутуу байна",
      timedOut: false,
      supabaseConfigured: false,
      sessionPresent: false,
      env,
    };
  }

  try {
    const { data: user, error: authError } = await withTimeout(
      getCurrentUser(),
      timeoutMs,
      "getCurrentUser"
    );

    authDevLog("session loaded", {
      route,
      sessionPresent: Boolean(user),
      userEmail: user?.email,
      authError,
    });

    let isAdmin = false;
    if (includeAdmin && user) {
      isAdmin = await withTimeout(
        isCurrentUserAdmin(),
        timeoutMs,
        "isCurrentUserAdmin"
      );
      authDevLog("admin check result", { route, isAdmin });
    }

    if (authError && !user) {
      return {
        user: null,
        userEmail: undefined,
        isAdmin: false,
        error: authError,
        timedOut: false,
        supabaseConfigured: true,
        sessionPresent: false,
        env,
      };
    }

    return {
      user,
      userEmail: user?.email,
      isAdmin,
      error: null,
      timedOut: false,
      supabaseConfigured: true,
      sessionPresent: Boolean(user),
      env,
    };
  } catch (error) {
    const timedOut = error instanceof AsyncTimeoutError;
    const message = timedOut
      ? "Auth шалгалт хэт удаж байна"
      : error instanceof Error
        ? error.message
        : "Auth шалгалт амжилтгүй";

    authDevLog("auth check error", { route, timedOut, message, error });

    return {
      user: null,
      isAdmin: false,
      error: message,
      timedOut,
      supabaseConfigured: env.supabaseUrlPresent && env.supabaseAnonKeyPresent,
      sessionPresent: false,
      env,
    };
  }
}
