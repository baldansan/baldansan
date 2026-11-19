import { NextResponse } from "next/server";
import { getAdminServiceRoleSupabaseClient } from "@/lib/supabase/admin-service-role-client";
import { buildRows } from "@/lib/bichleg/youtube/build";

export const maxDuration = 300;

/** Хятад мөрүүд → үгээр задалсан, пиньинь + үгийн утгатай мөрүүд. */
export async function POST(request: Request) {
  const admin = await getAdminServiceRoleSupabaseClient();
  if (!admin.ok) {
    return NextResponse.json({ ok: false, error: admin.error }, { status: admin.status });
  }

  let body: { lines?: string[] };
  try {
    body = (await request.json()) as { lines?: string[] };
  } catch {
    return NextResponse.json({ ok: false, error: "JSON бие буруу байна." }, { status: 400 });
  }

  const lines = (body.lines ?? []).map(String).slice(0, 250);
  if (!lines.length) {
    return NextResponse.json({ ok: false, error: "Мөр алга." }, { status: 400 });
  }

  try {
    const result = await buildRows(admin.client, lines);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[api/admin/bichleg/youtube/build]", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Үг задлахад алдаа гарлаа." },
      { status: 500 }
    );
  }
}
