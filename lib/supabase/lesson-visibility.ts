import "server-only";

import { canonicalLessonId, normalizeLessonRouteId } from "@/lib/lesson-id";
import { normalizePublishStatus } from "@/lib/lesson-publish";
import { enrichLessonContentMeta } from "@/lib/lesson-content-type";
import { hasSupabaseConfig } from "@/lib/supabase/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  LessonContent,
  LessonPublishStatus,
} from "@/types/lesson-content";

export type LessonRouteStatus = {
  id: string;
  status: string;
  title: string;
  chineseTitle: string;
  courseId: string;
  subtitle: string;
  description: string;
  duration: string;
};

function mapRouteStatusRow(raw: Record<string, unknown>): LessonRouteStatus | null {
  const id = raw.id != null ? canonicalLessonId(String(raw.id)) : "";
  if (!id) return null;

  return {
    id,
    status: String(raw.status ?? "draft"),
    title: String(raw.title ?? ""),
    chineseTitle: String(raw.chinese_title ?? raw.chineseTitle ?? ""),
    courseId: String(raw.course_id ?? raw.courseId ?? "hsk5"),
    subtitle: String(raw.subtitle ?? ""),
    description: String(raw.description ?? ""),
    duration: String(raw.duration ?? ""),
  };
}

/** Minimal lesson existence check for unavailable vs not-found (no child content). */
export async function getLessonRouteStatus(
  lessonId: string
): Promise<LessonRouteStatus | null> {
  if (!hasSupabaseConfig) {
    return null;
  }

  const normalizedId = normalizeLessonRouteId(lessonId);
  const client = await createServerSupabaseClient();
  if (!client) {
    return null;
  }

  try {
    const { data, error } = await client.rpc("get_lesson_route_status", {
      p_id: normalizedId,
    });

    if (error) {
      console.warn("[lesson-visibility] route status RPC failed", {
        lessonId: normalizedId,
        message: error.message,
      });
      return null;
    }

    if (!data || typeof data !== "object") {
      return null;
    }

    return mapRouteStatusRow(data as Record<string, unknown>);
  } catch (error) {
    console.warn("[lesson-visibility] route status fetch failed", {
      lessonId: normalizedId,
      error,
    });
    return null;
  }
}

export function lessonStubFromRouteStatus(
  status: LessonRouteStatus
): LessonContent {
  const publishStatus = normalizePublishStatus(status.status);

  return enrichLessonContentMeta({
    id: status.id,
    courseId: status.courseId,
    title: status.title,
    chineseTitle: status.chineseTitle,
    subtitle: status.subtitle,
    description: status.description,
    duration: status.duration,
    vocabularyCount: 0,
    quizCount: 0,
    status: publishStatus === "available" ? "available" : "locked",
    publishStatus,
    videoPlaceholder: "Video lesson placeholder",
    watchTotalTime: "00:00",
    subtitlePreview: [],
    timedSubtitles: [],
    vocabulary: [],
    quizQuestions: [],
    quizTypes: [],
  });
}
