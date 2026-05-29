import { getAdminLessonById } from "@/lib/admin/lesson-fetch";
import { getPublicLessonById } from "@/lib/content";
import {
  lessonIdQueryCandidates,
  normalizeLessonRouteId,
} from "@/lib/lesson-id";
import { getLessonPublishStatus } from "@/lib/lesson-publish";
import { isAdminPreviewParam } from "@/lib/preview-params";
import { isCurrentUserAdminServer } from "@/lib/supabase/admin-server";
import {
  getLessonRouteStatus,
  lessonStubFromRouteStatus,
} from "@/lib/supabase/lesson-visibility";
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

function publishStatusFromRouteStatus(status: string): LessonPublishStatus {
  if (status === "available") return "available";
  if (status === "archived") return "archived";
  return "draft";
}

export async function resolveLessonPageAccess(
  lessonId: string,
  options?: { preview?: string | string[] }
): Promise<LessonPageAccess> {
  const normalizedId = normalizeLessonRouteId(lessonId);
  const wantsAdminPreview = isAdminPreviewParam(options?.preview);
  const isAdmin = await isCurrentUserAdminServer();

  console.warn("[lesson-access] Resolve lesson access", {
    lessonId: normalizedId,
    queryCandidates: lessonIdQueryCandidates(normalizedId),
    wantsAdminPreview,
    isAdmin,
  });

  if (wantsAdminPreview) {
    if (!isAdmin) {
      console.warn("[lesson-access] Admin preview denied (not admin)", {
        lessonId: normalizedId,
      });
    } else {
      const adminLesson = await getAdminLessonById(normalizedId);
      if (adminLesson) {
        console.warn("[lesson-access] Admin preview lesson loaded", {
          lessonId: normalizedId,
          resolvedId: adminLesson.id,
          publishStatus: getLessonPublishStatus(adminLesson),
        });
        return { kind: "ok", lesson: adminLesson, adminPreview: true };
      }
      console.warn("[lesson-access] Admin preview lesson not found", {
        lessonId: normalizedId,
      });
    }
  }

  if (isAdmin) {
    const adminLesson = await getAdminLessonById(normalizedId);
    if (adminLesson) {
      const publishStatus = getLessonPublishStatus(adminLesson);

      if (publishStatus === "available") {
        return { kind: "ok", lesson: adminLesson, adminPreview: false };
      }

      console.warn("[lesson-access] Unavailable lesson (admin)", {
        lessonId: normalizedId,
        publishStatus,
      });
      return {
        kind: "unavailable",
        lesson: adminLesson,
        publishStatus,
        showAdminLink: true,
        showAdminPreviewLink: true,
      };
    }
  }

  const publicLesson = await getPublicLessonById(normalizedId);
  if (publicLesson) {
    return { kind: "ok", lesson: publicLesson, adminPreview: false };
  }

  const routeStatus = await getLessonRouteStatus(normalizedId);
  if (routeStatus) {
    const publishStatus = publishStatusFromRouteStatus(routeStatus.status);

    if (publishStatus !== "available") {
      console.warn("[lesson-access] Unavailable lesson (route status)", {
        lessonId: normalizedId,
        status: routeStatus.status,
      });
      return {
        kind: "unavailable",
        lesson: lessonStubFromRouteStatus(routeStatus),
        publishStatus,
        showAdminLink: isAdmin,
        showAdminPreviewLink: isAdmin,
      };
    }
  }

  console.warn("[lesson-access] Lesson not found", { lessonId: normalizedId });
  return { kind: "not_found" };
}
