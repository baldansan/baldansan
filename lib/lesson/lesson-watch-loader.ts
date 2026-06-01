import "server-only";

import { getLocalLessonById } from "@/lib/content";
import {
  buildLessonLoadDebugInfo,
  type LessonLoadDebugInfo,
  type LessonLoadFailureKind,
} from "@/lib/lesson/lesson-load-diagnostics";
import {
  lessonIdQueryCandidates,
  normalizeLessonRouteId,
} from "@/lib/lesson-id";
import { isPublicLesson, normalizePublishStatus } from "@/lib/lesson-publish";
import { resolveLessonPageAccess } from "@/lib/lesson-public-access";
import { isCurrentUserAdminServer } from "@/lib/supabase/admin-server";
import { hasSupabaseConfig } from "@/lib/supabase/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  getLessonRouteStatus,
  lessonStubFromRouteStatus,
} from "@/lib/supabase/lesson-visibility";
import type { LessonContent, LessonPublishStatus } from "@/types/lesson-content";

export type LessonWatchPageResult =
  | { kind: "ok"; lesson: LessonContent; adminPreview: boolean }
  | {
      kind: "unavailable";
      lesson: LessonContent;
      publishStatus: LessonPublishStatus;
      showAdminLink: boolean;
      showAdminPreviewLink: boolean;
      accessDenied?: boolean;
    }
  | {
      kind: "error";
      failureKind: LessonLoadFailureKind;
      debug: LessonLoadDebugInfo;
    };

type SupabaseProbeResult =
  | { kind: "found"; status: string; courseId: string }
  | { kind: "not_found" }
  | { kind: "fetch_failed"; message: string }
  | { kind: "permission_denied"; message: string };

function isPermissionError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("permission") ||
    lower.includes("policy") ||
    lower.includes("rls") ||
    lower.includes("jwt") ||
    lower.includes("not authorized")
  );
}

async function probeLessonInSupabase(
  lessonId: string
): Promise<SupabaseProbeResult> {
  const client = await createServerSupabaseClient();
  if (!client) {
    return { kind: "fetch_failed", message: "Server Supabase client unavailable" };
  }

  const normalizedId = normalizeLessonRouteId(lessonId);
  const candidates = lessonIdQueryCandidates(normalizedId);
  let lastError: string | null = null;

  for (const candidate of candidates) {
    const { data, error } = await client
      .from("lessons")
      .select("id, status, course_id")
      .eq("id", candidate)
      .maybeSingle();

    if (error) {
      lastError = error.message;
      if (isPermissionError(error.message)) {
        return { kind: "permission_denied", message: error.message };
      }
      continue;
    }

    if (data) {
      return {
        kind: "found",
        status: String(data.status ?? "draft"),
        courseId: String(data.course_id ?? "hsk5"),
      };
    }
  }

  if (lastError) {
    return { kind: "fetch_failed", message: lastError };
  }

  return { kind: "not_found" };
}

function inferFetchSource(): "supabase" | "local" {
  return hasSupabaseConfig ? "supabase" : "local";
}

/**
 * Watch page loader with explicit failure kinds instead of generic notFound/offline.
 */
export async function loadLessonWatchPage(
  lessonId: string,
  options?: { preview?: string | string[] }
): Promise<LessonWatchPageResult> {
  const normalizedId = normalizeLessonRouteId(lessonId);

  try {
    const access = await resolveLessonPageAccess(lessonId, options);

    if (access.kind === "ok") {
      return {
        kind: "ok",
        lesson: access.lesson,
        adminPreview: access.adminPreview,
      };
    }

    if (access.kind === "unavailable") {
      return access;
    }

    const localLesson = getLocalLessonById(normalizedId);
    const debug = buildLessonLoadDebugInfo(normalizedId, {
      fetchSource: inferFetchSource(),
    });

    if (!hasSupabaseConfig) {
      if (localLesson && isPublicLesson(localLesson)) {
        return {
          kind: "ok",
          lesson: localLesson,
          adminPreview: false,
        };
      }

      return {
        kind: "error",
        failureKind: "supabase_config_missing",
        debug: {
          ...debug,
          fetchSource: "local",
          errorMessage: localLesson
            ? "Lesson exists locally but is not published."
            : "No Supabase env and no local lesson fallback.",
        },
      };
    }

    const probe = await probeLessonInSupabase(normalizedId);

    if (probe.kind === "permission_denied") {
      return {
        kind: "error",
        failureKind: "permission_denied",
        debug: {
          ...debug,
          fetchSource: "supabase",
          errorMessage: probe.message,
        },
      };
    }

    if (probe.kind === "fetch_failed") {
      return {
        kind: "error",
        failureKind: "supabase_fetch_failed",
        debug: {
          ...debug,
          fetchSource: "supabase",
          errorMessage: probe.message,
        },
      };
    }

    if (probe.kind === "found") {
      const routeStatus = await getLessonRouteStatus(normalizedId);
      const isAdmin = await isCurrentUserAdminServer();

      if (routeStatus) {
        const publishStatus = normalizePublishStatus(routeStatus.status);

        return {
          kind: "unavailable",
          lesson: lessonStubFromRouteStatus(routeStatus),
          publishStatus,
          showAdminLink: isAdmin,
          showAdminPreviewLink: isAdmin,
        };
      }

      return {
        kind: "error",
        failureKind: "permission_denied",
        debug: {
          ...debug,
          fetchSource: "supabase",
          errorMessage: `Lesson row exists (status=${probe.status}) but route status could not be loaded.`,
        },
      };
    }

    if (localLesson && isPublicLesson(localLesson)) {
      return {
        kind: "ok",
        lesson: localLesson,
        adminPreview: false,
      };
    }

    return {
      kind: "error",
      failureKind: "lesson_not_found",
      debug: {
        ...debug,
        fetchSource: "supabase",
        errorMessage: "No matching lesson row in Supabase or local fallback.",
      },
    };
  } catch (error) {
    return {
      kind: "error",
      failureKind: "server_error",
      debug: buildLessonLoadDebugInfo(normalizedId, {
        fetchSource: inferFetchSource(),
        errorMessage: error instanceof Error ? error.message : String(error),
      }),
    };
  }
}
