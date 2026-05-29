import type { SupabaseClient } from "@supabase/supabase-js";
import { canonicalLessonId } from "@/lib/lesson-id";
import type { LessonContent, LessonPublishStatus } from "@/types/lesson-content";
import type { QuizQuestion, QuizQuestionType } from "@/types/lesson";

const DEFAULT_QUIZ_TYPES = [
  "Multiple choice",
  "Cloze blank",
  "Match Chinese to Mongolian",
];

const VIDEO_PLACEHOLDER = "Video lesson placeholder";

type RpcLessonRow = {
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
  video_url?: string | null;
  thumbnail_url?: string | null;
  audio_url?: string | null;
  source_note?: string | null;
  media_status?: string | null;
};

type RpcSubtitleRow = {
  start_time: string;
  end_time: string;
  chinese: string;
  pinyin: string | null;
  mongolian: string;
  order_index: number;
};

type RpcVocabRow = {
  id: number;
  chinese: string;
  pinyin: string | null;
  mongolian: string;
  hsk_level: string | null;
  example_chinese: string | null;
  example_mongolian: string | null;
  order_index: number;
};

type RpcQuizRow = {
  id: number;
  type: string;
  question: string;
  options: unknown;
  correct_answer: string;
  explanation: string | null;
  order_index: number;
};

function normalizePublishStatus(status: string): LessonPublishStatus {
  if (status === "available" || status === "archived" || status === "draft") {
    return status;
  }
  return "draft";
}

function parseOptions(options: unknown): string[] {
  if (!Array.isArray(options)) return [];
  return options.filter((item): item is string => typeof item === "string");
}

function parseQuizType(type: string): QuizQuestionType {
  return type === "cloze" ? "cloze" : "multiple_choice";
}

function durationToWatchTime(duration: string | null): string {
  if (!duration) return "00:00";
  const match = duration.match(/(\d+)/);
  if (!match) return "00:00";
  return `${match[1].padStart(2, "0")}:00`;
}

function mapRpcBundleToLessonContent(
  lesson: RpcLessonRow,
  subtitles: RpcSubtitleRow[],
  vocabulary: RpcVocabRow[],
  quiz: RpcQuizRow[]
): LessonContent {
  const id = canonicalLessonId(lesson.id);
  const publishStatus = normalizePublishStatus(lesson.status);
  const timedSubtitles = subtitles.map((row) => ({
    start: row.start_time,
    end: row.end_time,
    chinese: row.chinese,
    pinyin: row.pinyin ?? "",
    mongolian: row.mongolian,
  }));

  return {
    id,
    courseId: lesson.course_id,
    title: lesson.title,
    chineseTitle: lesson.chinese_title ?? "",
    subtitle: lesson.subtitle ?? "",
    description: lesson.description ?? "",
    duration: lesson.duration ?? "",
    vocabularyCount: lesson.vocabulary_count,
    quizCount: lesson.quiz_count,
    status: publishStatus === "available" ? "available" : "locked",
    publishStatus,
    videoPlaceholder: VIDEO_PLACEHOLDER,
    watchTotalTime: durationToWatchTime(lesson.duration),
    videoUrl: lesson.video_url?.trim() || undefined,
    thumbnailUrl: lesson.thumbnail_url?.trim() || undefined,
    audioUrl: lesson.audio_url?.trim() || undefined,
    sourceNote: lesson.source_note?.trim() || undefined,
    mediaStatus: lesson.media_status?.trim() || "missing",
    subtitlePreview: timedSubtitles.slice(0, 2).map(({ chinese, pinyin, mongolian }) => ({
      chinese,
      pinyin,
      mongolian,
    })),
    timedSubtitles,
    vocabulary: vocabulary.map((word) => ({
      id: `${id}-vocab-${word.order_index}`,
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
        id: `${id}-q${q.order_index}`,
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

export async function fetchAdminLessonBundleViaRpc(
  client: SupabaseClient,
  lessonId: string
): Promise<LessonContent | undefined> {
  const { data, error } = await client.rpc("get_admin_lesson_bundle", {
    p_id: lessonId,
  });

  if (error) {
    console.warn("[lesson-fetch] Admin lesson RPC failed", {
      lessonId,
      message: error.message,
    });
    return undefined;
  }

  if (!data || typeof data !== "object") {
    return undefined;
  }

  const bundle = data as {
    lesson?: RpcLessonRow;
    subtitles?: RpcSubtitleRow[];
    vocabulary?: RpcVocabRow[];
    quiz?: RpcQuizRow[];
  };

  if (!bundle.lesson) {
    return undefined;
  }

  console.warn("[lesson-fetch] Admin lesson loaded via RPC bundle", {
    lessonId,
    resolvedId: canonicalLessonId(bundle.lesson.id),
  });

  return mapRpcBundleToLessonContent(
    bundle.lesson,
    bundle.subtitles ?? [],
    bundle.vocabulary ?? [],
    bundle.quiz ?? []
  );
}
