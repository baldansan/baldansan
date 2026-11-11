import { NextResponse } from "next/server";
import { revalidateCatalog } from "@/lib/cache/catalog-revalidate";
import { getAdminServiceRoleSupabaseClient } from "@/lib/supabase/admin-service-role-client";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/mock-tests/active  { id: "H11329", is_active: false }
 * Тестийг суралцагчийн жагсаалтаас нуух/харуулах (084 is_active).
 */
export async function PATCH(request: Request) {
  const clientResult = await getAdminServiceRoleSupabaseClient();
  if (!clientResult.ok) {
    return NextResponse.json({ ok: false, error: clientResult.error }, { status: clientResult.status });
  }
  let body: { id?: string; is_active?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Буруу хүсэлт." }, { status: 400 });
  }
  const id = String(body.id ?? "").trim().toUpperCase();
  if (!id || typeof body.is_active !== "boolean") {
    return NextResponse.json({ ok: false, error: "id, is_active шаардлагатай." }, { status: 400 });
  }
  const { error } = await clientResult.client
    .from("mock_tests")
    .update({ is_active: body.is_active })
    .eq("id", id);
  if (error) {
    const hint = /is_active/.test(error.message)
      ? " — supabase/migrations/084_mock_tests_is_active.sql-ийг SQL Editor дээр ажиллуулна уу."
      : "";
    return NextResponse.json({ ok: false, error: error.message + hint }, { status: 500 });
  }
  revalidateCatalog(["mockTests"]);
  return NextResponse.json({ ok: true, id, is_active: body.is_active });
}
