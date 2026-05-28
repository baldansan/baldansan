import { isCurrentUserAdmin } from "@/lib/supabase/admin";
import {
  getAdminLessonMetadataById,
  getQuizQuestionsByLessonId,
  getSubtitleLinesByLessonId,
  getVocabularyWordsByLessonId,
  type AdminContentResult,
} from "@/lib/supabase/admin-content";
import { hasSupabaseConfig } from "@/lib/supabase/client";

export type AdminExportResult<T> = {
  data: T | null;
  error: string | null;
};

export type LessonExportLessonMeta = {
  id: string;
  courseId: string;
  title: string;
  chineseTitle: string;
  subtitle: string;
  description: string;
  duration: string;
  status: string;
  orderIndex: number;
};

export type LessonExportSubtitle = {
  start: string;
  end: string;
  chinese: string;
  pinyin: string;
  mongolian: string;
};

export type LessonExportVocabulary = {
  chinese: string;
  pinyin: string;
  mongolian: string;
  hskLevel: string;
  exampleChinese: string;
  exampleMongolian: string;
};

export type LessonExportQuizQuestion = {
  type: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
};

export type LessonExportPayload = {
  exportedAt: string;
  lesson: LessonExportLessonMeta;
  subtitles: LessonExportSubtitle[];
  vocabulary: LessonExportVocabulary[];
  quizQuestions: LessonExportQuizQuestion[];
};

const NOT_CONFIGURED_MESSAGE =
  "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.";

function notConfigured<T>(): AdminExportResult<T> {
  return { data: null, error: NOT_CONFIGURED_MESSAGE };
}

async function requireAdmin(): Promise<AdminExportResult<true>> {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    return { data: null, error: "Admin эрх шаардлагатай." };
  }
  return { data: true, error: null };
}

function str(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

export async function getLessonExportPayload(
  lessonId: string
): Promise<AdminExportResult<LessonExportPayload>> {
  if (!hasSupabaseConfig) {
    return notConfigured();
  }

  const gate = await requireAdmin();
  if (gate.error) {
    return { data: null, error: gate.error };
  }

  const [metaResult, subtitlesResult, vocabularyResult, quizResult] =
    await Promise.all([
      getAdminLessonMetadataById(lessonId),
      getSubtitleLinesByLessonId(lessonId),
      getVocabularyWordsByLessonId(lessonId),
      getQuizQuestionsByLessonId(lessonId),
    ]);

  if (metaResult.error || !metaResult.data) {
    return { data: null, error: metaResult.error ?? "Хичээл олдсонгүй." };
  }
  if (subtitlesResult.error) {
    return { data: null, error: subtitlesResult.error };
  }
  if (vocabularyResult.error) {
    return { data: null, error: vocabularyResult.error };
  }
  if (quizResult.error) {
    return { data: null, error: quizResult.error };
  }

  const meta = metaResult.data;

  const payload: LessonExportPayload = {
    exportedAt: new Date().toISOString(),
    lesson: {
      id: meta.id,
      courseId: meta.course_id,
      title: meta.title,
      chineseTitle: str(meta.chinese_title),
      subtitle: str(meta.subtitle),
      description: str(meta.description),
      duration: str(meta.duration),
      status: meta.status,
      orderIndex: meta.order_index,
    },
    subtitles: (subtitlesResult.data ?? []).map((row) => ({
      start: row.start_time,
      end: row.end_time,
      chinese: row.chinese,
      pinyin: str(row.pinyin),
      mongolian: row.mongolian,
    })),
    vocabulary: (vocabularyResult.data ?? []).map((row) => ({
      chinese: row.chinese,
      pinyin: str(row.pinyin),
      mongolian: row.mongolian,
      hskLevel: str(row.hsk_level),
      exampleChinese: str(row.example_chinese),
      exampleMongolian: str(row.example_mongolian),
    })),
    quizQuestions: (quizResult.data ?? []).map((row) => ({
      type: row.type,
      question: row.question,
      options: row.options,
      correctAnswer: row.correct_answer,
      explanation: str(row.explanation),
    })),
  };

  return { data: payload, error: null };
}

export async function buildLessonExportJson(
  lessonId: string
): Promise<AdminExportResult<string>> {
  const payloadResult = await getLessonExportPayload(lessonId);
  if (payloadResult.error || !payloadResult.data) {
    return { data: null, error: payloadResult.error ?? "Export failed." };
  }

  return {
    data: JSON.stringify(payloadResult.data, null, 2),
    error: null,
  };
}
