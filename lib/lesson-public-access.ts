import { getLessonById, getLocalLessonById } from "@/lib/content";
import { getLessonPublishStatus } from "@/lib/lesson-publish";
import { isAdminPreviewParam } from "@/lib/preview-params";
import { isCurrentUserAdminServer } from "@/lib/supabase/admin-server";
import { getSupabaseLessonByIdWithClient } from "@/lib/supabase/content";
import { hasSupabaseConfig } from "@/lib/supabase/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { LessonContent, LessonPublishStatus } from "@/types/lesson-content";

export type LessonPageAccess =
  | { kind: "not_found" }
  | {
      kind: "unavailable";
      lesson: LessonContent;
      publishStatus: LessonPublishStatus;
      showAdminLink: boolean;
      showAdminPreviewLink: boolean;
    }
  | { kind: "ok"; lesson: LessonContent; adminPreview: boolean };

async function loadLessonForAdminPreview(
  lessonId: string
): Promise<LessonContent | undefined> {
  if (!hasSupabaseConfig) {
    return getLocalLessonById(lessonId);
  }

  const client = await createServerSupabaseClient();
  if (!client) {
    return getLessonById(lessonId);
  }

  try {
    const lesson = await getSupabaseLessonByIdWithClient(lessonId, client);
    if (lesson) {
      return lesson;
    }
  } catch {
    // Fall through to default loader.
  }

  return getLessonById(lessonId);
}

export async function resolveLessonPageAccess(
  lessonId: string,
  options?: { preview?: string | string[] }
): Promise<LessonPageAccess> {
  const wantsAdminPreview = isAdminPreviewParam(options?.preview);

  let lesson = await getLessonById(lessonId);

  if (!lesson) {
    return { kind: "not_found" };
  }

  const publishStatus = getLessonPublishStatus(lesson);
  const isAdmin = await isCurrentUserAdminServer();
  const adminPreview = wantsAdminPreview && isAdmin;

  if (adminPreview) {
    const fullLesson = await loadLessonForAdminPreview(lessonId);
    if (fullLesson) {
      lesson = fullLesson;
    }
    return { kind: "ok", lesson, adminPreview: true };
  }

  if (publishStatus !== "available") {
    return {
      kind: "unavailable",
      lesson,
      publishStatus,
      showAdminLink: isAdmin,
      showAdminPreviewLink: isAdmin && !wantsAdminPreview,
    };
  }

  return { kind: "ok", lesson, adminPreview: false };
}
