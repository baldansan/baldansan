import { NextResponse } from "next/server";
import { createServerSupabaseClient, hasServerSupabaseConfig } from "@/lib/supabase/server";
import { isCurrentUserAdminServer } from "@/lib/supabase/admin-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Admin POST: feedback мөрийг «Засагдсан ✓» / буцаах.
 * Body: { ids: string[], resolved: boolean }  (078 migration: resolved_at, resolved_by)
 */
export async function POST(request: Request) {
  if (!hasServerSupabaseConfig) {
    return NextResponse.json({ error: "Supabase not configured." }, { status: 503 });
  }
  if (!(await isCurrentUserAdminServer())) {
    return NextResponse.json({ error: "Admin эрх шаардлагатай." }, { status: 403 });
  }
  const client = await createServerSupabaseClient();
  if (!client) return NextResponse.json({ error: "Supabase client алга." }, { status: 503 });

  let body: { ids?: unknown; resolved?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Буруу JSON." }, { status: 400 });
  }
  const ids = Array.isArray(body.ids) ? body.ids.filter((v): v is string => typeof v === "string" && v.length > 0) : [];
  if (ids.length === 0) return NextResponse.json({ error: "ids хоосон." }, { status: 400 });
  const resolved = body.resolved !== false;

  const { data: userData } = await client.auth.getUser();
  const { error } = await client
    .from("feedback")
    .update({ resolved_at: resolved ? new Date().toISOString() : null, resolved_by: resolved ? (userData.user?.id ?? null) : null })
    .in("id", ids);
  if (error) {
    const migrationMissing = /column|schema cache/i.test(error.message);
    return NextResponse.json(
      { error: migrationMissing ? "078_feedback_resolved.sql migration ажиллуулаагүй байна." : error.message },
      { status: migrationMissing ? 409 : 500 }
    );
  }
  return NextResponse.json({ ok: true, count: ids.length, resolved });
}
