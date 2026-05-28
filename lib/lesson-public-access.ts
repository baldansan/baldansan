import { getAdminLessonById } from "@/lib/admin/lesson-fetch";
import { getLessonById } from "@/lib/content";
import { getLessonPublishStatus } from "@/lib/lesson-publish";
import { isAdminPreviewParam } from "@/lib/preview-params";
import { isCurrentUserAdminServer } from "@/lib/supabase/admin-server";
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

export async function resolveLessonPageAccess(
  lessonId: string,
  options?: { preview?: string | string[] }
): Promise<LessonPageAccess> {
  const wantsAdminPreview = isAdminPreviewParam(options?.preview);
  const isAdmin = await isCurrentUserAdminServer();

  let lesson = await getLessonById(lessonId);

  if (!lesson && isAdmin) {
    lesson = await getAdminLessonById(lessonId);
  }

  if (!lesson) {
    return { kind: "not_found" };
  }

  const publishStatus = getLessonPublishStatus(lesson);
  const adminPreview = wantsAdminPreview && isAdmin;

  if (adminPreview) {
    const fullLesson = await getAdminLessonById(lessonId);
    if (fullLesson) {
      lesson = fullLesson;
    }
    return { kind: "ok", lesson, adminPreview: true };
  }

  if (publishStatus !== "available") {
    if (isAdmin) {
      const adminLesson = await getAdminLessonById(lessonId);
      if (adminLesson) {
        lesson = adminLesson;
      }
    }

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
