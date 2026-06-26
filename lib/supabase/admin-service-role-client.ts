import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { isCurrentUserAdminServer } from "@/lib/supabase/admin-server";
import { hasServerSupabaseConfig, createServerSupabaseClient } from "@/lib/supabase/server";
import {
  createServiceRoleSupabaseClient,
  hasServiceRoleSupabaseConfig,
} from "@/lib/supabase/service-role-server";

export type AdminServiceRoleClientResult =
  | { ok: true; client: SupabaseClient; mode: "service_role" | "admin_session" }
  | { ok: false; status: number; error: string };

/** Vercel / production admin import — server-only env var (optional if admin session works). */
export const ADMIN_SERVICE_ROLE_ENV_HINT =
  "Vercel → Settings → Environment Variables дээр SUPABASE_SERVICE_ROLE_KEY нэмнэ үү " +
  "(утга: Supabase Dashboard → Settings → API → service_role). " +
  "Зөвхөн server route-д ашиглана — client bundle-д орохгүй. " +
  "Эсвэл admin эрхтэйгээр нэвтэрсэн байхад импорт admin session-ээр ажиллана.";

/**
 * Admin API route helper: session-ээр admin эсэхийг шалгаад Supabase client буцаана.
 * Service role байвал түүнийг ашиглана; үгүй бол admin JWT (cookies) ашиглана.
 */
export async function getAdminServiceRoleSupabaseClient(): Promise<AdminServiceRoleClientResult> {
  if (!hasServerSupabaseConfig) {
    return { ok: false, status: 503, error: "Supabase тохируулагдаагүй." };
  }

  const isAdmin = await isCurrentUserAdminServer();
  if (!isAdmin) {
    return { ok: false, status: 403, error: "Admin эрх шаардлагатай." };
  }

  if (hasServiceRoleSupabaseConfig) {
    const client = createServiceRoleSupabaseClient();
    if (client) {
      return { ok: true, client, mode: "service_role" };
    }
  }

  const sessionClient = await createServerSupabaseClient();
  if (!sessionClient) {
    return {
      ok: false,
      status: 503,
      error: ADMIN_SERVICE_ROLE_ENV_HINT,
    };
  }

  return { ok: true, client: sessionClient, mode: "admin_session" };
}
