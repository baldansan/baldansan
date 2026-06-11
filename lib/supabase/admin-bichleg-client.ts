import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { isCurrentUserAdminServer } from "@/lib/supabase/admin-server";
import {
  createServerSupabaseClient,
  hasServerSupabaseConfig,
} from "@/lib/supabase/server";
import {
  createServiceRoleSupabaseClient,
  hasServiceRoleSupabaseConfig,
} from "@/lib/supabase/service-role-server";

export type AdminBichlegClientResult =
  | { ok: true; client: SupabaseClient }
  | { ok: false; status: number; error: string };

/**
 * Бичлэг admin API: локалд service_role, Vercel дээр admin JWT (migration 039).
 */
export async function getAdminBichlegSupabaseClient(): Promise<AdminBichlegClientResult> {
  if (!hasServerSupabaseConfig) {
    return { ok: false, status: 503, error: "Supabase тохируулагдаагүй." };
  }

  const isAdmin = await isCurrentUserAdminServer();
  if (!isAdmin) {
    return { ok: false, status: 403, error: "Admin эрх шаардлагатай." };
  }

  if (hasServiceRoleSupabaseConfig) {
    const serviceClient = createServiceRoleSupabaseClient();
    if (serviceClient) {
      return { ok: true, client: serviceClient };
    }
  }

  const serverClient = await createServerSupabaseClient();
  if (!serverClient) {
    return {
      ok: false,
      status: 503,
      error: "Supabase клиент үүсгэж чадсангүй.",
    };
  }

  return { ok: true, client: serverClient };
}
