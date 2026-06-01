import { hsk5Course } from "@/content/courses/hsk5";
import {
  canonicalLessonId,
  lessonIdQueryCandidates,
  lessonIdSlugCandidates,
  normalizeLessonIdForQuery,
  normalizeLessonRouteId,
} from "@/lib/lesson-id";
import { mapLessonReleaseFields } from "@/lib/supabase/lesson-release-map";
import { normalizePublishStatus } from "@/lib/lesson-publish";
import { enrichLessonContentMeta } from "@/lib/lesson-content-type";
import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Course } from "@/types/course";
import type {
  CourseContent,
  LessonContent,
  LessonContentStatus,
  LessonPublishStatus,
} from "@/types/lesson-content";
import type { QuizQuestion, QuizQuestionType } from "@/types/lesson";

const DEFAULT_QUIZ_TYPES = [
  "Multiple choice",
  "Cloze blank",
  "Match Chinese to Mongolian",
];

const VIDEO_PLACEHOLDER = "Video lesson placeholder";

const LESSON_ROW_SELECT =
  "id, course_id, title, chinese_title, subtitle, description, duration, vocabulary_count, quiz_count, status, order_index, video_url, thumbnail_url, image_url, audio_url, source_note, media_status, language, release_status, qa_status, approved_at, approved_by, release_notes, last_reviewed_at";

/** Fallback when optional workflow / language columns are not migrated yet. */
const LESSON_ROW_SELECT_CORE =
  "id, course_id, title, chinese_title, subtitle, description, duration, vocabulary_count, quiz_count, status, order_index, video_url, thumbnail_url, image_url, audio_url, source_note, media_status";

function isMissingColumnSelectError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("column") &&
    (lower.includes("does not exist") || lower.includes("could not find"))
  );
}

async function selectLessonRowById(
  client: SupabaseClient,
  candidate: string | number,
  select: string
): Promise<{ data: DbLesson | null; error: { message: string } | null }> {
  const { data, error } = await client
    .from("lessons")
    .select(select)
    .eq("id", candidate)
    .maybeSingle();

  if (error) {
    return { data: null, error: { message: error.message } };
  }
  return { data: data as DbLesson | null, error: null };
}

type DbLesson = {
  id: string | number;
  course_id: string;
  title: string;
  chinese_title: string | null;
  subtitle: string | null;
  description: string | null;
  duration: string | null;
  vocabulary_count: number;
  quiz_count: number;
  status: string;
  order_index: number;
  language?: string | null;
  video_url?: string | null;
  thumbnail_url?: string | null;
  image_url?: string | null;
  audio_url?: string | null;
  source_note?: string | null;
  media_status?: string | null;
  release_status?: string | null;
  qa_status?: string | null;
  approved_at?: string | null;
  approved_by?: string | null;
  release_notes?: string | null;
  last_reviewed_at?: string | null;
};

type DbCourse = {
  id: string;
  title: string;
  description: string | null;
  level: string | null;
  status: string;
  order_index: number;
};

function mapLessonMediaFields(row: DbLesson) {
  const videoUrl = row.video_url?.trim();
  const thumbnailUrl = row.thumbnail_url?.trim() || row.image_url?.trim();
  const imageUrl = row.image_url?.trim() || row.thumbnail_url?.trim();
  const audioUrl = row.audio_url?.trim();
  const sourceNote = row.source_note?.trim();
  const mediaStatus = row.media_status?.trim() || "missing";

  return {
    videoUrl: videoUrl || undefined,
    thumbnailUrl: thumbnailUrl || undefined,
    imageUrl: imageUrl || undefined,
    audioUrl: audioUrl || undefined,
    sourceNote: sourceNote || undefined,
    mediaStatus,
  };
}

type DbSubtitleLine = {
  lesson_id: string;
  start_time: string;
  end_time: string;
  chinese: string;
  pinyin: string | null;
  mongolian: string;
  order_index: number;
};

type DbVocabularyWord = {
  id: number;
  lesson_id: string;
  chinese: string;
  pinyin: string | null;
  mongolian: string;
  hsk_level: string | null;
  example_chinese: string | null;
  example_mongolian: string | null;
  order_index: number;
};

type DbQuizQuestion = {
  id: number;
  lesson_id: string;
  type: string;
  question: string;
  options: unknown;
  correct_answer: string;
  explanation: string | null;
  order_index: number;
};

function durationToWatchTime(duration: string | null): string {
  if (!duration) return "00:00";
  const match = duration.match(/(\d+)/);
  if (!match) return "00:00";
  const minutes = match[1].padStart(2, "0");
  return `${minutes}:00`;
}

function parseLessonStatus(status: string): LessonContentStatus {
  return normalizePublishStatus(status) === "available" ? "available" : "locked";
}

function parseOptions(options: unknown): string[] {
  if (!Array.isArray(options)) return [];
  return options.filter((item): item is string => typeof item === "string");
}

function parseQuizType(type: string): QuizQuestionType {
  return type === "cloze" ? "cloze" : "multiple_choice";
}

function mapDbQuizRowsToQuestions(
  lessonId: string,
  quiz: DbQuizQuestion[]
): QuizQuestion[] {
  const id = canonicalLessonId(lessonId);
  return quiz.map(
    (q): QuizQuestion => ({
      id: `${id}-q${q.order_index}`,
      dbId: Number(q.id),
      orderIndex: q.order_index,
      type: parseQuizType(q.type),
      question: q.question,
      options: parseOptions(q.options),
      correctAnswer: q.correct_answer,
      explanation: q.explanation ?? "",
    })
  );
}

/** Load quiz rows from public.quiz_questions only (all lesson_id variants). */
export async function getSupabaseQuizQuestionsByLessonIdWithClient(
  lessonId: string,
  client: SupabaseClient
): Promise<QuizQuestion[]> {
  const normalizedId = normalizeLessonIdForQuery(lessonId);
  const quiz = await fetchChildRowsForLesson<DbQuizQuestion>(
    client,
    "quiz_questions",
    "id, lesson_id, type, question, options, correct_answer, explanation, order_index",
    normalizedId
  );

  if (quiz.length === 0) {
    return [];
  }

  return mapDbQuizRowsToQuestions(
    canonicalLessonId(quiz[0].lesson_id),
    quiz
  );
}

function mapSubtitleLine(row: DbSubtitleLine) {
  return {
    start: row.start_time,
    end: row.end_time,
    chinese: row.chinese,
    pinyin: row.pinyin ?? "",
    mongolian: row.mongolian,
  };
}

function mapLessonRowToSummary(row: DbLesson): LessonContent {
  const id = canonicalLessonId(row.id);
  const language = row.language?.trim() || undefined;
  return enrichLessonContentMeta({
    id,
    courseId: row.course_id,
    language,
    title: row.title,
    chineseTitle: row.chinese_title ?? "",
    subtitle: row.subtitle ?? "",
    description: row.description ?? "",
    duration: row.duration ?? "",
    vocabularyCount: row.vocabulary_count,
    quizCount: row.quiz_count,
    status: parseLessonStatus(row.status),
    publishStatus: normalizePublishStatus(row.status),
    videoPlaceholder: VIDEO_PLACEHOLDER,
    watchTotalTime: durationToWatchTime(row.duration),
    ...mapLessonMediaFields(row),
    ...mapLessonReleaseFields(row),
    subtitlePreview: [],
    timedSubtitles: [],
    vocabulary: [],
    quizQuestions: [],
    quizTypes: DEFAULT_QUIZ_TYPES,
  });
}

function mapFullLesson(
  row: DbLesson,
  subtitles: DbSubtitleLine[],
  vocabulary: DbVocabularyWord[],
  quiz: DbQuizQuestion[]
): LessonContent {
  const timedSubtitles = subtitles.map(mapSubtitleLine);
  const subtitlePreview = timedSubtitles.slice(0, 2).map(({ chinese, pinyin, mongolian }) => ({
    chinese,
    pinyin,
    mongolian,
  }));

  return enrichLessonContentMeta({
      id: canonicalLessonId(row.id),
      courseId: row.course_id,
      language: row.language?.trim() || undefined,
      title: row.title,
      chineseTitle: row.chinese_title ?? "",
      subtitle: row.subtitle ?? "",
      description: row.description ?? "",
      duration: row.duration ?? "",
      vocabularyCount: row.vocabulary_count,
      quizCount: row.quiz_count,
      status: parseLessonStatus(row.status),
      publishStatus: normalizePublishStatus(row.status),
      videoPlaceholder: VIDEO_PLACEHOLDER,
      watchTotalTime: durationToWatchTime(row.duration),
      ...mapLessonMediaFields(row),
      ...mapLessonReleaseFields(row),
      subtitlePreview,
      timedSubtitles,
      vocabulary: vocabulary.map((word) => ({
        id: `${row.id}-vocab-${word.order_index}`,
        dbId: Number(word.id),
        chinese: word.chinese,
        pinyin: word.pinyin ?? "",
        mongolian: word.mongolian,
        hskLevel: word.hsk_level ?? "",
        exampleChinese: word.example_chinese ?? "",
        exampleMongolian: word.example_mongolian ?? "",
      })),
      quizQuestions: mapDbQuizRowsToQuestions(canonicalLessonId(row.id), quiz),
      quizTypes: DEFAULT_QUIZ_TYPES,
    });
}

function mapDbCourseToCatalog(course: DbCourse, lessonCount: number): Course {
  const status = course.status === "available" ? "available" : "coming_soon";
  return {
    id: course.id,
    title: course.title,
    level: course.level ?? "",
    description: course.description ?? "",
    lessons: lessonCount,
    vocabulary: 0,
    status,
    href: status === "available" ? `/courses/${course.id}` : null,
  };
}

function buildCourseContent(
  course: DbCourse,
  lessons: LessonContent[]
): CourseContent {
  const totalVocab = lessons.reduce((sum, l) => sum + l.vocabularyCount, 0);
  const localFallback = coursesContentFallback(course.id);

  return {
    id: course.id,
    title: course.title,
    subtitle: course.description ?? localFallback?.subtitle ?? "",
    stats: [
      { label: `${lessons.length} lessons` },
      { label: `${totalVocab} vocabulary` },
      ...(localFallback?.stats.slice(2) ?? [
        { label: "Shadowing practice" },
        { label: "Quiz included" },
      ]),
    ],
    progress: {
      completed: 0,
      total: lessons.length > 0 ? lessons.length : (localFallback?.progress.total ?? 0),
    },
  };
}

function coursesContentFallback(courseId: string): CourseContent | undefined {
  if (courseId === "hsk5") return hsk5Course;
  return undefined;
}

export async function getSupabaseCourseById(
  courseId: string
): Promise<Course | undefined> {
  if (!hasSupabaseConfig || !supabase) return undefined;

  const { data: course, error } = await supabase
    .from("courses")
    .select("id, title, description, level, status, order_index")
    .eq("id", courseId)
    .maybeSingle();

  if (error) throw error;
  if (!course) return undefined;

  const { count, error: countError } = await supabase
    .from("lessons")
    .select("id", { count: "exact", head: true })
    .eq("course_id", courseId);

  if (countError) throw countError;

  return mapDbCourseToCatalog(course as DbCourse, count ?? 0);
}

export async function getSupabaseCourseContentById(
  courseId: string
): Promise<CourseContent | undefined> {
  if (!hasSupabaseConfig || !supabase) return undefined;

  const { data: course, error } = await supabase
    .from("courses")
    .select("id, title, description, level, status, order_index")
    .eq("id", courseId)
    .maybeSingle();

  if (error) throw error;
  if (!course) return undefined;

  const lessons = await getSupabaseLessonsByCourseId(courseId);
  return buildCourseContent(course as DbCourse, lessons);
}

export async function getSupabaseLessonsByCourseId(
  courseId: string
): Promise<LessonContent[]> {
  if (!hasSupabaseConfig || !supabase) return [];
  return getSupabaseLessonsByCourseIdWithClient(courseId, supabase);
}

export async function getSupabaseLessonsByCourseIdWithClient(
  courseId: string,
  client: SupabaseClient,
  options?: { publicOnly?: boolean }
): Promise<LessonContent[]> {
  return fetchSupabaseLessonsByCourse(
    courseId,
    options?.publicOnly ?? false,
    client
  );
}

/** Public catalog: only `status = available` lessons. */
export async function getSupabasePublicLessonsByCourseId(
  courseId: string
): Promise<LessonContent[]> {
  if (!hasSupabaseConfig || !supabase) return [];
  return getSupabaseLessonsByCourseIdWithClient(courseId, supabase, {
    publicOnly: true,
  });
}

async function fetchSupabaseLessonsByCourse(
  courseId: string,
  publicOnly: boolean,
  client: SupabaseClient
): Promise<LessonContent[]> {
  let query = client
    .from("lessons")
    .select(LESSON_ROW_SELECT)
    .eq("course_id", courseId);

  if (publicOnly) {
    query = query.eq("status", "available");
  }

  const { data, error } = await query.order("order_index", { ascending: true });

  if (error) {
    if (isMissingColumnSelectError(error.message)) {
      const { data: fallbackData, error: fallbackError } = await client
        .from("lessons")
        .select(LESSON_ROW_SELECT_CORE)
        .eq("course_id", courseId)
        .order("order_index", { ascending: true });

      if (fallbackError) throw fallbackError;
      if (!fallbackData?.length) return [];
      return (fallbackData as DbLesson[]).map(mapLessonRowToSummary);
    }
    throw error;
  }
  if (!data?.length) return [];

  return (data as DbLesson[]).map(mapLessonRowToSummary);
}

type ResolvedLessonRow = {
  row: DbLesson;
  canonicalId: string;
  usedNumeric: boolean;
};

export async function fetchLessonRowById(
  client: SupabaseClient,
  lessonId: string
): Promise<ResolvedLessonRow | null> {
  const normalizedId = normalizeLessonRouteId(lessonId);
  const candidates = lessonIdQueryCandidates(normalizedId);
  let useCoreSelect = false;

  for (const candidate of candidates) {
    let result = await selectLessonRowById(
      client,
      candidate,
      useCoreSelect ? LESSON_ROW_SELECT_CORE : LESSON_ROW_SELECT
    );

    if (
      result.error &&
      !useCoreSelect &&
      isMissingColumnSelectError(result.error.message)
    ) {
      useCoreSelect = true;
      result = await selectLessonRowById(client, candidate, LESSON_ROW_SELECT_CORE);
    }

    if (result.error) {
      console.warn("[lesson-id] Lesson row query error", {
        lessonId: normalizedId,
        candidate,
        message: result.error.message,
      });
      continue;
    }

    if (result.data) {
      const usedNumeric = typeof candidate === "number";
      if (usedNumeric) {
        console.warn("[lesson-id] Resolved lesson row using numeric id query", {
          lessonId: normalizedId,
          candidate,
        });
      }
      return {
        row: result.data,
        canonicalId: canonicalLessonId(result.data.id),
        usedNumeric,
      };
    }
  }

  for (const slug of lessonIdSlugCandidates(normalizedId)) {
    const { data, error } = await client
      .from("lessons")
      .select(useCoreSelect ? LESSON_ROW_SELECT_CORE : LESSON_ROW_SELECT)
      .ilike("id", slug)
      .maybeSingle();

    if (error) {
      if (isMissingColumnSelectError(error.message) && !useCoreSelect) {
        useCoreSelect = true;
        const retry = await client
          .from("lessons")
          .select(LESSON_ROW_SELECT_CORE)
          .ilike("id", slug)
          .maybeSingle();
        if (retry.data) {
          const row = retry.data as unknown as DbLesson;
          return {
            row,
            canonicalId: canonicalLessonId(row.id),
            usedNumeric: false,
          };
        }
      }
      continue;
    }
    if (data) {
      const row = data as unknown as DbLesson;
      console.warn("[lesson-id] Resolved lesson row via ilike id match", {
        lessonId: normalizedId,
        matchedId: row.id,
      });
      return {
        row,
        canonicalId: canonicalLessonId(row.id),
        usedNumeric: false,
      };
    }
  }

  console.warn("[lesson-id] Lesson row not found", {
    lessonId: normalizedId,
    candidates,
  });
  return null;
}

async function fetchChildRowsForLesson<T extends Record<string, unknown>>(
  client: SupabaseClient,
  table: "subtitle_lines" | "vocabulary_words" | "quiz_questions",
  select: string,
  lessonId: string
): Promise<T[]> {
  const normalizedId = normalizeLessonIdForQuery(lessonId);
  const candidates = lessonIdQueryCandidates(normalizedId);

  for (const candidate of candidates) {
    const { data, error } = await client
      .from(table)
      .select(select)
      .eq("lesson_id", candidate)
      .order("order_index", { ascending: true });

    if (error) {
      console.warn("[lesson-id] Child row query error", {
        table,
        lessonId: normalizedId,
        candidate,
        message: error.message,
      });
      continue;
    }
    if (data && data.length > 0) {
      if (typeof candidate === "number") {
        console.warn("[lesson-id] Loaded child rows using numeric lesson_id", {
          table,
          lessonId: normalizedId,
          candidate,
        });
      }
      return data as unknown as T[];
    }
  }

  for (const slug of lessonIdSlugCandidates(normalizedId)) {
    const { data, error } = await client
      .from(table)
      .select(select)
      .ilike("lesson_id", slug)
      .order("order_index", { ascending: true });

    if (error || !data?.length) continue;
    return data as unknown as T[];
  }

  return [];
}

export async function getSupabaseLessonByIdWithClient(
  lessonId: string,
  client: SupabaseClient
): Promise<LessonContent | undefined> {
  const normalizedId = normalizeLessonIdForQuery(lessonId);
  const resolved = await fetchLessonRowById(client, normalizedId);
  if (!resolved) {
    return undefined;
  }

  const { row, canonicalId } = resolved;

  const [subtitles, vocabulary, quiz] = await Promise.all([
    fetchChildRowsForLesson<DbSubtitleLine>(
      client,
      "subtitle_lines",
      "lesson_id, start_time, end_time, chinese, pinyin, mongolian, order_index",
      canonicalId
    ),
    fetchChildRowsForLesson<DbVocabularyWord>(
      client,
      "vocabulary_words",
      "id, lesson_id, chinese, pinyin, mongolian, hsk_level, example_chinese, example_mongolian, order_index",
      canonicalId
    ),
    fetchChildRowsForLesson<DbQuizQuestion>(
      client,
      "quiz_questions",
      "id, lesson_id, type, question, options, correct_answer, explanation, order_index",
      canonicalId
    ),
  ]);

  return mapFullLesson(row, subtitles, vocabulary, quiz);
}

export async function getSupabaseLessonById(
  lessonId: string
): Promise<LessonContent | undefined> {
  if (!hasSupabaseConfig || !supabase) {
    return undefined;
  }

  return getSupabaseLessonByIdWithClient(lessonId, supabase);
}

/** Maps `chinese` → `vocabulary_words.id` for progress writes when lesson content is local fallback. */
export async function getVocabularyDbIdMapForLesson(
  lessonId: string
): Promise<Map<string, number>> {
  if (!hasSupabaseConfig || !supabase) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("vocabulary_words")
    .select("id, chinese")
    .eq("lesson_id", lessonId);

  if (error) {
    throw error;
  }

  const map = new Map<string, number>();
  for (const row of data ?? []) {
    map.set(row.chinese as string, Number(row.id));
  }
  return map;
}

export async function enrichVocabularyWithDbIds<
  T extends { chinese: string; dbId?: number },
>(lessonId: string, words: T[]): Promise<T[]> {
  if (words.length === 0 || words.every((word) => word.dbId != null)) {
    return words;
  }

  try {
    const map = await getVocabularyDbIdMapForLesson(lessonId);
    if (map.size === 0) {
      return words;
    }

    return words.map((word) => ({
      ...word,
      dbId: word.dbId ?? map.get(word.chinese),
    }));
  } catch {
    return words;
  }
}

export async function getSupabaseLessonIds(): Promise<string[]> {
  if (!hasSupabaseConfig || !supabase) return [];

  const { data, error } = await supabase
    .from("lessons")
    .select("id")
    .order("order_index", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => row.id as string);
}
