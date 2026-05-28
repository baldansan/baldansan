import { getCurrentUser } from "@/lib/supabase/auth";
import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";

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

export async function getAdminProfileByUserId(
  userId: string
): Promise<AdminProfile | null> {
  if (!supabase || !hasSupabaseConfig || !userId) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("admin_profiles")
      .select("user_id, role, created_at")
      .eq("user_id", userId)
      .maybeSingle();

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

export async function getCurrentAdminProfile(): Promise<AdminProfile | null> {
  const { data: user, error } = await getCurrentUser();
  if (error || !user?.id) {
    return null;
  }

  return getAdminProfileByUserId(user.id);
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  const profile = await getCurrentAdminProfile();
  return isAdminRole(profile?.role);
}
