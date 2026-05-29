import "server-only";

import { analyzeLessonQa, type LessonQaReport } from "@/lib/admin/lesson-qa";
import {
  lessonIdQueryCandidates,
  normalizeLessonRouteId,
} from "@/lib/lesson-id";
import {
  getLocalLessonById,
  getLocalLessonsByCourseId,
} from "@/lib/content";
import { hasSupabaseConfig } from "@/lib/supabase/client";
import { fetchAdminLessonBundleViaRpc } from "@/lib/supabase/admin-lesson-rpc";
import {
  enrichVocabularyWithDbIds,
  fetchLessonRowById,
  getSupabaseLessonByIdWithClient,
  getSupabaseLessonsByCourseIdWithClient,
} from "@/lib/supabase/content";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { LessonContent } from "@/types/lesson-content";

async function getServerSupabaseClientOrNull() {
  if (!hasSupabaseConfig) {
    return null;
  }
  return createServerSupabaseClient();
}

/** Admin/full server fetch: any publish status (RLS + optional RPC fallback). */
export async function getAdminLessonById(
  lessonId: string
): Promise<LessonContent | undefined> {
  const normalizedId = normalizeLessonRouteId(lessonId);

  if (!hasSupabaseConfig) {
    return getLocalLessonById(normalizedId);
  }

  const client = await getServerSupabaseClientOrNull();
  if (!client) {
    console.warn("[lesson-fetch] No server Supabase client for admin lesson", {
      lessonId: normalizedId,
    });
    return undefined;
  }

  const { data: userData } = await client.auth.getUser();
  console.warn("[lesson-fetch] Admin lesson fetch attempt", {
    lessonId: normalizedId,
    queryCandidates: lessonIdQueryCandidates(normalizedId),
    hasUser: Boolean(userData.user),
    userId: userData.user?.id ?? null,
  });

  try {
    let lesson = await getSupabaseLessonByIdWithClient(normalizedId, client);

    if (!lesson) {
      lesson = await fetchAdminLessonBundleViaRpc(client, normalizedId);
    }

    if (!lesson) {
      console.warn("[lesson-fetch] Admin/full lesson not found", {
        lessonId: normalizedId,
        queryCandidates: lessonIdQueryCandidates(normalizedId),
      });
      return undefined;
    }

    console.warn("[lesson-fetch] Admin/full lesson found", {
      lessonId: normalizedId,
      resolvedId: lesson.id,
      status: lesson.publishStatus,
    });

    const vocabulary = await enrichVocabularyWithDbIds(
      lesson.id,
      lesson.vocabulary
    );
    return { ...lesson, vocabulary };
  } catch (error) {
    console.warn("[lesson-fetch] Admin/full lesson fetch failed", {
      lessonId: normalizedId,
      error,
    });
    return undefined;
  }
}

/** Admin server list: all lessons in course regardless of publish status. */
export async function getAdminLessonsByCourseId(
  courseId: string
): Promise<LessonContent[]> {
  if (!hasSupabaseConfig) {
    return getLocalLessonsByCourseId(courseId);
  }

  const client = await getServerSupabaseClientOrNull();
  if (!client) {
    return [];
  }

  try {
    return await getSupabaseLessonsByCourseIdWithClient(courseId, client);
  } catch (error) {
    console.warn("[lesson-fetch] Admin lesson list fetch failed", {
      courseId,
      error,
    });
    return [];
  }
}

export async function getAdminLessonOrderIndex(
  lessonId: string
): Promise<number | null> {
  const normalizedId = normalizeLessonRouteId(lessonId);
  const client = await getServerSupabaseClientOrNull();
  if (!client) {
    return null;
  }

  const resolved = await fetchLessonRowById(client, normalizedId);
  return resolved?.row.order_index ?? null;
}

export async function getHsk5LessonsWithQa(): Promise<LessonQaReport[]> {
  const summaries = await getAdminLessonsByCourseId("hsk5");
  const reports: LessonQaReport[] = [];

  for (const summary of summaries) {
    const lesson = await getAdminLessonById(summary.id);
    if (lesson) {
      reports.push(analyzeLessonQa(lesson));
    }
  }

  return reports.sort((a, b) => Number(a.lesson.id) - Number(b.lesson.id));
}
