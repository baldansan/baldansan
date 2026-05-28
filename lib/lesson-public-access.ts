import { getLessonById } from "@/lib/content";
import { getLessonPublishStatus } from "@/lib/lesson-publish";
import { isCurrentUserAdmin } from "@/lib/supabase/admin";
import type { LessonContent, LessonPublishStatus } from "@/types/lesson-content";

export type LessonPageAccess =
  | { kind: "not_found" }
  | {
      kind: "unavailable";
      lesson: LessonContent;
      publishStatus: LessonPublishStatus;
      showAdminLink: boolean;
    }
  | { kind: "ok"; lesson: LessonContent; adminPreview: boolean };

export async function resolveLessonPageAccess(
  lessonId: string,
  options?: { preview?: string }
): Promise<LessonPageAccess> {
  const lesson = await getLessonById(lessonId);

  if (!lesson) {
    return { kind: "not_found" };
  }

  const publishStatus = getLessonPublishStatus(lesson);
  const isAdmin = await isCurrentUserAdmin();
  const adminPreview = options?.preview === "admin" && isAdmin;

  if (publishStatus !== "available" && !adminPreview) {
    return {
      kind: "unavailable",
      lesson,
      publishStatus,
      showAdminLink: isAdmin,
    };
  }

  return { kind: "ok", lesson, adminPreview };
}
