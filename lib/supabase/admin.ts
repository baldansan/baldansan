import { withTimeout, AsyncTimeoutError } from "@/lib/async/with-timeout";
import { authDevLog } from "@/lib/auth/auth-dev-log";
import { getCurrentUser } from "@/lib/supabase/auth";
import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

const ADMIN_CHECK_TIMEOUT_MS = 8000;
const ADMIN_PROFILE_QUERY_TIMEOUT_MS = 5000;

export type AdminProfile = {
  user_id: string;
  role: string;
  created_at: string | null;
};

const ADMIN_ROLES = new Set(["admin", "owner"]);

export function isAdminRole(role: string | null | undefined): boolean {
  if (!role) return false;
  return ADMIN_ROLES.has(role.toLowerCase());
}

async function getAdminProfileByUserIdWithClient(
  client: SupabaseClient,
  userId: string
): Promise<AdminProfile | null> {
  if (!userId) {
    return null;
  }

  try {
    const response = await withTimeout(
      Promise.resolve(
        client
          .from("admin_profiles")
          .select("user_id, role, created_at")
          .eq("user_id", userId)
          .maybeSingle()
      ),
      ADMIN_PROFILE_QUERY_TIMEOUT_MS,
      "admin_profiles lookup"
    );
    const { data, error } = response;

    if (error || !data) {
      return null;
    }

    return {
      user_id: data.user_id,
      role: data.role,
      created_at: data.created_at ?? null,
    };
  } catch {
    return null;
  }
}

export async function getAdminProfileByUserId(
  userId: string
): Promise<AdminProfile | null> {
  if (!supabase || !hasSupabaseConfig || !userId) {
    return null;
  }

  return getAdminProfileByUserIdWithClient(supabase, userId);
}

export async function getCurrentAdminProfile(): Promise<AdminProfile | null> {
  const { data: user, error } = await getCurrentUser();
  if (error || !user?.id) {
    return null;
  }

  return getAdminProfileByUserId(user.id);
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  authDevLog("isCurrentUserAdmin started");
  try {
    const profile = await withTimeout(
      getCurrentAdminProfile(),
      ADMIN_CHECK_TIMEOUT_MS,
      "isCurrentUserAdmin"
    );
    const isAdmin = isAdminRole(profile?.role);
    authDevLog("isCurrentUserAdmin result", { isAdmin });
    return isAdmin;
  } catch (error) {
    authDevLog("isCurrentUserAdmin error", error);
    if (error instanceof AsyncTimeoutError) {
      throw error;
    }
    return false;
  }
}
