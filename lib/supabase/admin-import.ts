import { analyzeImportPayloadExtras } from "@/lib/admin/import-qa";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isCurrentUserAdmin } from "@/lib/supabase/admin";
import {
  ADMIN_ACTIVITY_ACTIONS,
  buildShallowDiffSummary,
  logAdminActivity,
} from "@/lib/supabase/admin-activity";
import { getLessonCompleteness, refreshLessonCounts } from "@/lib/supabase/admin-content";
import { fetchLessonRowById } from "@/lib/supabase/content";
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
  target?: string;
  korean?: string;
  pinyin?: string;
  reading?: string;
  romanization?: string;
  mongolian?: string;
  hskLevel?: string;
  hsk_level?: string;
  level?: string;
  koreanLevel?: string;
  exampleChinese?: string;
  example_chinese?: string;
  exampleMongolian?: string;
  example_mongolian?: string;
  example?: {
    target?: string;
    mongolian?: string;
  };
  exampleSentence?: string;
  exampleTarget?: string;
  sentence?: string;
  exampleSentenceMn?: string;
};

export type QuizImportItem = {
  id?: string;
  type?: string;
  question?: string;
  prompt?: string;
  options?: unknown;
  correctAnswer?: string;
  correct_answer?: string;
  answer?: string;
  explanation?: string;
  skillTags?: string[];
  difficulty?: string;
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
  skillTags?: string[];
  difficulty?: string;
};

export type LessonImportPayload = {
  subtitles: NormalizedSubtitleImport[];
  vocabulary: NormalizedVocabularyImport[];
  quizQuestions: NormalizedQuizImport[];
};

export type BulkImportMode = "append" | "replace";

export type BulkImportOptions = {
  mode?: BulkImportMode;
  /** Server route: authenticated Supabase client from cookies. */
  client?: SupabaseClient;
  /** Skip client-side admin gate when route already verified admin. */
  skipAdminGate?: boolean;
};

function resolveImportClient(client?: SupabaseClient) {
  return client ?? supabase;
}

export type ImportValidationContext = {
  courseId?: string;
  targetLanguage?: string;
  isKorean?: boolean;
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

function readVocabularyExample(item: Record<string, unknown>): {
  exampleChinese: string | null;
  exampleMongolian: string | null;
} {
  const example = isRecord(item.example) ? item.example : null;
  const exampleChinese =
    String(example?.target ?? "").trim() ||
    String(item.exampleChinese ?? item.example_chinese ?? "").trim() ||
    String(item.exampleSentence ?? item.exampleTarget ?? item.sentence ?? "").trim() ||
    "";
  const exampleMongolian =
    String(example?.mongolian ?? "").trim() ||
    String(item.exampleMongolian ?? item.example_mongolian ?? "").trim() ||
    String(item.exampleSentenceMn ?? "").trim() ||
    "";

  return {
    exampleChinese: exampleChinese || null,
    exampleMongolian: exampleMongolian || null,
  };
}

export function validateLessonImportPayload(
  raw: Record<string, unknown>,
  context?: ImportValidationContext
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
    const chinese = String(item.chinese ?? item.target ?? "").trim();
    const mongolian = String(item.mongolian ?? "").trim();
    if (!chinese) {
      errors.push(`subtitles[${index}]: target or chinese is required.`);
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
        pinyin: String(item.pinyin ?? item.reading ?? "").trim() || null,
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
    const chinese = String(
      item.chinese ?? item.target ?? item.korean ?? ""
    ).trim();
    const mongolian = String(item.mongolian ?? "").trim();
    if (!chinese) {
      errors.push(`vocabulary[${index}]: target or chinese is required.`);
    }
    if (!mongolian) {
      errors.push(`vocabulary[${index}]: mongolian is required.`);
    }
    if (chinese && mongolian) {
      const examples = readVocabularyExample(item);
      vocabulary.push({
        chinese,
        pinyin:
          String(
            item.pinyin ?? item.reading ?? item.romanization ?? ""
          ).trim() || null,
        mongolian,
        hskLevel:
          String(
            item.hskLevel ??
              item.hsk_level ??
              item.level ??
              item.koreanLevel ??
              ""
          ).trim() || null,
        exampleChinese: examples.exampleChinese,
        exampleMongolian: examples.exampleMongolian,
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
    const question = String(item.question ?? item.prompt ?? "").trim();
    const options = parseOptions(item.options);
    const correctAnswer = String(
      item.correctAnswer ?? item.correct_answer ?? item.answer ?? ""
    ).trim();
    const explanation = String(item.explanation ?? "").trim() || null;

    if (!type) {
      errors.push(
        `quizQuestions[${index}]: type must be multiple_choice or cloze.`
      );
    }
    if (!question) {
      errors.push(`quizQuestions[${index}]: question (or prompt) is required.`);
    }
    if (!correctAnswer) {
      errors.push(
        `quizQuestions[${index}]: correctAnswer (or answer) is required.`
      );
    }
    if (type === "multiple_choice" && options.length < 2) {
      errors.push(
        `quizQuestions[${index}]: multiple_choice requires at least 2 options.`
      );
    } else if (type === "cloze" && options.length > 0 && options.length < 2) {
      errors.push(`quizQuestions[${index}]: cloze options need at least 2 when provided.`);
    }
    if (type && question && correctAnswer) {
      const canImport =
        type === "multiple_choice"
          ? options.length >= 2
          : type === "cloze"
            ? options.length === 0 || options.length >= 2
            : options.length >= 2;
      if (canImport) {
        const skillTags = Array.isArray(item.skillTags)
          ? item.skillTags.filter((tag): tag is string => typeof tag === "string")
          : undefined;
        const difficulty = String(item.difficulty ?? "").trim() || undefined;
        quizQuestions.push({
          type,
          question,
          options,
          correctAnswer,
          explanation,
          skillTags,
          difficulty,
        });
      }
    }
  });

  const payload: LessonImportPayload = {
    subtitles,
    vocabulary,
    quizQuestions,
  };

  const extras = analyzeImportPayloadExtras(payload, context);
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
  lessonId: string,
  client?: SupabaseClient
): Promise<number> {
  const db = resolveImportClient(client);
  if (!db) return 0;
  const { data } = await db
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
  table: "subtitle_lines" | "vocabulary_words" | "quiz_questions",
  client?: SupabaseClient
): Promise<AdminImportResult<null>> {
  const db = resolveImportClient(client);
  if (!db) return notConfigured();

  const { error } = await db.from(table).delete().eq("lesson_id", lessonId);

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
  const db = resolveImportClient(options?.client);
  if (!db || !hasSupabaseConfig) {
    return notConfigured();
  }

  if (!options?.skipAdminGate) {
    const gate = await requireAdmin();
    if (gate.error) {
      return { data: null, error: gate.error };
    }
  }

  const mode: BulkImportMode = options?.mode ?? "append";
  const trimmedLessonId = lessonId.trim();

  let resolvedLessonId = trimmedLessonId;
  if (options?.client) {
    const row = await fetchLessonRowById(options.client, trimmedLessonId);
    if (row) {
      resolvedLessonId = row.canonicalId;
    }
  }

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
    const beforeCompleteness = await getLessonCompleteness(
      resolvedLessonId,
      options?.client,
      {
        skipAdminGate: options?.skipAdminGate ?? Boolean(options?.client),
      }
    );
    const beforeSnapshot = beforeCompleteness.data
      ? {
          subtitleCount: beforeCompleteness.data.subtitleCount,
          vocabularyCount: beforeCompleteness.data.vocabularyCount,
          quizCount: beforeCompleteness.data.quizCount,
        }
      : undefined;

    if (mode === "replace") {
      for (const table of [
        "subtitle_lines",
        "vocabulary_words",
        "quiz_questions",
      ] as const) {
        const del = await deleteLessonContent(resolvedLessonId, table, options?.client);
        if (del.error) return { data: null, error: del.error };
      }
    }

    let subtitleStart = 0;
    let vocabStart = 0;
    let quizStart = 0;

    if (mode === "append") {
      subtitleStart = await maxOrderIndex("subtitle_lines", resolvedLessonId, options?.client);
      vocabStart = await maxOrderIndex("vocabulary_words", resolvedLessonId, options?.client);
      quizStart = await maxOrderIndex("quiz_questions", resolvedLessonId, options?.client);
    }

    if (payload.subtitles.length > 0) {
      const rows = payload.subtitles.map((item, i) => ({
        lesson_id: resolvedLessonId,
        start_time: item.startTime,
        end_time: item.endTime,
        chinese: item.chinese,
        pinyin: item.pinyin,
        mongolian: item.mongolian,
        order_index: subtitleStart + i + 1,
      }));
      const { error } = await db.from("subtitle_lines").insert(rows);
      if (error) {
        return { data: null, error: formatWriteError(error) };
      }
    }

    if (payload.vocabulary.length > 0) {
      const rows = payload.vocabulary.map((item, i) => ({
        lesson_id: resolvedLessonId,
        chinese: item.chinese,
        pinyin: item.pinyin,
        mongolian: item.mongolian,
        hsk_level: item.hskLevel,
        example_chinese: item.exampleChinese,
        example_mongolian: item.exampleMongolian,
        order_index: vocabStart + i + 1,
      }));
      const { error } = await db.from("vocabulary_words").insert(rows);
      if (error) {
        return { data: null, error: formatWriteError(error) };
      }
    }

    if (payload.quizQuestions.length > 0) {
      const rows = payload.quizQuestions.map((item, i) => ({
        lesson_id: resolvedLessonId,
        type: item.type,
        question: item.question,
        options: item.options,
        correct_answer: item.correctAnswer,
        explanation: item.explanation,
        order_index: quizStart + i + 1,
      }));
      const { error } = await db.from("quiz_questions").insert(rows);
      if (error) {
        return { data: null, error: formatWriteError(error) };
      }
    }

    const refresh = await refreshLessonCounts(resolvedLessonId, options?.client, {
      skipAdminGate: options?.skipAdminGate,
    });
    if (refresh.error) {
      return { data: null, error: refresh.error };
    }

    const afterCompleteness = await getLessonCompleteness(
      resolvedLessonId,
      options?.client,
      {
        skipAdminGate: options?.skipAdminGate ?? Boolean(options?.client),
      }
    );
    const afterSnapshot = afterCompleteness.data
      ? {
          subtitleCount: afterCompleteness.data.subtitleCount,
          vocabularyCount: afterCompleteness.data.vocabularyCount,
          quizCount: afterCompleteness.data.quizCount,
        }
      : {
          subtitleCount: payload.subtitles.length,
          vocabularyCount: payload.vocabulary.length,
          quizCount: payload.quizQuestions.length,
        };

    await logAdminActivity({
      action: ADMIN_ACTIVITY_ACTIONS.bulkImportCompleted,
      entityType: "lesson",
      entityId: resolvedLessonId,
      lessonId: resolvedLessonId,
      title: `Bulk import completed for lesson ${resolvedLessonId}`,
      metadata: {
        mode,
        subtitlesInserted: payload.subtitles.length,
        vocabularyInserted: payload.vocabulary.length,
        quizQuestionsInserted: payload.quizQuestions.length,
      },
      beforeSnapshot,
      afterSnapshot,
      diffSummary: {
        mode,
        subtitlesInserted: payload.subtitles.length,
        vocabularyInserted: payload.vocabulary.length,
        quizQuestionsInserted: payload.quizQuestions.length,
        ...buildShallowDiffSummary(beforeSnapshot, afterSnapshot),
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
