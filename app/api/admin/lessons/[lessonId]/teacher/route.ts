import { NextResponse } from "next/server";
import {
  loadLessonTeacherOverlay,
  saveLessonTeacherOverlay,
  type TeacherOverlayAdminState,
} from "@/lib/supabase/admin-teacher-overlay";
import { normalizeLessonRouteId } from "@/lib/lesson-id";
import { isCurrentUserAdminServer } from "@/lib/supabase/admin-server";
import { hasServerSupabaseConfig } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ lessonId: string }> };

async function guardAdmin() {
  if (!hasServerSupabaseConfig) {
    return NextResponse.json({ error: "Supabase тохируулагдаагүй." }, { status: 503 });
  }
  const isAdmin = await isCurrentUserAdminServer();
  if (!isAdmin) {
    return NextResponse.json({ error: "Admin эрх шаардлагатай." }, { status: 403 });
  }
  return null;
}

export async function GET(_request: Request, context: RouteContext) {
  const denied = await guardAdmin();
  if (denied) return denied;

  const { lessonId } = await context.params;
  const normalizedId = normalizeLessonRouteId(lessonId);
  const result = await loadLessonTeacherOverlay(normalizedId);

  if (result.error) {
    const status = result.error.includes("олдсонгүй") ? 404 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ ok: true, overlay: result.data });
}

export async function PATCH(request: Request, context: RouteContext) {
  const denied = await guardAdmin();
  if (denied) return denied;

  const { lessonId } = await context.params;
  const normalizedId = normalizeLessonRouteId(lessonId);

  let body: { overlay?: TeacherOverlayAdminState };
  try {
    body = (await request.json()) as { overlay?: TeacherOverlayAdminState };
  } catch {
    return NextResponse.json({ error: "JSON буруу байна." }, { status: 400 });
  }

  if (!body.overlay) {
    return NextResponse.json({ error: "overlay талбар шаардлагатай." }, { status: 400 });
  }

  const result = await saveLessonTeacherOverlay(normalizedId, body.overlay);
  if (result.error) {
    const status = result.error.includes("олдсонгүй") ? 404 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ ok: true, id: result.data?.id });
}
