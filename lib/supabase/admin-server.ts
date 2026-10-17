import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";
import { isAdminRole } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
/** Dev-only diagnostics — never log user ids/roles in production. */
const debugWarn: (...args: unknown[]) => void =
  process.env.NODE_ENV === "development" ? console.warn : () => {};

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

/**
 * @supabase/ssr нь session-ийг `sb-<project-ref>-auth-token[.N]` cookie-д хадгалдаг.
 * Ийм cookie огт байхгүй бол зочин (anonymous) — auth.getUser() сүлжээний дуудлага хийх хэрэггүй.
 */
async function hasSupabaseAuthCookie(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    return cookieStore.getAll().some((cookie) => cookie.name.startsWith("sb-"));
  } catch {
    // cookies() боломжгүй контекст — хуучин зам (сүлжээгээр шалгана).
    return true;
  }
}

/**
 * Server Components: reads session from request cookies.
 *
 * React `cache()` — нэг request дотор олон удаа дуудагдвал (page + loader + layout)
 * Supabase auth/RPC руу нэг л удаа явна. Зочинд (sb- cookie-гүй) сүлжээний дуудлагагүйгээр false.
 */
export const isCurrentUserAdminServer = cache(
  async function isCurrentUserAdminServer(): Promise<boolean> {
    if (!(await hasSupabaseAuthCookie())) {
      return false;
    }
    return isCurrentUserAdminServerUncached();
  }
);

async function isCurrentUserAdminServerUncached(): Promise<boolean> {
  const client = await createServerSupabaseClient();
  if (!client) {
    return false;
  }

  try {
    const userId = await resolveServerUserId(client);
    if (!userId) {
      debugWarn("[admin-server] No authenticated user for admin check");
      return false;
    }

    const { data: isAdminRpc, error: rpcError } = await client.rpc("is_admin");
    if (!rpcError && typeof isAdminRpc === "boolean") {
      debugWarn("[admin-server] Admin check via is_admin RPC", {
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
      debugWarn("[admin-server] Admin profile lookup failed", {
        userId,
        message: profileError?.message ?? "no profile row",
      });
      return false;
    }

    const isAdmin = isAdminRole(profile.role);
    debugWarn("[admin-server] Admin check via admin_profiles", {
      userId,
      role: profile.role,
      isAdmin,
    });
    return isAdmin;
  } catch (error) {
    debugWarn("[admin-server] Admin check failed", { error });
    return false;
  }
}
