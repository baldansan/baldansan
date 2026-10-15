import "server-only";

import { isCurrentUserAdminServer } from "@/lib/supabase/admin-server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type DashboardAccess = "ok" | "login" | "denied" | "unconfigured";

/**
 * Director pages: app admin, or an active organization member whose role is
 * owner / manager (the roles migrations 012–013 give management rights;
 * "admin" is accepted too in case a deployment stores it). Reuses
 * `isCurrentUserAdminServer` and the same role set as `canManageOrganization`.
 */
export async function checkDashboardAccess(orgId: string): Promise<DashboardAccess> {
  const client = await createServerSupabaseClient();
  if (!client) return "unconfigured";
  const { data } = await client.auth.getUser();
  const userId = data.user?.id;
  if (!userId) return "login";
  if (await isCurrentUserAdminServer()) return "ok";
  const { data: member } = await client
    .from("organization_members")
    .select("role, status")
    .eq("organization_id", orgId)
    .eq("user_id", userId)
    .in("status", ["active", "invited"])
    .maybeSingle();
  const role = String(member?.role ?? "");
  return role === "owner" || role === "manager" || role === "admin" ? "ok" : "denied";
}
