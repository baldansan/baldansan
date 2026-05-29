import "server-only";

import { isAdminRole } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function resolveServerUserId(
  client: NonNullable<Awaited<ReturnType<typeof createServerSupabaseClient>>>
): Promise<string | null> {
  const { data: sessionData } = await client.auth.getSession();
  if (sessionData.session?.user?.id) {
    return sessionData.session.user.id;
  }

  const { data, error } = await client.auth.getUser();
  if (error || !data.user?.id) {
    return null;
  }

  return data.user.id;
}

/** Server Components: reads session from request cookies. */
export async function isCurrentUserAdminServer(): Promise<boolean> {
  const client = await createServerSupabaseClient();
  if (!client) {
    return false;
  }

  try {
    const userId = await resolveServerUserId(client);
    if (!userId) {
      console.warn("[admin-server] No authenticated user for admin check");
      return false;
    }

    const { data: isAdminRpc, error: rpcError } = await client.rpc("is_admin");
    if (!rpcError && typeof isAdminRpc === "boolean") {
      console.warn("[admin-server] Admin check via is_admin RPC", {
        userId,
        isAdmin: isAdminRpc,
      });
      return isAdminRpc;
    }

    const { data: profile, error: profileError } = await client
      .from("admin_profiles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileError || !profile) {
      console.warn("[admin-server] Admin profile lookup failed", {
        userId,
        message: profileError?.message ?? "no profile row",
      });
      return false;
    }

    const isAdmin = isAdminRole(profile.role);
    console.warn("[admin-server] Admin check via admin_profiles", {
      userId,
      role: profile.role,
      isAdmin,
    });
    return isAdmin;
  } catch (error) {
    console.warn("[admin-server] Admin check failed", { error });
    return false;
  }
}
