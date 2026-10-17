import { NextResponse } from "next/server";
import { revalidateCatalog, revalidateLesson } from "@/lib/cache/catalog-revalidate";
import { isCurrentUserAdminServer } from "@/lib/supabase/admin-server";
import { hasServerSupabaseConfig } from "@/lib/supabase/server";

/**
 * POST /api/admin/cache — нийтийн каталогийн кэшийг (хичээл/курс/mock test/бичлэг) шууд хуучруулна.
 * Admin цонхоос хичээлийн төлөв (draft→available) өөрчилсний дараа 120с хүлээхгүй харуулахад.
 * Body `{ lessonId }` өгвөл зөвхөн тэр хичээлийн агуулга (`lesson:<id>`) + хичээлийн жагсаалтыг
 * хуучруулна — browser талын admin бичлэг (logAdminActivity) үүнийг автоматаар дуудна.
 */
export async function POST(request: Request) {
  if (!hasServerSupabaseConfig) {
    return NextResponse.json({ error: "Supabase тохируулагдаагүй." }, { status: 503 });
  }
  if (!(await isCurrentUserAdminServer())) {
    return NextResponse.json({ error: "Admin эрх шаардлагатай." }, { status: 403 });
  }
  let lessonId: string | null = null;
  try {
    const body = (await request.json()) as { lessonId?: unknown } | null;
    if (typeof body?.lessonId === "string" && body.lessonId.trim()) {
      lessonId = body.lessonId.trim();
    }
  } catch {
    // body байхгүй → бүх каталогийг хуучруулна.
  }

  if (lessonId) {
    revalidateLesson(lessonId);
    revalidateCatalog(["courses"]);
  } else {
    revalidateCatalog();
  }
  return NextResponse.json({ ok: true, lessonId });
}
