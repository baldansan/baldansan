import "server-only";

import {
  getAdminServiceRoleSupabaseClient,
  type AdminServiceRoleClientResult,
} from "@/lib/supabase/admin-service-role-client";

export type AdminBichlegClientResult = AdminServiceRoleClientResult;

/** @deprecated Use getAdminServiceRoleSupabaseClient — kept for bichleg admin routes. */
export async function getAdminBichlegSupabaseClient(): Promise<AdminBichlegClientResult> {
  return getAdminServiceRoleSupabaseClient();
}
