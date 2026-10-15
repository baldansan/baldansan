import { NextResponse } from "next/server";
import { getAdminLessonsByCourseId } from "@/lib/admin/lesson-fetch";
import { isCurrentUserAdminServer } from "@/lib/supabase/admin-server";
import { hasServerSupabaseConfig } from "@/lib/supabase/server";
import { updateLessonStatus } from "@/lib/supabase/admin-content";
import { syncReleaseOnPublish } from "@/lib/supabase/admin-release";

/**
 * Admin POST: publish every `draft` lesson in the given course(s) in one call.
 * Body: { courseIds: string[] }
 *
 * For bulk-importing a whole textbook at once (e.g. fazhan packages) where a
 * human will review content quality after the fact rather than lesson-by-
 * lesson before publish — skips the per-lesson "readyToPublish" UI gate
 * (that's a button-disable heuristic in PublishingControls, not an
 * invariant updateLessonStatus itself enforces) but keeps the same
 * admin-auth gate and release-status sync as the normal publish button.
 */
export async function POST(request: Request) {
  if (!hasServerSupabaseConfig) {
    return NextResponse.json({ error: "Supabase not configured." }, { status: 503 });
  }

  const isAdmin = await isCurrentUserAdminServer();
  if (!isAdmin) {
    return NextResponse.json({ error: "Admin эрх шаардлагатай." }, { status: 403 });
  }

  let body: { courseIds?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Буруу JSON body." }, { status: 400 });
  }

  const courseIds = Array.isArray(body.courseIds)
    ? body.courseIds.filter((v): v is string => typeof v === "string" && v.length > 0)
    : [];

  if (courseIds.length === 0) {
    return NextResponse.json({ error: "courseIds массив хоосон байна." }, { status: 400 });
  }

  const results: Array<{
    courseId: string;
    lessonId: string;
    ok: boolean;
    error?: string;
  }> = [];

  for (const courseId of courseIds) {
    const lessons = await getAdminLessonsByCourseId(courseId);
    const drafts = lessons.filter((lesson) => lesson.publishStatus === "draft");

    for (const lesson of drafts) {
      const result = await updateLessonStatus(lesson.id, "available");
      if (result.error) {
        results.push({ courseId, lessonId: lesson.id, ok: false, error: result.error });
        continue;
      }
      const sync = await syncReleaseOnPublish(lesson.id);
      results.push({
        courseId,
        lessonId: lesson.id,
        ok: true,
        ...(sync.error ? { error: `published; release sync warning: ${sync.error}` } : {}),
      });
    }
  }

  const published = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;

  return NextResponse.json({
    ok: failed === 0,
    published,
    failed,
    results,
  });
}
