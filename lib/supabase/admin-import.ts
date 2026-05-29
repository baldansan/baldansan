import { analyzeImportPayloadExtras } from "@/lib/admin/import-qa";
import { isCurrentUserAdmin } from "@/lib/supabase/admin";
import {
  ADMIN_ACTIVITY_ACTIONS,
  logAdminActivityFireAndForget,
} from "@/lib/supabase/admin-activity";
import { refreshLessonCounts } from "@/lib/supabase/admin-content";
import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";

export type AdminImportResult<T> = {
  data: T | null;
  error: string | null;
};

export type SubtitleImportItem = {
  start?: string;
  startTime?: string;
  end?: string;
  endTime?: string;
  chinese?: string;
  pinyin?: string;
  mongolian?: string;
};

export type VocabularyImportItem = {
  chinese?: string;
  pinyin?: string;
  mongolian?: string;
  hskLevel?: string;
  hsk_level?: string;
  exampleChinese?: string;
  example_chinese?: string;
  exampleMongolian?: string;
  example_mongolian?: string;
};

export type QuizImportItem = {
  type?: string;
  question?: string;
  options?: unknown;
  correctAnswer?: string;
  correct_answer?: string;
  explanation?: string;
};

export type NormalizedSubtitleImport = {
  startTime: string;
  endTime: string;
  chinese: string;
  pinyin: string | null;
  mongolian: string;
};

export type NormalizedVocabularyImport = {
  chinese: string;
  pinyin: string | null;
  mongolian: string;
  hskLevel: string | null;
  exampleChinese: string | null;
  exampleMongolian: string | null;
};

export type NormalizedQuizImport = {
  type: "multiple_choice" | "cloze";
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string | null;
};

export type LessonImportPayload = {
  subtitles: NormalizedSubtitleImport[];
  vocabulary: NormalizedVocabularyImport[];
  quizQuestions: NormalizedQuizImport[];
};

export type BulkImportMode = "append" | "replace";

export type BulkImportOptions = {
  mode?: BulkImportMode;
};

export type ImportValidationResult = {
  /** True when there are no blocking errors (warnings allowed). */
  valid: boolean;
  errors: string[];
  warnings: string[];
  payload: LessonImportPayload;
  counts: {
    subtitles: number;
    vocabulary: number;
    quizQuestions: number;
  };
};

export type BulkImportSummary = {
  subtitlesInserted: number;
  vocabularyInserted: number;
  quizQuestionsInserted: number;
  mode: BulkImportMode;
};

const NOT_CONFIGURED_MESSAGE =
  "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.";

const RLS_HINT = "Admin update policy may not be enabled.";

const EMPTY_PAYLOAD: LessonImportPayload = {
  subtitles: [],
  vocabulary: [],
  quizQuestions: [],
};

function notConfigured<T>(): AdminImportResult<T> {
  return { data: null, error: NOT_CONFIGURED_MESSAGE };
}

function formatWriteError(error: { code?: string; message: string }): string {
  const message = error.message ?? "";
  if (
    error.code === "42501" ||
    message.toLowerCase().includes("policy") ||
    message.toLowerCase().includes("row-level security")
  ) {
    return `${RLS_HINT} (${message})`;
  }
  return message || "Import хийхэд алдаа гарлаа.";
}

async function requireAdmin(): Promise<AdminImportResult<true>> {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    return { data: null, error: "Admin эрх шаардлагатай." };
  }
  return { data: true, error: null };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asArray(value: unknown, field: string, errors: string[]): unknown[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    errors.push(`${field} must be an array.`);
    return null;
  }
  return value;
}

function normalizeQuizType(raw: string | undefined): "multiple_choice" | "cloze" | null {
  if (!raw?.trim()) return null;
  const t = raw.trim().toLowerCase().replace(/\s+/g, "_");
  if (t === "cloze" || t === "cloze_blank") return "cloze";
  if (
    t === "multiple_choice" ||
    t === "multiplechoice" ||
    t === "mcq" ||
    t === "choice"
  ) {
    return "multiple_choice";
  }
  return null;
}

function parseOptions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseLessonImportJson(
  rawText: string
): AdminImportResult<Record<string, unknown>> {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return { data: null, error: "JSON хоосон байна." };
  }

  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (!isRecord(parsed)) {
      return { data: null, error: "JSON root must be an object." };
    }
    return { data: parsed, error: null };
  } catch {
    return { data: null, error: "Буруу JSON формат. Syntax-ийг шалгана уу." };
  }
}

export function validateLessonImportPayload(
  raw: Record<string, unknown>
): ImportValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const subtitlesRaw = asArray(
    raw.subtitles ?? raw.subtitleLines,
    "subtitles",
    errors
  );
  const vocabularyRaw = asArray(raw.vocabulary ?? raw.words, "vocabulary", errors);
  const quizRaw = asArray(
    raw.quizQuestions ?? raw.quiz,
    "quizQuestions",
    errors
  );

  if (raw.lesson !== undefined && isRecord(raw.lesson)) {
    warnings.push(
      "lesson metadata block is ignored by bulk import; only subtitles, vocabulary, and quizQuestions are imported."
    );
  }
  if (raw.exportedAt !== undefined) {
    warnings.push("exportedAt is ignored by bulk import.");
  }

  if (errors.length > 0 || !subtitlesRaw || !vocabularyRaw || !quizRaw) {
    return {
      valid: false,
      errors,
      warnings,
      payload: EMPTY_PAYLOAD,
      counts: { subtitles: 0, vocabulary: 0, quizQuestions: 0 },
    };
  }

  const subtitles: NormalizedSubtitleImport[] = [];
  subtitlesRaw.forEach((item, index) => {
    if (!isRecord(item)) {
      errors.push(`subtitles[${index}] must be an object.`);
      return;
    }
    const startTime = String(item.start ?? item.startTime ?? "").trim();
    const endTime = String(item.end ?? item.endTime ?? "").trim();
    const chinese = String(item.chinese ?? "").trim();
    const mongolian = String(item.mongolian ?? "").trim();
    if (!chinese) {
      errors.push(`subtitles[${index}]: chinese is required.`);
    }
    if (!mongolian) {
      errors.push(`subtitles[${index}]: mongolian is required.`);
    }
    if (!startTime) {
      errors.push(`subtitles[${index}]: start (or startTime) is required.`);
    }
    if (!endTime) {
      errors.push(`subtitles[${index}]: end (or endTime) is required.`);
    }
    if (chinese && mongolian && startTime && endTime) {
      subtitles.push({
        startTime,
        endTime,
        chinese,
        pinyin: String(item.pinyin ?? "").trim() || null,
        mongolian,
      });
    }
  });

  const vocabulary: NormalizedVocabularyImport[] = [];
  vocabularyRaw.forEach((item, index) => {
    if (!isRecord(item)) {
      errors.push(`vocabulary[${index}] must be an object.`);
      return;
    }
    const chinese = String(item.chinese ?? "").trim();
    const mongolian = String(item.mongolian ?? "").trim();
    if (!chinese) {
      errors.push(`vocabulary[${index}]: chinese is required.`);
    }
    if (!mongolian) {
      errors.push(`vocabulary[${index}]: mongolian is required.`);
    }
    if (chinese && mongolian) {
      vocabulary.push({
        chinese,
        pinyin: String(item.pinyin ?? "").trim() || null,
        mongolian,
        hskLevel:
          String(item.hskLevel ?? item.hsk_level ?? "").trim() || null,
        exampleChinese:
          String(item.exampleChinese ?? item.example_chinese ?? "").trim() ||
          null,
        exampleMongolian:
          String(item.exampleMongolian ?? item.example_mongolian ?? "").trim() ||
          null,
      });
    }
  });

  const quizQuestions: NormalizedQuizImport[] = [];
  quizRaw.forEach((item, index) => {
    if (!isRecord(item)) {
      errors.push(`quizQuestions[${index}] must be an object.`);
      return;
    }
    const type = normalizeQuizType(
      typeof item.type === "string" ? item.type : undefined
    );
    const question = String(item.question ?? "").trim();
    const options = parseOptions(item.options);
    const correctAnswer = String(
      item.correctAnswer ?? item.correct_answer ?? ""
    ).trim();
    const explanation = String(item.explanation ?? "").trim() || null;

    if (!type) {
      errors.push(
        `quizQuestions[${index}]: type must be multiple_choice or cloze.`
      );
    }
    if (!question) {
      errors.push(`quizQuestions[${index}]: question is required.`);
    }
    if (!correctAnswer) {
      errors.push(
        `quizQuestions[${index}]: correctAnswer (or correct_answer) is required.`
      );
    }
    if (options.length < 2) {
      errors.push(`quizQuestions[${index}]: at least 2 options required.`);
    }
    if (type && question && correctAnswer && options.length >= 2) {
      quizQuestions.push({
        type,
        question,
        options,
        correctAnswer,
        explanation,
      });
    }
  });

  const payload: LessonImportPayload = {
    subtitles,
    vocabulary,
    quizQuestions,
  };

  const extras = analyzeImportPayloadExtras(payload);
  for (const msg of extras.errors) {
    if (!errors.includes(msg)) errors.push(msg);
  }
  for (const msg of extras.warnings) {
    if (!warnings.includes(msg)) warnings.push(msg);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    payload,
    counts: {
      subtitles: subtitles.length,
      vocabulary: vocabulary.length,
      quizQuestions: quizQuestions.length,
    },
  };
}

async function maxOrderIndex(
  table: "subtitle_lines" | "vocabulary_words" | "quiz_questions",
  lessonId: string
): Promise<number> {
  if (!supabase) return 0;
  const { data } = await supabase
    .from(table)
    .select("order_index")
    .eq("lesson_id", lessonId)
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.order_index ?? 0;
}

async function deleteLessonContent(
  lessonId: string,
  table: "subtitle_lines" | "vocabulary_words" | "quiz_questions"
): Promise<AdminImportResult<null>> {
  if (!supabase) return notConfigured();

  const { error } = await supabase.from(table).delete().eq("lesson_id", lessonId);

  if (error) {
    return { data: null, error: formatWriteError(error) };
  }
  return { data: null, error: null };
}

export async function bulkImportLessonContent(
  lessonId: string,
  payload: LessonImportPayload,
  options?: BulkImportOptions
): Promise<AdminImportResult<BulkImportSummary>> {
  if (!supabase || !hasSupabaseConfig) {
    return notConfigured();
  }

  const gate = await requireAdmin();
  if (gate.error) {
    return { data: null, error: gate.error };
  }

  const mode: BulkImportMode = options?.mode ?? "append";
  const trimmedLessonId = lessonId.trim();

  if (
    payload.subtitles.length === 0 &&
    payload.vocabulary.length === 0 &&
    payload.quizQuestions.length === 0
  ) {
    return {
      data: null,
      error: "Import хийх контент байхгүй (subtitles, vocabulary, quiz хоосон).",
    };
  }

  try {
    if (mode === "replace") {
      for (const table of [
        "subtitle_lines",
        "vocabulary_words",
        "quiz_questions",
      ] as const) {
        const del = await deleteLessonContent(trimmedLessonId, table);
        if (del.error) return { data: null, error: del.error };
      }
    }

    let subtitleStart = 0;
    let vocabStart = 0;
    let quizStart = 0;

    if (mode === "append") {
      subtitleStart = await maxOrderIndex("subtitle_lines", trimmedLessonId);
      vocabStart = await maxOrderIndex("vocabulary_words", trimmedLessonId);
      quizStart = await maxOrderIndex("quiz_questions", trimmedLessonId);
    }

    if (payload.subtitles.length > 0) {
      const rows = payload.subtitles.map((item, i) => ({
        lesson_id: trimmedLessonId,
        start_time: item.startTime,
        end_time: item.endTime,
        chinese: item.chinese,
        pinyin: item.pinyin,
        mongolian: item.mongolian,
        order_index: subtitleStart + i + 1,
      }));
      const { error } = await supabase.from("subtitle_lines").insert(rows);
      if (error) {
        return { data: null, error: formatWriteError(error) };
      }
    }

    if (payload.vocabulary.length > 0) {
      const rows = payload.vocabulary.map((item, i) => ({
        lesson_id: trimmedLessonId,
        chinese: item.chinese,
        pinyin: item.pinyin,
        mongolian: item.mongolian,
        hsk_level: item.hskLevel,
        example_chinese: item.exampleChinese,
        example_mongolian: item.exampleMongolian,
        order_index: vocabStart + i + 1,
      }));
      const { error } = await supabase.from("vocabulary_words").insert(rows);
      if (error) {
        return { data: null, error: formatWriteError(error) };
      }
    }

    if (payload.quizQuestions.length > 0) {
      const rows = payload.quizQuestions.map((item, i) => ({
        lesson_id: trimmedLessonId,
        type: item.type,
        question: item.question,
        options: item.options,
        correct_answer: item.correctAnswer,
        explanation: item.explanation,
        order_index: quizStart + i + 1,
      }));
      const { error } = await supabase.from("quiz_questions").insert(rows);
      if (error) {
        return { data: null, error: formatWriteError(error) };
      }
    }

    const refresh = await refreshLessonCounts(trimmedLessonId);
    if (refresh.error) {
      return { data: null, error: refresh.error };
    }

    logAdminActivityFireAndForget({
      action: ADMIN_ACTIVITY_ACTIONS.bulkImportCompleted,
      entityType: "lesson",
      entityId: trimmedLessonId,
      lessonId: trimmedLessonId,
      title: `Bulk import completed for lesson ${trimmedLessonId}`,
      metadata: {
        mode,
        subtitlesInserted: payload.subtitles.length,
        vocabularyInserted: payload.vocabulary.length,
        quizQuestionsInserted: payload.quizQuestions.length,
      },
    });

    return {
      data: {
        subtitlesInserted: payload.subtitles.length,
        vocabularyInserted: payload.vocabulary.length,
        quizQuestionsInserted: payload.quizQuestions.length,
        mode,
      },
      error: null,
    };
  } catch {
    return { data: null, error: "Bulk import хийхэд алдаа гарлаа." };
  }
}

/** Parse + validate in one step for the admin UI. */
export function parseAndValidateLessonImport(
  rawText: string
): ImportValidationResult & { parseError?: string } {
  const parsed = parseLessonImportJson(rawText);
  if (parsed.error || !parsed.data) {
    return {
      valid: false,
      errors: [parsed.error ?? "Invalid JSON."],
      warnings: [],
      payload: EMPTY_PAYLOAD,
      counts: { subtitles: 0, vocabulary: 0, quizQuestions: 0 },
      parseError: parsed.error ?? undefined,
    };
  }
  return validateLessonImportPayload(parsed.data);
}
