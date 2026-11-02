import { NextResponse } from "next/server";
import { createServerSupabaseClient, hasServerSupabaseConfig } from "@/lib/supabase/server";
import { isCurrentUserAdminServer } from "@/lib/supabase/admin-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Cookie session-оор admin эсэхийг сервер талд шалгана — AdminGuard-ын client шалгалт унавал fallback. */
export async function GET() {
  if (!hasServerSupabaseConfig) return NextResponse.json({ ok: false, isAdmin: false, reason: "not-configured" });
  try {
    const client = await createServerSupabaseClient();
    const { data } = client ? await client.auth.getUser() : { data: { user: null } };
    const userId = data.user?.id ?? null;
    const isAdmin = userId ? await isCurrentUserAdminServer() : false;
    return NextResponse.json({ ok: true, isAdmin, userId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ ok: false, isAdmin: false, reason: error instanceof Error ? error.message : "error" });
  }
}
