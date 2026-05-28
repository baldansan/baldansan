import type { AdminContentStatus } from "@/lib/admin/lesson-status";
import { isCurrentUserAdmin } from "@/lib/supabase/admin";
import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";

export type AdminContentResult<T> = {
  data: T | null;
  error: string | null;
};

export type AdminSubtitleLine = {
  id: number;
  lesson_id: string;
  start_time: string;
  end_time: string;
  chinese: string;
  pinyin: string | null;
  mongolian: string;
  order_index: number;
};

export type AdminVocabularyWord = {
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

export type AdminQuizQuestion = {
  id: number;
  lesson_id: string;
  type: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string | null;
  order_index: number;
};

export type LessonCounts = {
  vocabularyCount: number;
  quizCount: number;
};

export type CreateDraftLessonInput = {
  id: string;
  courseId: string;
  title: string;
  chineseTitle: string;
  subtitle?: string;
  description?: string;
  duration?: string;
  status?: AdminContentStatus;
  orderIndex?: number;
};

export type UpdateLessonMetadataInput = {
  title?: string;
  chineseTitle?: string;
  subtitle?: string;
  description?: string;
  duration?: string;
  status?: AdminContentStatus;
  orderIndex?: number;
};

export type CreateSubtitleLineInput = {
  lessonId: string;
  startTime: string;
  endTime: string;
  chinese: string;
  pinyin?: string;
  mongolian: string;
  orderIndex?: number;
};

export type CreateVocabularyWordInput = {
  lessonId: string;
  chinese: string;
  pinyin?: string;
  mongolian: string;
  hskLevel?: string;
  exampleChinese?: string;
  exampleMongolian?: string;
  orderIndex?: number;
};

export type CreateQuizQuestionInput = {
  lessonId: string;
  type: "multiple_choice" | "cloze";
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  orderIndex?: number;
};

const NOT_CONFIGURED_MESSAGE =
  "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.";

const RLS_HINT =
  "Admin write policy may not be enabled. Run/review admin content policies.";

function notConfigured<T>(): AdminContentResult<T> {
  return { data: null, error: NOT_CONFIGURED_MESSAGE };
}

function parseOptions(options: unknown): string[] {
  if (!Array.isArray(options)) return [];
  return options.filter((item): item is string => typeof item === "string");
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
  return message || "Хадгалахад алдаа гарлаа.";
}

async function requireAdmin(): Promise<AdminContentResult<true>> {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    return { data: null, error: "Admin эрх шаардлагатай." };
  }
  return { data: true, error: null };
}

async function nextOrderIndex(
  table: "subtitle_lines" | "vocabulary_words" | "quiz_questions",
  lessonId: string
): Promise<number> {
  if (!supabase) return 1;
  const { data } = await supabase
    .from(table)
    .select("order_index")
    .eq("lesson_id", lessonId)
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.order_index ?? 0) + 1;
}

// --- Lesson metadata ---

export async function getNextLessonOrderIndex(
  courseId: string
): Promise<AdminContentResult<number>> {
  if (!supabase || !hasSupabaseConfig) {
    return notConfigured();
  }

  const gate = await requireAdmin();
  if (gate.error) {
    return { data: null, error: gate.error };
  }

  try {
    const { data, error } = await supabase
      .from("lessons")
      .select("order_index")
      .eq("course_id", courseId.trim())
      .order("order_index", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return { data: null, error: formatWriteError(error) };
    }

    const next = (data?.order_index ?? 0) + 1;
    return { data: next, error: null };
  } catch {
    return { data: null, error: "Order index тооцоолоход алдаа гарлаа." };
  }
}

export async function createDraftLesson(
  input: CreateDraftLessonInput
): Promise<AdminContentResult<{ id: string }>> {
  if (!supabase || !hasSupabaseConfig) {
    return notConfigured();
  }

  const gate = await requireAdmin();
  if (gate.error) {
    return { data: null, error: gate.error };
  }

  const lessonId = input.id.trim();
  const courseId = input.courseId.trim();

  let orderIndex = input.orderIndex;
  if (orderIndex == null || !Number.isFinite(orderIndex)) {
    const next = await getNextLessonOrderIndex(courseId);
    if (next.error) {
      return { data: null, error: next.error };
    }
    orderIndex = next.data ?? 1;
  }

  const status = input.status ?? "draft";

  try {
    const { error } = await supabase.from("lessons").insert({
      id: lessonId,
      course_id: courseId,
      title: input.title.trim(),
      chinese_title: input.chineseTitle.trim(),
      subtitle: input.subtitle?.trim() || null,
      description: input.description?.trim() || null,
      duration: input.duration?.trim() || null,
      vocabulary_count: 0,
      quiz_count: 0,
      status,
      order_index: orderIndex,
    });

    if (error) {
      return { data: null, error: formatWriteError(error) };
    }

    return { data: { id: lessonId }, error: null };
  } catch {
    return { data: null, error: "Хичээл үүсгэхэд алдаа гарлаа." };
  }
}

export async function updateLessonMetadata(
  lessonId: string,
  input: UpdateLessonMetadataInput
): Promise<AdminContentResult<{ id: string }>> {
  if (!supabase || !hasSupabaseConfig) {
    return notConfigured();
  }

  const gate = await requireAdmin();
  if (gate.error) {
    return { data: null, error: gate.error };
  }

  const patch: Record<string, string | number> = {};
  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.chineseTitle !== undefined) {
    patch.chinese_title = input.chineseTitle.trim();
  }
  if (input.subtitle !== undefined) patch.subtitle = input.subtitle.trim() || "";
  if (input.description !== undefined) {
    patch.description = input.description.trim() || "";
  }
  if (input.duration !== undefined) patch.duration = input.duration.trim() || "";
  if (input.status !== undefined) patch.status = input.status;
  if (input.orderIndex !== undefined) patch.order_index = input.orderIndex;

  if (Object.keys(patch).length === 0) {
    return { data: { id: lessonId }, error: null };
  }

  try {
    const { error } = await supabase
      .from("lessons")
      .update(patch)
      .eq("id", lessonId);

    if (error) {
      return { data: null, error: formatWriteError(error) };
    }

    return { data: { id: lessonId }, error: null };
  } catch {
    return { data: null, error: "Хичээл шинэчлэхэд алдаа гарлаа." };
  }
}

export async function getLessonMetadataCounts(
  lessonId: string
): Promise<AdminContentResult<LessonCounts & { metaVocabulary: number; metaQuiz: number }>> {
  if (!supabase || !hasSupabaseConfig) {
    return notConfigured();
  }

  const gate = await requireAdmin();
  if (gate.error) {
    return { data: null, error: gate.error };
  }

  try {
    const { data, error } = await supabase
      .from("lessons")
      .select("vocabulary_count, quiz_count")
      .eq("id", lessonId)
      .maybeSingle();

    if (error) {
      return { data: null, error: formatWriteError(error) };
    }
    if (!data) {
      return { data: null, error: "Хичээл олдсонгүй." };
    }

    const vocab = await getVocabularyWordsByLessonId(lessonId);
    const quiz = await getQuizQuestionsByLessonId(lessonId);
    if (vocab.error) return { data: null, error: vocab.error };
    if (quiz.error) return { data: null, error: quiz.error };

    return {
      data: {
        metaVocabulary: data.vocabulary_count,
        metaQuiz: data.quiz_count,
        vocabularyCount: vocab.data?.length ?? 0,
        quizCount: quiz.data?.length ?? 0,
      },
      error: null,
    };
  } catch {
    return { data: null, error: "Тоо уншихад алдаа гарлаа." };
  }
}

export async function refreshLessonCounts(
  lessonId: string
): Promise<AdminContentResult<LessonCounts>> {
  if (!supabase || !hasSupabaseConfig) {
    return notConfigured();
  }

  const gate = await requireAdmin();
  if (gate.error) {
    return { data: null, error: gate.error };
  }

  try {
    const { count: vocabCount, error: vocabError } = await supabase
      .from("vocabulary_words")
      .select("id", { count: "exact", head: true })
      .eq("lesson_id", lessonId);

    if (vocabError) {
      return { data: null, error: formatWriteError(vocabError) };
    }

    const { count: quizRowCount, error: quizError } = await supabase
      .from("quiz_questions")
      .select("id", { count: "exact", head: true })
      .eq("lesson_id", lessonId);

    if (quizError) {
      return { data: null, error: formatWriteError(quizError) };
    }

    const vocabularyCount = vocabCount ?? 0;
    const quizCount = quizRowCount ?? 0;

    const { error: updateError } = await supabase
      .from("lessons")
      .update({
        vocabulary_count: vocabularyCount,
        quiz_count: quizCount,
      })
      .eq("id", lessonId);

    if (updateError) {
      return { data: null, error: formatWriteError(updateError) };
    }

    return { data: { vocabularyCount, quizCount }, error: null };
  } catch {
    return { data: null, error: "Тоо шинэчлэхэд алдаа гарлаа." };
  }
}

// --- Subtitles ---

export async function getSubtitleLinesByLessonId(
  lessonId: string
): Promise<AdminContentResult<AdminSubtitleLine[]>> {
  if (!supabase || !hasSupabaseConfig) {
    return notConfigured();
  }

  const gate = await requireAdmin();
  if (gate.error) {
    return { data: null, error: gate.error };
  }

  try {
    const { data, error } = await supabase
      .from("subtitle_lines")
      .select(
        "id, lesson_id, start_time, end_time, chinese, pinyin, mongolian, order_index"
      )
      .eq("lesson_id", lessonId)
      .order("order_index", { ascending: true });

    if (error) {
      return { data: null, error: formatWriteError(error) };
    }

    return { data: (data as AdminSubtitleLine[]) ?? [], error: null };
  } catch {
    return { data: null, error: "Subtitle уншихад алдаа гарлаа." };
  }
}

export async function createSubtitleLine(
  input: CreateSubtitleLineInput
): Promise<AdminContentResult<AdminSubtitleLine>> {
  if (!supabase || !hasSupabaseConfig) {
    return notConfigured();
  }

  const gate = await requireAdmin();
  if (gate.error) {
    return { data: null, error: gate.error };
  }

  const orderIndex =
    input.orderIndex ?? (await nextOrderIndex("subtitle_lines", input.lessonId));

  try {
    const { error } = await supabase.from("subtitle_lines").insert({
      lesson_id: input.lessonId,
      start_time: input.startTime.trim(),
      end_time: input.endTime.trim(),
      chinese: input.chinese.trim(),
      pinyin: input.pinyin?.trim() || null,
      mongolian: input.mongolian.trim(),
      order_index: orderIndex,
    });

    if (error) {
      return { data: null, error: formatWriteError(error) };
    }

    const list = await getSubtitleLinesByLessonId(input.lessonId);
    const created = list.data?.find((row) => row.order_index === orderIndex);
    if (!created) {
      return { data: null, error: null };
    }
    return { data: created, error: null };
  } catch {
    return { data: null, error: "Subtitle нэмэхэд алдаа гарлаа." };
  }
}

export async function deleteSubtitleLine(
  id: number
): Promise<AdminContentResult<null>> {
  if (!supabase || !hasSupabaseConfig) {
    return notConfigured();
  }

  const gate = await requireAdmin();
  if (gate.error) {
    return { data: null, error: gate.error };
  }

  try {
    const { error } = await supabase.from("subtitle_lines").delete().eq("id", id);
    if (error) {
      return { data: null, error: formatWriteError(error) };
    }
    return { data: null, error: null };
  } catch {
    return { data: null, error: "Subtitle устгахад алдаа гарлаа." };
  }
}

// --- Vocabulary ---

export async function getVocabularyWordsByLessonId(
  lessonId: string
): Promise<AdminContentResult<AdminVocabularyWord[]>> {
  if (!supabase || !hasSupabaseConfig) {
    return notConfigured();
  }

  const gate = await requireAdmin();
  if (gate.error) {
    return { data: null, error: gate.error };
  }

  try {
    const { data, error } = await supabase
      .from("vocabulary_words")
      .select(
        "id, lesson_id, chinese, pinyin, mongolian, hsk_level, example_chinese, example_mongolian, order_index"
      )
      .eq("lesson_id", lessonId)
      .order("order_index", { ascending: true });

    if (error) {
      return { data: null, error: formatWriteError(error) };
    }

    return { data: (data as AdminVocabularyWord[]) ?? [], error: null };
  } catch {
    return { data: null, error: "Vocabulary уншихад алдаа гарлаа." };
  }
}

export async function createVocabularyWord(
  input: CreateVocabularyWordInput
): Promise<AdminContentResult<AdminVocabularyWord>> {
  if (!supabase || !hasSupabaseConfig) {
    return notConfigured();
  }

  const gate = await requireAdmin();
  if (gate.error) {
    return { data: null, error: gate.error };
  }

  const orderIndex =
    input.orderIndex ??
    (await nextOrderIndex("vocabulary_words", input.lessonId));

  try {
    const { error } = await supabase.from("vocabulary_words").insert({
      lesson_id: input.lessonId,
      chinese: input.chinese.trim(),
      pinyin: input.pinyin?.trim() || null,
      mongolian: input.mongolian.trim(),
      hsk_level: input.hskLevel?.trim() || null,
      example_chinese: input.exampleChinese?.trim() || null,
      example_mongolian: input.exampleMongolian?.trim() || null,
      order_index: orderIndex,
    });

    if (error) {
      return { data: null, error: formatWriteError(error) };
    }

    await refreshLessonCounts(input.lessonId);

    const list = await getVocabularyWordsByLessonId(input.lessonId);
    const created = list.data?.find((row) => row.order_index === orderIndex);
    return { data: created ?? null, error: null };
  } catch {
    return { data: null, error: "Vocabulary нэмэхэд алдаа гарлаа." };
  }
}

export async function deleteVocabularyWord(
  id: number,
  lessonId: string
): Promise<AdminContentResult<null>> {
  if (!supabase || !hasSupabaseConfig) {
    return notConfigured();
  }

  const gate = await requireAdmin();
  if (gate.error) {
    return { data: null, error: gate.error };
  }

  try {
    const { error } = await supabase
      .from("vocabulary_words")
      .delete()
      .eq("id", id);

    if (error) {
      return { data: null, error: formatWriteError(error) };
    }

    await refreshLessonCounts(lessonId);
    return { data: null, error: null };
  } catch {
    return { data: null, error: "Vocabulary устгахад алдаа гарлаа." };
  }
}

// --- Quiz ---

export async function getQuizQuestionsByLessonId(
  lessonId: string
): Promise<AdminContentResult<AdminQuizQuestion[]>> {
  if (!supabase || !hasSupabaseConfig) {
    return notConfigured();
  }

  const gate = await requireAdmin();
  if (gate.error) {
    return { data: null, error: gate.error };
  }

  try {
    const { data, error } = await supabase
      .from("quiz_questions")
      .select(
        "id, lesson_id, type, question, options, correct_answer, explanation, order_index"
      )
      .eq("lesson_id", lessonId)
      .order("order_index", { ascending: true });

    if (error) {
      return { data: null, error: formatWriteError(error) };
    }

    const rows = (data ?? []).map((row) => ({
      ...(row as Omit<AdminQuizQuestion, "options">),
      options: parseOptions((row as { options: unknown }).options),
    }));

    return { data: rows, error: null };
  } catch {
    return { data: null, error: "Quiz уншихад алдаа гарлаа." };
  }
}

export async function createQuizQuestion(
  input: CreateQuizQuestionInput
): Promise<AdminContentResult<AdminQuizQuestion>> {
  if (!supabase || !hasSupabaseConfig) {
    return notConfigured();
  }

  const gate = await requireAdmin();
  if (gate.error) {
    return { data: null, error: gate.error };
  }

  const orderIndex =
    input.orderIndex ??
    (await nextOrderIndex("quiz_questions", input.lessonId));

  try {
    const { error } = await supabase.from("quiz_questions").insert({
      lesson_id: input.lessonId,
      type: input.type,
      question: input.question.trim(),
      options: input.options,
      correct_answer: input.correctAnswer.trim(),
      explanation: input.explanation?.trim() || null,
      order_index: orderIndex,
    });

    if (error) {
      return { data: null, error: formatWriteError(error) };
    }

    await refreshLessonCounts(input.lessonId);

    const list = await getQuizQuestionsByLessonId(input.lessonId);
    const created = list.data?.find((row) => row.order_index === orderIndex);
    return { data: created ?? null, error: null };
  } catch {
    return { data: null, error: "Quiz нэмэхэд алдаа гарлаа." };
  }
}

export async function deleteQuizQuestion(
  id: number,
  lessonId: string
): Promise<AdminContentResult<null>> {
  if (!supabase || !hasSupabaseConfig) {
    return notConfigured();
  }

  const gate = await requireAdmin();
  if (gate.error) {
    return { data: null, error: gate.error };
  }

  try {
    const { error } = await supabase.from("quiz_questions").delete().eq("id", id);

    if (error) {
      return { data: null, error: formatWriteError(error) };
    }

    await refreshLessonCounts(lessonId);
    return { data: null, error: null };
  } catch {
    return { data: null, error: "Quiz устгахад алдаа гарлаа." };
  }
}
