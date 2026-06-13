import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { isCurrentUserAdminServer } from "@/lib/supabase/admin-server";
import { hasServerSupabaseConfig } from "@/lib/supabase/server";
import {
  createServiceRoleSupabaseClient,
  hasServiceRoleSupabaseConfig,
} from "@/lib/supabase/service-role-server";

export type AdminServiceRoleClientResult =
  | { ok: true; client: SupabaseClient }
  | { ok: false; status: number; error: string };

/** Vercel / production admin import — server-only env var. */
export const ADMIN_SERVICE_ROLE_ENV_HINT =
  "Vercel → Settings → Environment Variables дээр SUPABASE_SERVICE_ROLE_KEY нэмнэ үү " +
  "(утга: Supabase Dashboard → Settings → API → service_role). " +
  "Зөвхөн server route-д ашиглана — client bundle-д орохгүй.";

/**
 * Admin API route helper: session-ээр admin эсэхийг шалгаад service-role client буцаана.
 * RLS-ийг алгасах тул production импорт найдвартай ажиллана.
 */
export async function getAdminServiceRoleSupabaseClient(): Promise<AdminServiceRoleClientResult> {
  if (!hasServerSupabaseConfig) {
    return { ok: false, status: 503, error: "Supabase тохируулагдаагүй." };
  }

  const isAdmin = await isCurrentUserAdminServer();
  if (!isAdmin) {
    return { ok: false, status: 403, error: "Admin эрх шаардлагатай." };
  }

  if (!hasServiceRoleSupabaseConfig) {
    return {
      ok: false,
      status: 503,
      error: ADMIN_SERVICE_ROLE_ENV_HINT,
    };
  }

  const client = createServiceRoleSupabaseClient();
  if (!client) {
    return {
      ok: false,
      status: 503,
      error: ADMIN_SERVICE_ROLE_ENV_HINT,
    };
  }

  return { ok: true, client };
}
