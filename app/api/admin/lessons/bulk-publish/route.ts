import { NextResponse } from "next/server";
import { getAdminLessonsByCourseId } from "@/lib/admin/lesson-fetch";
import { createServerSupabaseClient, hasServerSupabaseConfig } from "@/lib/supabase/server";
import { isCurrentUserAdminServer } from "@/lib/supabase/admin-server";
import { revalidateCatalog } from "@/lib/cache/catalog-revalidate";

/**
 * Admin POST: publish every `draft` lesson in the given course(s) in one call.
 * Body: { courseIds: string[] }
 *
 * For bulk-importing a whole textbook at once (e.g. fazhan packages) where a
 * human will review content quality after the fact rather than lesson-by-
 * lesson before publish — skips the per-lesson "readyToPublish" UI gate
 * (that's a button-disable heuristic in PublishingControls, not something
 * the DB write itself enforces).
 *
 * Writes directly with the cookie-authenticated server Supabase client
 * (same session/RLS as the logged-in admin) rather than reusing
 * lib/supabase/admin-content.ts's updateLessonStatus — that module is built
 * to run client-side (it checks admin status via the browser's own anon-key
 * Supabase session) and returns "Admin эрх шаардлагатай" when called from a
 * Node server context, even though the request itself is from an
 * authenticated admin.
 */
export async function POST(request: Request) {
  if (!hasServerSupabaseConfig) {
    return NextResponse.json({ error: "Supabase not configured." }, { status: 503 });
  }

  const isAdmin = await isCurrentUserAdminServer();
  if (!isAdmin) {
    return NextResponse.json({ error: "Admin эрх шаардлагатай." }, { status: 403 });
  }

  const client = await createServerSupabaseClient();
  if (!client) {
    return NextResponse.json({ error: "Supabase client үүсгэж чадсангүй." }, { status: 503 });
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
      const { error: statusError } = await client
        .from("lessons")
        .update({ status: "available" })
        .eq("id", lesson.id);

      if (statusError) {
        results.push({
          courseId,
          lessonId: lesson.id,
          ok: false,
          error: statusError.message,
        });
        continue;
      }

      const { error: releaseError } = await client
        .from("lessons")
        .update({ release_status: "published" })
        .eq("id", lesson.id);

      results.push({
        courseId,
        lessonId: lesson.id,
        ok: true,
        ...(releaseError
          ? { error: `published; release sync warning: ${releaseError.message}` }
          : {}),
      });
    }
  }

  const published = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;

  if (published > 0) {
    revalidateCatalog(["lessons", "courses"]);
  }

  return NextResponse.json({
    ok: failed === 0,
    published,
    failed,
    results,
  });
}
