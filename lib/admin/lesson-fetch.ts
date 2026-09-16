import "server-only";

import { cache } from "react";

import { analyzeLessonQa, type LessonQaReport } from "@/lib/admin/lesson-qa";
import { LEARNER_COURSE_PROBE_IDS } from "@/lib/language-track";
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
import { enrichLessonContentMeta } from "@/lib/lesson-content-type";
import type { LessonContent } from "@/types/lesson-content";
/** Dev-only diagnostics — never log user ids/roles in production. */
const debugWarn: (...args: unknown[]) => void =
  process.env.NODE_ENV === "development" ? console.warn : () => {};

/** One client per request — building it re-parses cookies every time. */
const getServerSupabaseClientOrNull = cache(
  async function getServerSupabaseClientOrNull() {
    if (!hasSupabaseConfig) {
      return null;
    }
    return createServerSupabaseClient();
  }
);

/** Admin/full server fetch: any publish status (RLS + optional RPC fallback). */
export const getAdminLessonById = cache(async function getAdminLessonById(
  lessonId: string
): Promise<LessonContent | undefined> {
  const normalizedId = normalizeLessonRouteId(lessonId);

  if (!hasSupabaseConfig) {
    return getLocalLessonById(normalizedId);
  }

  const client = await getServerSupabaseClientOrNull();
  if (!client) {
    debugWarn("[lesson-fetch] No server Supabase client for admin lesson", {
      lessonId: normalizedId,
    });
    return undefined;
  }

  // Dev-only: this is a network round trip to Supabase auth, and it was being
  // paid once per lesson purely to fill in a log line that production drops.
  if (process.env.NODE_ENV === "development") {
    const { data: userData } = await client.auth.getUser();
    debugWarn("[lesson-fetch] Admin lesson fetch attempt", {
      lessonId: normalizedId,
      queryCandidates: lessonIdQueryCandidates(normalizedId),
      hasUser: Boolean(userData.user),
      userId: userData.user?.id ?? null,
    });
  }

  // RPC first: SECURITY DEFINER bundle load works for draft + alphanumeric ids.
  try {
    const rpcLesson = await fetchAdminLessonBundleViaRpc(client, normalizedId);
    if (rpcLesson) {
      debugWarn("[lesson-fetch] Admin/full lesson found via RPC", {
        lessonId: normalizedId,
        resolvedId: rpcLesson.id,
        status: rpcLesson.publishStatus,
      });
      const vocabulary = await enrichVocabularyWithDbIds(
        rpcLesson.id,
        rpcLesson.vocabulary
      );
      return enrichLessonContentMeta({ ...rpcLesson, vocabulary });
    }
  } catch (error) {
    debugWarn("[lesson-fetch] Admin lesson RPC fetch failed", {
      lessonId: normalizedId,
      error,
    });
  }

  try {
    let lesson = await getSupabaseLessonByIdWithClient(normalizedId, client);

    if (!lesson) {
      lesson = await fetchAdminLessonBundleViaRpc(client, normalizedId);
    }

    if (!lesson) {
      debugWarn("[lesson-fetch] Admin/full lesson not found", {
        lessonId: normalizedId,
        queryCandidates: lessonIdQueryCandidates(normalizedId),
      });
      return undefined;
    }

    debugWarn("[lesson-fetch] Admin/full lesson found", {
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
    debugWarn("[lesson-fetch] Admin/full lesson fetch failed; trying RPC", {
      lessonId: normalizedId,
      error,
    });
    try {
      const rpcLesson = await fetchAdminLessonBundleViaRpc(client, normalizedId);
      if (rpcLesson) {
        const vocabulary = await enrichVocabularyWithDbIds(
          rpcLesson.id,
          rpcLesson.vocabulary
        );
        return enrichLessonContentMeta({ ...rpcLesson, vocabulary });
      }
    } catch (rpcError) {
      debugWarn("[lesson-fetch] Admin lesson RPC retry failed", {
        lessonId: normalizedId,
        error: rpcError,
      });
    }
    return undefined;
  }
});

/** Admin server list: all lessons in course regardless of publish status. */
export const getAdminLessonsByCourseId = cache(
  async function getAdminLessonsByCourseId(
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
      debugWarn("[lesson-fetch] Admin lesson list fetch failed", {
        courseId,
        error,
      });
      return [];
    }
  }
);

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

/**
 * Map over `items` with a bounded number of in-flight promises.
 *
 * Admin QA reports need a deep fetch per lesson. Doing that in a `for … await`
 * loop meant ~60 lessons × 3 round trips serialized end to end, which is what
 * made `/admin/lessons` take two minutes. A small pool keeps Supabase happy
 * while cutting wall-clock time by roughly the pool size.
 */
async function mapWithConcurrency<Item, Result>(
  items: readonly Item[],
  limit: number,
  mapper: (item: Item) => Promise<Result>
): Promise<Result[]> {
  const results: Result[] = new Array(items.length);
  let cursor = 0;

  const workers = Array.from(
    { length: Math.min(Math.max(limit, 1), items.length) },
    async () => {
      for (;;) {
        const index = cursor++;
        if (index >= items.length) return;
        results[index] = await mapper(items[index]);
      }
    }
  );

  await Promise.all(workers);
  return results;
}

/** How many lesson bundles to load at once. */
const ADMIN_LESSON_FETCH_CONCURRENCY = 12;

async function buildQaReports(
  summaries: readonly LessonContent[]
): Promise<LessonQaReport[]> {
  const lessons = await mapWithConcurrency(
    summaries,
    ADMIN_LESSON_FETCH_CONCURRENCY,
    (summary) => getAdminLessonById(summary.id)
  );

  return lessons
    .filter((lesson): lesson is LessonContent => Boolean(lesson))
    .map((lesson) => analyzeLessonQa(lesson));
}

/**
 * Deduped per request: the admin dashboard asks several metric builders for
 * the same HSK5 QA reports, and without this each one re-ran the whole fetch.
 */
export const getHsk5LessonsWithQa = cache(
  async function getHsk5LessonsWithQa(): Promise<LessonQaReport[]> {
    const summaries = await getAdminLessonsByCourseId("hsk5");
    const reports = await buildQaReports(summaries);

    return reports.sort((a, b) => Number(a.lesson.id) - Number(b.lesson.id));
  }
);

/** Admin list: lessons across HSK + Korean (and other probed) course catalogs. */
export const getAllAdminLessonsWithQa = cache(
  async function getAllAdminLessonsWithQa(): Promise<LessonQaReport[]> {
    const courseLists = await Promise.all(
      LEARNER_COURSE_PROBE_IDS.map((courseId) =>
        getAdminLessonsByCourseId(courseId)
      )
    );

    const seen = new Set<string>();
    const summaries: LessonContent[] = [];
    for (const list of courseLists) {
      for (const summary of list) {
        if (seen.has(summary.id)) continue;
        seen.add(summary.id);
        summaries.push(summary);
      }
    }

    const reports = await buildQaReports(summaries);

    return reports.sort((a, b) => {
      const courseCompare = a.lesson.courseId.localeCompare(b.lesson.courseId);
      if (courseCompare !== 0) return courseCompare;
      return String(a.lesson.id).localeCompare(String(b.lesson.id));
    });
  }
);
