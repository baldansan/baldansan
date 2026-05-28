import "server-only";

import { analyzeLessonQa, type LessonQaReport } from "@/lib/admin/lesson-qa";
import {
  getLocalLessonById,
  getLocalLessonsByCourseId,
} from "@/lib/content";
import { isCurrentUserAdminServer } from "@/lib/supabase/admin-server";
import { hasSupabaseConfig } from "@/lib/supabase/client";
import {
  enrichVocabularyWithDbIds,
  getSupabaseLessonByIdWithClient,
  getSupabaseLessonsByCourseIdWithClient,
} from "@/lib/supabase/content";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { LessonContent } from "@/types/lesson-content";

async function withAdminSupabaseClient() {
  if (!hasSupabaseConfig) {
    return { client: null, isAdmin: false };
  }

  const isAdmin = await isCurrentUserAdminServer();
  if (!isAdmin) {
    return { client: null, isAdmin: false };
  }

  const client = await createServerSupabaseClient();
  return { client, isAdmin: true };
}

/** Admin server fetch: full lesson including draft/archived (requires admin session + RLS). */
export async function getAdminLessonById(
  lessonId: string
): Promise<LessonContent | undefined> {
  if (!hasSupabaseConfig) {
    return getLocalLessonById(lessonId);
  }

  const { client, isAdmin } = await withAdminSupabaseClient();
  if (!isAdmin || !client) {
    return undefined;
  }

  try {
    const lesson = await getSupabaseLessonByIdWithClient(lessonId, client);
    if (!lesson) {
      return undefined;
    }

    const vocabulary = await enrichVocabularyWithDbIds(
      lesson.id,
      lesson.vocabulary
    );
    return { ...lesson, vocabulary };
  } catch {
    return undefined;
  }
}

/** Admin server fetch: all lessons in a course regardless of publish status. */
export async function getAdminLessonsByCourseId(
  courseId: string
): Promise<LessonContent[]> {
  if (!hasSupabaseConfig) {
    return getLocalLessonsByCourseId(courseId);
  }

  const { client, isAdmin } = await withAdminSupabaseClient();
  if (!isAdmin || !client) {
    return [];
  }

  try {
    return await getSupabaseLessonsByCourseIdWithClient(courseId, client);
  } catch {
    return [];
  }
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
