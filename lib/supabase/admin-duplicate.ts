import { isCurrentUserAdmin } from "@/lib/supabase/admin";
import {
  ADMIN_ACTIVITY_ACTIONS,
  logAdminActivityFireAndForget,
} from "@/lib/supabase/admin-activity";
import {
  getAdminLessonMetadataById,
  getNextLessonOrderIndex,
  getQuizQuestionsByLessonId,
  getSubtitleLinesByLessonId,
  getVocabularyWordsByLessonId,
  type AdminContentResult,
} from "@/lib/supabase/admin-content";
import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";

export type AdminDuplicateResult<T> = {
  data: T | null;
  error: string | null;
};

export type DuplicateLessonTargetInput = {
  id: string;
  title?: string;
  chineseTitle?: string;
  orderIndex: number;
};

const NOT_CONFIGURED_MESSAGE =
  "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.";

const RLS_HINT = "Admin update policy may not be enabled.";

function notConfigured<T>(): AdminDuplicateResult<T> {
  return { data: null, error: NOT_CONFIGURED_MESSAGE };
}

function formatWriteError(error: { code?: string; message: string }): string {
  if (error.code === "23505") {
    return "Ийм ID-тай lesson аль хэдийн байна.";
  }
  const message = error.message ?? "";
  if (
    error.code === "42501" ||
    message.toLowerCase().includes("policy") ||
    message.toLowerCase().includes("row-level security")
  ) {
    return `${RLS_HINT} (${message})`;
  }
  return message || "Хуулбарлахад алдаа гарлаа.";
}

async function requireAdmin(): Promise<AdminDuplicateResult<true>> {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    return { data: null, error: "Admin эрх шаардлагатай." };
  }
  return { data: true, error: null };
}

async function lessonExists(lessonId: string): Promise<boolean> {
  if (!supabase) return false;
  const { data } = await supabase
    .from("lessons")
    .select("id")
    .eq("id", lessonId)
    .maybeSingle();
  return Boolean(data);
}

function str(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

export async function getSuggestedDuplicateLessonId(
  sourceLessonId: string
): Promise<AdminDuplicateResult<string>> {
  if (!hasSupabaseConfig) {
    return notConfigured();
  }

  const gate = await requireAdmin();
  if (gate.error) {
    return { data: null, error: gate.error };
  }

  const source = sourceLessonId.trim();
  if (/^\d+$/.test(source)) {
    const base = Number.parseInt(source, 10);
    for (let offset = 1; offset <= 50; offset += 1) {
      const candidate = String(base + offset);
      if (!(await lessonExists(candidate))) {
        return { data: candidate, error: null };
      }
    }
  }

  let candidate = `${source}-copy`;
  for (let n = 1; n <= 50; n += 1) {
    if (!(await lessonExists(candidate))) {
      return { data: candidate, error: null };
    }
    candidate = `${source}-copy-${n}`;
  }

  return { data: null, error: "Санал болгох шинэ ID олдсонгүй." };
}

export async function duplicateLesson(
  sourceLessonId: string,
  targetInput: DuplicateLessonTargetInput
): Promise<AdminDuplicateResult<{ id: string }>> {
  if (!supabase || !hasSupabaseConfig) {
    return notConfigured();
  }

  const gate = await requireAdmin();
  if (gate.error) {
    return { data: null, error: gate.error };
  }

  const sourceId = sourceLessonId.trim();
  const targetId = targetInput.id.trim();

  if (!targetId) {
    return { data: null, error: "New lesson ID заавал." };
  }
  if (targetId === sourceId) {
    return { data: null, error: "Шинэ ID одоогийн хичээлээс өөр байх ёстой." };
  }
  if (!Number.isFinite(targetInput.orderIndex) || targetInput.orderIndex < 1) {
    return { data: null, error: "Order index 1-ээс эхлэх тоо байх ёстой." };
  }

  const [metaResult, subtitlesResult, vocabularyResult, quizResult] =
    await Promise.all([
      getAdminLessonMetadataById(sourceId),
      getSubtitleLinesByLessonId(sourceId),
      getVocabularyWordsByLessonId(sourceId),
      getQuizQuestionsByLessonId(sourceId),
    ]);

  if (metaResult.error || !metaResult.data) {
    return { data: null, error: metaResult.error ?? "Эх хичээл олдсонгүй." };
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

  if (await lessonExists(targetId)) {
    return { data: null, error: `Lesson ID "${targetId}" аль хэдийн байна.` };
  }

  const source = metaResult.data;
  const title =
    targetInput.title?.trim() || `${source.title.trim()} Copy`;
  const chineseTitle =
    targetInput.chineseTitle?.trim() || str(source.chinese_title);

  if (!title) {
    return { data: null, error: "New title заавал." };
  }
  if (!chineseTitle) {
    return { data: null, error: "New Chinese title заавал." };
  }

  const subtitles = subtitlesResult.data ?? [];
  const vocabulary = vocabularyResult.data ?? [];
  const quizQuestions = quizResult.data ?? [];
  const vocabularyCount = vocabulary.length;
  const quizCount = quizQuestions.length;

  try {
    const { error: lessonError } = await supabase.from("lessons").insert({
      id: targetId,
      course_id: source.course_id,
      title,
      chinese_title: chineseTitle,
      subtitle: source.subtitle,
      description: source.description,
      duration: source.duration,
      vocabulary_count: vocabularyCount,
      quiz_count: quizCount,
      status: "draft",
      order_index: Math.floor(targetInput.orderIndex),
    });

    if (lessonError) {
      return { data: null, error: formatWriteError(lessonError) };
    }

    if (subtitles.length > 0) {
      const { error } = await supabase.from("subtitle_lines").insert(
        subtitles.map((row) => ({
          lesson_id: targetId,
          start_time: row.start_time,
          end_time: row.end_time,
          chinese: row.chinese,
          pinyin: row.pinyin,
          mongolian: row.mongolian,
          order_index: row.order_index,
        }))
      );
      if (error) {
        return { data: null, error: formatWriteError(error) };
      }
    }

    if (vocabulary.length > 0) {
      const { error } = await supabase.from("vocabulary_words").insert(
        vocabulary.map((row) => ({
          lesson_id: targetId,
          chinese: row.chinese,
          pinyin: row.pinyin,
          mongolian: row.mongolian,
          hsk_level: row.hsk_level,
          example_chinese: row.example_chinese,
          example_mongolian: row.example_mongolian,
          order_index: row.order_index,
        }))
      );
      if (error) {
        return { data: null, error: formatWriteError(error) };
      }
    }

    if (quizQuestions.length > 0) {
      const { error } = await supabase.from("quiz_questions").insert(
        quizQuestions.map((row) => ({
          lesson_id: targetId,
          type: row.type,
          question: row.question,
          options: row.options,
          correct_answer: row.correct_answer,
          explanation: row.explanation,
          order_index: row.order_index,
        }))
      );
      if (error) {
        return { data: null, error: formatWriteError(error) };
      }
    }

    logAdminActivityFireAndForget({
      action: ADMIN_ACTIVITY_ACTIONS.lessonDuplicated,
      entityType: "lesson",
      entityId: targetId,
      lessonId: targetId,
      title: `Lesson duplicated ${sourceId} → ${targetId}`,
      metadata: { sourceLessonId: sourceId },
    });

    return { data: { id: targetId }, error: null };
  } catch {
    return { data: null, error: "Хичээл хуулбарлахад алдаа гарлаа." };
  }
}

/** Suggested order index for duplicate target (next in course). */
export async function getSuggestedDuplicateOrderIndex(
  courseId: string
): Promise<AdminDuplicateResult<number>> {
  return getNextLessonOrderIndex(courseId);
}
