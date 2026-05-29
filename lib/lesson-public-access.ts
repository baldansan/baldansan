import { getAdminLessonById } from "@/lib/admin/lesson-fetch";
import { getPublicLessonById } from "@/lib/content";
import {
  lessonIdQueryCandidates,
  normalizeLessonRouteId,
} from "@/lib/lesson-id";
import { getLessonPublishStatus } from "@/lib/lesson-publish";
import {
  isAdminPreviewParam,
  parsePreviewParam,
} from "@/lib/preview-params";
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
      accessDenied?: boolean;
    }
  | { kind: "ok"; lesson: LessonContent; adminPreview: boolean };

function publishStatusFromRouteStatus(status: string): LessonPublishStatus {
  if (status === "available") return "available";
  if (status === "archived") return "archived";
  return "draft";
}

export async function resolvePreviewFromPageSearchParams(
  searchParams: Promise<{ preview?: string | string[] | undefined }>
): Promise<string | undefined> {
  const params = await searchParams;
  return parsePreviewParam(params.preview);
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
    previewRaw: options?.preview,
    isAdmin,
  });

  if (wantsAdminPreview) {
    const adminLesson = await getAdminLessonById(normalizedId);

    if (adminLesson) {
      const publishStatus = getLessonPublishStatus(adminLesson);

      // Draft/archived rows are only returned when RLS/RPC confirms admin access.
      if (publishStatus !== "available") {
        console.warn("[lesson-access] Admin preview lesson loaded", {
          lessonId: normalizedId,
          resolvedId: adminLesson.id,
          publishStatus,
          via: "admin-fetch",
        });
        return { kind: "ok", lesson: adminLesson, adminPreview: true };
      }

      if (isAdmin) {
        console.warn("[lesson-access] Admin preview for available lesson", {
          lessonId: normalizedId,
          resolvedId: adminLesson.id,
        });
        return { kind: "ok", lesson: adminLesson, adminPreview: true };
      }
    }

    const routeStatus = await getLessonRouteStatus(normalizedId);
    if (routeStatus) {
      const publishStatus = publishStatusFromRouteStatus(routeStatus.status);
      console.warn("[lesson-access] Admin preview denied", {
        lessonId: normalizedId,
        isAdmin,
        hasAdminLesson: Boolean(adminLesson),
        status: routeStatus.status,
      });
      return {
        kind: "unavailable",
        lesson: lessonStubFromRouteStatus(routeStatus),
        publishStatus,
        showAdminLink: isAdmin,
        showAdminPreviewLink: false,
        accessDenied: true,
      };
    }

    console.warn("[lesson-access] Admin preview lesson not found", {
      lessonId: normalizedId,
    });
    return { kind: "not_found" };
  }

  if (isAdmin) {
    const adminLesson = await getAdminLessonById(normalizedId);
    if (adminLesson) {
      const publishStatus = getLessonPublishStatus(adminLesson);

      if (publishStatus === "available") {
        return { kind: "ok", lesson: adminLesson, adminPreview: false };
      }

      console.warn("[lesson-access] Unavailable lesson (admin, no preview param)", {
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
