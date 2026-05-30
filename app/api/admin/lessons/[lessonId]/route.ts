import { NextResponse } from "next/server";
import { getAdminLessonById } from "@/lib/admin/lesson-fetch";
import { normalizeLessonRouteId } from "@/lib/lesson-id";
import { isCurrentUserAdminServer } from "@/lib/supabase/admin-server";
import { hasServerSupabaseConfig } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ lessonId: string }> };

/** Admin GET: load lesson by route id / lessonId (supports alphanumeric package ids). */
export async function GET(_request: Request, context: RouteContext) {
  if (!hasServerSupabaseConfig) {
    return NextResponse.json({ error: "Supabase not configured." }, { status: 503 });
  }

  const isAdmin = await isCurrentUserAdminServer();
  if (!isAdmin) {
    return NextResponse.json({ error: "Admin эрх шаардлагатай." }, { status: 403 });
  }

  const { lessonId } = await context.params;
  const normalizedId = normalizeLessonRouteId(lessonId);

  console.log("[api/admin/lessons] edit route lookup", { paramId: normalizedId });

  const lesson = await getAdminLessonById(normalizedId);
  if (!lesson) {
    return NextResponse.json(
      { error: `Lesson not found: ${normalizedId}` },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ok: true,
    lesson,
    id: lesson.id,
    lessonId: lesson.id,
  });
}
