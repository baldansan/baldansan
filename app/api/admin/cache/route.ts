import { NextResponse } from "next/server";
import { revalidateCatalog } from "@/lib/cache/catalog-revalidate";
import { isCurrentUserAdminServer } from "@/lib/supabase/admin-server";
import { hasServerSupabaseConfig } from "@/lib/supabase/server";

/**
 * POST /api/admin/cache — нийтийн каталогийн кэшийг (хичээл/курс/mock test/бичлэг) шууд хуучруулна.
 * Admin цонхоос хичээлийн төлөв (draft→available) өөрчилсний дараа 120с хүлээхгүй харуулахад.
 */
export async function POST() {
  if (!hasServerSupabaseConfig) {
    return NextResponse.json({ error: "Supabase тохируулагдаагүй." }, { status: 503 });
  }
  if (!(await isCurrentUserAdminServer())) {
    return NextResponse.json({ error: "Admin эрх шаардлагатай." }, { status: 403 });
  }
  revalidateCatalog();
  return NextResponse.json({ ok: true });
}
