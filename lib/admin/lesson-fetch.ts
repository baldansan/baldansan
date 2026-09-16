import "server-only";

import { cache } from "react";

import { analyzeLessonQa, type LessonQaReport } from "@/lib/admin/lesson-qa";
import { LEARNER_COURSE_PROBE_IDS } from "@/lib/language-track";
import {
  canonicalLessonId,
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

/**
 * @param withVocabularyDbIds Look up the `vocabulary_words` row id for each
 * word — one extra query per lesson, needed only by the editor. QA reports and
 * list views pass `false`.
 */
async function loadAdminLesson(
  lessonId: string,
  withVocabularyDbIds: boolean
): Promise<LessonContent | undefined> {
  const enrichVocabulary = async <T extends { chinese: string; dbId?: number }>(
    resolvedId: string,
    words: T[]
  ): Promise<T[]> =>
    withVocabularyDbIds ? enrichVocabularyWithDbIds(resolvedId, words) : words;

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
      const vocabulary = await enrichVocabulary(
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

    const vocabulary = await enrichVocabulary(lesson.id, lesson.vocabulary);
    return { ...lesson, vocabulary };
  } catch (error) {
    debugWarn("[lesson-fetch] Admin/full lesson fetch failed; trying RPC", {
      lessonId: normalizedId,
      error,
    });
    try {
      const rpcLesson = await fetchAdminLessonBundleViaRpc(client, normalizedId);
      if (rpcLesson) {
        const vocabulary = await enrichVocabulary(
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
}

/** Admin/full server fetch: any publish status (RLS + optional RPC fallback). */
export const getAdminLessonById = cache(
  async function getAdminLessonById(
    lessonId: string
  ): Promise<LessonContent | undefined> {
    return loadAdminLesson(lessonId, true);
  }
);

/** Same bundle, minus the per-lesson vocabulary id lookup QA never reads. */
const getAdminLessonForQa = cache(async function getAdminLessonForQa(
  lessonId: string
): Promise<LessonContent | undefined> {
  return loadAdminLesson(lessonId, false);
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
const ADMIN_LESSON_FETCH_CONCURRENCY = 24;

type LessonChildCounts = {
  subtitles: number;
  vocabulary: number;
  quiz: number;
};

function readEmbeddedCount(value: unknown): number {
  // PostgREST returns an embedded aggregate as [{ count: n }].
  if (Array.isArray(value)) {
    const first = value[0] as { count?: unknown } | undefined;
    return typeof first?.count === "number" ? first.count : 0;
  }
  if (value && typeof (value as { count?: unknown }).count === "number") {
    return (value as { count: number }).count;
  }
  return 0;
}

/**
 * Row counts for every lesson in a course, in one query.
 *
 * QA only needs how many subtitles / words / questions a lesson has, so pulling
 * the whole bundle per lesson was the expensive way to ask. Returns null when
 * the embedded-count select is unavailable, and the caller falls back to the
 * per-lesson bundle fetch.
 */
async function fetchLessonChildCounts(
  courseId: string
): Promise<Map<string, LessonChildCounts> | null> {
  const client = await getServerSupabaseClientOrNull();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from("lessons")
      .select(
        "id, subtitle_lines(count), vocabulary_words(count), quiz_questions(count)"
      )
      .eq("course_id", courseId);

    if (error || !data) {
      debugWarn("[lesson-fetch] Embedded QA counts unavailable", {
        courseId,
        error,
      });
      return null;
    }

    const counts = new Map<string, LessonChildCounts>();
    for (const row of data as Record<string, unknown>[]) {
      const id = canonicalLessonId(String(row.id));
      counts.set(id, {
        subtitles: readEmbeddedCount(row.subtitle_lines),
        vocabulary: readEmbeddedCount(row.vocabulary_words),
        quiz: readEmbeddedCount(row.quiz_questions),
      });
    }
    return counts;
  } catch (error) {
    debugWarn("[lesson-fetch] Embedded QA count query failed", {
      courseId,
      error,
    });
    return null;
  }
}

/**
 * `analyzeLessonQa` only reads the *lengths* of these arrays, so filling them
 * with placeholders lets a counts-only read produce the same report a full
 * bundle would — including the metadata-vs-actual mismatch check.
 */
function lessonSnapshotFromCounts(
  summary: LessonContent,
  counts: LessonChildCounts
): LessonContent {
  return {
    ...summary,
    timedSubtitles: Array.from({ length: counts.subtitles }, () => ({
      start: "00:00:00",
      end: "00:00:01",
      chinese: "—",
      pinyin: "",
      mongolian: "—",
    })),
    vocabulary: Array.from({ length: counts.vocabulary }, (_, index) => ({
      id: `qa-${index}`,
      chinese: "—",
      pinyin: "",
      mongolian: "—",
      hskLevel: "",
      exampleChinese: "",
      exampleMongolian: "",
    })),
    quizQuestions: Array.from({ length: counts.quiz }, (_, index) => ({
      id: `qa-${index}`,
      type: "multiple_choice" as const,
      question: "—",
      options: ["—"],
      correctAnswer: "—",
      explanation: "",
    })),
  };
}

async function buildQaReports(
  summaries: readonly LessonContent[],
  countsByLesson?: Map<string, LessonChildCounts> | null
): Promise<LessonQaReport[]> {
  const cheap: LessonQaReport[] = [];
  const needsBundle: LessonContent[] = [];

  for (const summary of summaries) {
    const counts = countsByLesson?.get(canonicalLessonId(summary.id));
    if (counts) {
      cheap.push(analyzeLessonQa(lessonSnapshotFromCounts(summary, counts)));
    } else {
      needsBundle.push(summary);
    }
  }

  const lessons = await mapWithConcurrency(
    needsBundle,
    ADMIN_LESSON_FETCH_CONCURRENCY,
    (summary) => getAdminLessonForQa(summary.id)
  );

  return [
    ...cheap,
    ...lessons
      .filter((lesson): lesson is LessonContent => Boolean(lesson))
      .map((lesson) => analyzeLessonQa(lesson)),
  ];
}

/**
 * Deduped per request: the admin dashboard asks several metric builders for
 * the same HSK5 QA reports, and without this each one re-ran the whole fetch.
 */
export const getHsk5LessonsWithQa = cache(
  async function getHsk5LessonsWithQa(): Promise<LessonQaReport[]> {
    const [summaries, counts] = await Promise.all([
      getAdminLessonsByCourseId("hsk5"),
      fetchLessonChildCounts("hsk5"),
    ]);
    const reports = await buildQaReports(summaries, counts);

    return reports.sort((a, b) =>
      a.lesson.id.localeCompare(b.lesson.id, undefined, { numeric: true })
    );
  }
);

/** Admin list: lessons across HSK + Korean (and other probed) course catalogs. */
export const getAllAdminLessonsWithQa = cache(
  async function getAllAdminLessonsWithQa(): Promise<LessonQaReport[]> {
    const [courseLists, countLists] = await Promise.all([
      Promise.all(
        LEARNER_COURSE_PROBE_IDS.map((courseId) =>
          getAdminLessonsByCourseId(courseId)
        )
      ),
      Promise.all(LEARNER_COURSE_PROBE_IDS.map(fetchLessonChildCounts)),
    ]);

    const seen = new Set<string>();
    const summaries: LessonContent[] = [];
    for (const list of courseLists) {
      for (const summary of list) {
        if (seen.has(summary.id)) continue;
        seen.add(summary.id);
        summaries.push(summary);
      }
    }

    const counts = new Map<string, LessonChildCounts>();
    for (const list of countLists) {
      if (!list) continue;
      for (const [lessonId, value] of list) {
        counts.set(lessonId, value);
      }
    }

    const reports = await buildQaReports(summaries, counts);

    return reports.sort((a, b) => {
      const courseCompare = a.lesson.courseId.localeCompare(b.lesson.courseId);
      if (courseCompare !== 0) return courseCompare;
      return a.lesson.id.localeCompare(b.lesson.id, undefined, {
        numeric: true,
      });
    });
  }
);
