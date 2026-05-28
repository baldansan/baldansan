import { hsk5Course } from "@/content/courses/hsk5";
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
  "id, course_id, title, chinese_title, subtitle, description, duration, vocabulary_count, quiz_count, status, order_index, video_url, thumbnail_url, audio_url, source_note, media_status";

type DbLesson = {
  id: string;
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
  video_url?: string | null;
  thumbnail_url?: string | null;
  audio_url?: string | null;
  source_note?: string | null;
  media_status?: string | null;
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
  const thumbnailUrl = row.thumbnail_url?.trim();
  const audioUrl = row.audio_url?.trim();
  const sourceNote = row.source_note?.trim();
  const mediaStatus = row.media_status?.trim() || "missing";

  return {
    videoUrl: videoUrl || undefined,
    thumbnailUrl: thumbnailUrl || undefined,
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

function normalizePublishStatus(status: string): LessonPublishStatus {
  if (status === "available" || status === "archived" || status === "draft") {
    return status;
  }
  return "draft";
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
  return {
    id: row.id,
    courseId: row.course_id,
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
    subtitlePreview: [],
    timedSubtitles: [],
    vocabulary: [],
    quizQuestions: [],
    quizTypes: DEFAULT_QUIZ_TYPES,
  };
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

  return {
    id: row.id,
    courseId: row.course_id,
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
    quizQuestions: quiz.map(
      (q): QuizQuestion => ({
        id: `${row.id}-q${q.order_index}`,
        type: parseQuizType(q.type),
        question: q.question,
        options: parseOptions(q.options),
        correctAnswer: q.correct_answer,
        explanation: q.explanation ?? "",
      })
    ),
    quizTypes: DEFAULT_QUIZ_TYPES,
  };
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

  if (error) throw error;
  if (!data?.length) return [];

  return (data as DbLesson[]).map(mapLessonRowToSummary);
}

export async function getSupabaseLessonByIdWithClient(
  lessonId: string,
  client: SupabaseClient
): Promise<LessonContent | undefined> {
  const { data: lesson, error: lessonError } = await client
    .from("lessons")
    .select(LESSON_ROW_SELECT)
    .eq("id", lessonId)
    .maybeSingle();

  if (lessonError) throw lessonError;
  if (!lesson) return undefined;

  const [subtitlesResult, vocabularyResult, quizResult] = await Promise.all([
    client
      .from("subtitle_lines")
      .select(
        "lesson_id, start_time, end_time, chinese, pinyin, mongolian, order_index"
      )
      .eq("lesson_id", lessonId)
      .order("order_index", { ascending: true }),
    client
      .from("vocabulary_words")
      .select(
        "id, lesson_id, chinese, pinyin, mongolian, hsk_level, example_chinese, example_mongolian, order_index"
      )
      .eq("lesson_id", lessonId)
      .order("order_index", { ascending: true }),
    client
      .from("quiz_questions")
      .select(
        "id, lesson_id, type, question, options, correct_answer, explanation, order_index"
      )
      .eq("lesson_id", lessonId)
      .order("order_index", { ascending: true }),
  ]);

  if (subtitlesResult.error) throw subtitlesResult.error;
  if (vocabularyResult.error) throw vocabularyResult.error;
  if (quizResult.error) throw quizResult.error;

  return mapFullLesson(
    lesson as DbLesson,
    (subtitlesResult.data ?? []) as DbSubtitleLine[],
    (vocabularyResult.data ?? []) as DbVocabularyWord[],
    (quizResult.data ?? []) as DbQuizQuestion[]
  );
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
