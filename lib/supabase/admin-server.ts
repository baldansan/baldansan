import "server-only";

import { isAdminRole } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/** Server Components: reads session from request cookies. */
export async function isCurrentUserAdminServer(): Promise<boolean> {
  const client = await createServerSupabaseClient();
  if (!client) {
    return false;
  }

  try {
    const { data, error } = await client.auth.getUser();
    if (error || !data.user?.id) {
      return false;
    }

    const { data: profile, error: profileError } = await client
      .from("admin_profiles")
      .select("role")
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return false;
    }

    return isAdminRole(profile.role);
  } catch {
    return false;
  }
}
