import type {
  AuthChangeEvent,
  AuthError,
  Session,
} from "@supabase/supabase-js";
import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";
import type { AuthUser } from "@/types/auth";

export type AuthResult<T> = {
  data: T | null;
  error: string | null;
};

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

  const { data, error } = await supabase.auth.getSession();
  return {
    data: data.session,
    error: toErrorMessage(error),
  };
}

export async function getCurrentUser(): Promise<AuthResult<AuthUser>> {
  const { data: session, error } = await getSession();
  if (error) {
    return { data: null, error };
  }

  return {
    data: mapUser(session?.user ?? null),
    error: null,
  };
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
