import type {
  AuthChangeEvent,
  AuthError,
  Session,
} from "@supabase/supabase-js";
import { AsyncTimeoutError, withTimeout } from "@/lib/async/with-timeout";
import { authDevLog } from "@/lib/auth/auth-dev-log";
import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";
import type { AuthUser } from "@/types/auth";

export type AuthResult<T> = {
  data: T | null;
  error: string | null;
};

const AUTH_REQUEST_TIMEOUT_MS = 8000;

const NOT_CONFIGURED_MESSAGE =
  "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.";

function toErrorMessage(error: AuthError | null): string | null {
  return error?.message ?? null;
}

function mapUser(user: { id: string; email?: string | null } | null): AuthUser | null {
  if (!user) {
    return null;
  }
  return {
    id: user.id,
    email: user.email ?? undefined,
  };
}

function notConfigured<T>(): AuthResult<T> {
  return { data: null, error: NOT_CONFIGURED_MESSAGE };
}

export async function getSession(): Promise<AuthResult<Session>> {
  if (!supabase) {
    return notConfigured();
  }

  authDevLog("getSession started");
  try {
    const { data, error } = await withTimeout(
      supabase.auth.getSession(),
      AUTH_REQUEST_TIMEOUT_MS,
      "getSession"
    );
    authDevLog("getSession loaded", { hasSession: Boolean(data.session), error });
    return {
      data: data.session,
      error: toErrorMessage(error),
    };
  } catch (error) {
    const message = formatAuthTransportError(error);
    authDevLog("getSession error", message);
    return { data: null, error: message };
  }
}

async function fetchCurrentUser(): Promise<AuthResult<AuthUser>> {
  const { data: sessionData, error: sessionError } = await withTimeout(
    supabase!.auth.getSession(),
    AUTH_REQUEST_TIMEOUT_MS,
    "getSession"
  );
  if (sessionData.session?.user) {
    return {
      data: mapUser(sessionData.session.user),
      error: null,
    };
  }

  const { data, error } = await withTimeout(
    supabase!.auth.getUser(),
    AUTH_REQUEST_TIMEOUT_MS,
    "getUser"
  );
  if (error) {
    return {
      data: null,
      error: toErrorMessage(error) ?? toErrorMessage(sessionError),
    };
  }

  return {
    data: mapUser(data.user),
    error: null,
  };
}

function formatAuthTransportError(error: unknown): string {
  if (error instanceof AsyncTimeoutError) {
    return "Auth session check timed out";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Auth request failed";
}

export async function getCurrentUser(): Promise<AuthResult<AuthUser>> {
  if (!supabase) {
    return notConfigured();
  }

  authDevLog("getCurrentUser started");
  try {
    const result = await withTimeout(
      fetchCurrentUser(),
      AUTH_REQUEST_TIMEOUT_MS,
      "getCurrentUser"
    );
    authDevLog("getCurrentUser loaded", {
      hasUser: Boolean(result.data),
      error: result.error,
    });
    return result;
  } catch (error) {
    const message = formatAuthTransportError(error);
    authDevLog("getCurrentUser error", message);
    return { data: null, error: message };
  }
}

/** User id from the active Supabase session (for RLS writes). */
export async function getAuthenticatedUserId(): Promise<{
  userId: string | null;
  error: string | null;
}> {
  if (!supabase) {
    return { userId: null, error: NOT_CONFIGURED_MESSAGE };
  }

  authDevLog("getAuthenticatedUserId started");
  try {
    const { data: sessionData, error: sessionError } = await withTimeout(
      supabase.auth.getSession(),
      AUTH_REQUEST_TIMEOUT_MS,
      "getSession"
    );
    if (sessionData.session?.user?.id) {
      authDevLog("getAuthenticatedUserId loaded from session");
      return { userId: sessionData.session.user.id, error: null };
    }

    const { data, error: userError } = await withTimeout(
      supabase.auth.getUser(),
      AUTH_REQUEST_TIMEOUT_MS,
      "getUser"
    );
    if (data.user?.id) {
      authDevLog("getAuthenticatedUserId loaded from getUser");
      return { userId: data.user.id, error: null };
    }

    return {
      userId: null,
      error:
        toErrorMessage(userError) ??
        toErrorMessage(sessionError) ??
        "Session not found",
    };
  } catch (error) {
    const message = formatAuthTransportError(error);
    authDevLog("getAuthenticatedUserId error", message);
    return { userId: null, error: message };
  }
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<AuthResult<AuthUser>> {
  if (!supabase) {
    return notConfigured();
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  return {
    data: mapUser(data.user),
    error: toErrorMessage(error),
  };
}

export async function signUpWithEmail(
  email: string,
  password: string
): Promise<AuthResult<AuthUser>> {
  if (!supabase) {
    return notConfigured();
  }

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
  });

  return {
    data: mapUser(data.user),
    error: toErrorMessage(error),
  };
}

export async function signOut(): Promise<AuthResult<null>> {
  if (!supabase) {
    return notConfigured();
  }

  const { error } = await supabase.auth.signOut();
  return {
    data: null,
    error: toErrorMessage(error),
  };
}

export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void
): () => void {
  if (!supabase) {
    return () => {};
  }

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(callback);

  return () => subscription.unsubscribe();
}

export { hasSupabaseConfig };
