/**
 * Korean textbook lesson ZIP normalization and validation.
 * Maps Korean field names to the shared DB import shape (chinese/pinyin columns).
 */

import type {
  LessonImportPayload,
  NormalizedQuizImport,
  NormalizedVocabularyImport,
} from "@/lib/supabase/admin-import";

export type KoreanZipManifest = {
  packageVersion: string;
  courseId: string;
  lessonId: string;
  language: string;
  targetLanguage?: string;
  uiLanguage?: string;
  title?: string;
  targetTitle?: string;
  mongolianTitle?: string;
  source?: string;
  lessonType?: string;
  hasAudio?: boolean;
  hasImages?: boolean;
};

export type KoreanZipLesson = {
  courseId: string;
  title: string;
  targetTitle: string;
  mongolianTitle?: string;
  subtitle?: string;
  description?: string;
  lessonType?: string;
  duration?: string;
  status: string;
  orderIndex?: number;
  mediaStatus?: string;
  audioFile?: string;
  thumbnailFile?: string;
  sourceNote?: string;
};

export type KoreanZipVocabularyRow = {
  id?: string;
  korean: string;
  romanization: string | null;
  mongolian: string;
  level: string | null;
  exampleKorean: string | null;
  exampleRomanization: string | null;
  exampleMongolian: string | null;
  audioFile?: string;
  skillTags?: string[];
};

export type KoreanZipQuizRow = {
  id?: string;
  type: string;
  skill?: string;
  question: string;
  promptKorean?: string;
  promptRomanization?: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  difficulty?: string;
  skillTags?: string[];
};

export type KoreanParsedZipFiles = {
  manifest: unknown;
  lesson: unknown;
  vocabulary: unknown;
  quiz: unknown;
  subtitles?: unknown;
  practice?: unknown;
  grammar?: unknown;
};

export type KoreanLessonPackage = {
  manifest: KoreanZipManifest | null;
  lesson: KoreanZipLesson | null;
  vocabulary: KoreanZipVocabularyRow[];
  quizQuestions: KoreanZipQuizRow[];
  subtitles: Record<string, unknown>[];
  practiceRows: Record<string, unknown>[];
  grammarRows: Record<string, unknown>[];
  warnings: string[];
  errors: string[];
};

export type KoreanLessonValidation = KoreanLessonPackage & {
  ok: boolean;
  preview: KoreanImportPreview | null;
  importPayload: LessonImportPayload | null;
};

export type KoreanImportPreview = {
  courseId: string;
  lessonId: string;
  language: string;
  title: string;
  targetTitle: string;
  mongolianTitle?: string;
  lessonType?: string;
  source?: string;
  vocabularyCount: number;
  quizCount: number;
  subtitleCount: number;
  practiceCount: number;
  grammarCount: number;
  audioFileCount: number;
  imageFileCount: number;
};

const DEFAULT_KOREAN_LEVEL = "KR-Beginner";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function trim(value: unknown): string {
  return String(value ?? "").trim();
}

function parseOptions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeQuizType(raw: string): "multiple_choice" | "cloze" | null {
  const t = raw.toLowerCase().replace(/\s+/g, "_");
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

function parseArray(raw: unknown, field: string, errors: string[], required: boolean) {
  if (raw == null) {
    if (required) errors.push(`${field} is required.`);
    return [] as Record<string, unknown>[];
  }
  if (!Array.isArray(raw)) {
    errors.push(`${field} must be an array.`);
    return [];
  }
  return raw.filter(isRecord);
}

/** Map one Korean vocabulary row to DB bulk-import shape. */
export function mapKoreanVocabularyToDb(
  row: KoreanZipVocabularyRow
): NormalizedVocabularyImport {
  return {
    chinese: row.korean,
    pinyin: row.romanization,
    mongolian: row.mongolian,
    hskLevel: row.level ?? DEFAULT_KOREAN_LEVEL,
    exampleChinese: row.exampleKorean,
    exampleMongolian: row.exampleMongolian,
  };
}

/** Map one Korean quiz row to DB bulk-import shape. */
export function mapKoreanQuizToDb(row: KoreanZipQuizRow): NormalizedQuizImport {
  const type = normalizeQuizType(row.type) ?? "multiple_choice";
  return {
    type,
    question: row.question,
    options: row.options,
    correctAnswer: row.correctAnswer,
    explanation: row.explanation ?? null,
    skillTags: row.skillTags,
    difficulty: row.difficulty,
  };
}

function mapSubtitlesForImport(
  rows: Record<string, unknown>[]
): LessonImportPayload["subtitles"] {
  return rows
    .map((row) => {
      const startTime = trim(row.start ?? row.startTime);
      const endTime = trim(row.end ?? row.endTime);
      const korean = trim(row.korean ?? row.target ?? row.chinese);
      const mongolian = trim(row.mongolian);
      if (!korean || !mongolian || !startTime || !endTime) return null;
      return {
        startTime,
        endTime,
        chinese: korean,
        pinyin: trim(row.romanization ?? row.reading ?? row.pinyin) || null,
        mongolian,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);
}

function normalizeManifest(
  raw: unknown,
  errors: string[]
): KoreanZipManifest | null {
  if (!isRecord(raw)) {
    errors.push("manifest.json must be an object.");
    return null;
  }

  for (const key of ["packageVersion", "courseId", "lessonId"] as const) {
    if (!trim(raw[key])) {
      errors.push(`manifest.json: ${key} is required.`);
    }
  }

  if (errors.some((msg) => msg.startsWith("manifest.json"))) {
    return null;
  }

  return {
    packageVersion: trim(raw.packageVersion),
    courseId: trim(raw.courseId),
    lessonId: trim(raw.lessonId),
    language: trim(raw.language) || "ko-KR",
    targetLanguage: trim(raw.targetLanguage) || "ko",
    uiLanguage: trim(raw.uiLanguage) || "mn",
    title: trim(raw.title) || undefined,
    targetTitle: trim(raw.targetTitle ?? raw.target_title) || undefined,
    mongolianTitle: trim(raw.mongolianTitle ?? raw.mongolian_title) || undefined,
    source: trim(raw.source) || undefined,
    lessonType: trim(raw.lessonType ?? raw.lesson_type) || undefined,
    hasAudio: raw.hasAudio === true,
    hasImages: raw.hasImages === true,
  };
}

function normalizeLesson(
  raw: unknown,
  manifest: KoreanZipManifest | null,
  errors: string[],
  warnings: string[]
): KoreanZipLesson | null {
  if (!isRecord(raw)) {
    errors.push("lesson.json must be an object.");
    return null;
  }

  if (!trim(raw.courseId)) {
    errors.push("lesson.json: courseId is required.");
  }

  const targetTitle =
    trim(raw.targetTitle ?? raw.target_title) ||
    trim(raw.koreanTitle ?? raw.korean_title) ||
    trim(manifest?.targetTitle) ||
    trim(raw.title);

  if (!targetTitle) {
    errors.push("lesson.json: targetTitle or koreanTitle is required.");
  }

  const mongolianTitle =
    trim(raw.mongolianTitle ?? raw.mongolian_title) ||
    trim(manifest?.mongolianTitle) ||
    undefined;

  const displayTitle =
    mongolianTitle || trim(raw.title) || trim(manifest?.title) || targetTitle;

  if (!trim(raw.lessonType ?? raw.lesson_type ?? manifest?.lessonType)) {
    warnings.push("lesson.json: lessonType missing (recommended — e.g. hangul, grammar).");
  }

  if (errors.some((msg) => msg.startsWith("lesson.json"))) {
    return null;
  }

  const orderRaw = raw.orderIndex ?? raw.order_index;
  const orderIndex =
    orderRaw != null && Number.isFinite(Number(orderRaw))
      ? Math.floor(Number(orderRaw))
      : undefined;

  const lessonType =
    trim(raw.lessonType ?? raw.lesson_type) || manifest?.lessonType || undefined;

  return {
    courseId: trim(raw.courseId),
    title: displayTitle,
    targetTitle,
    mongolianTitle,
    subtitle: trim(raw.subtitle) || mongolianTitle || undefined,
    description: trim(raw.description) || undefined,
    lessonType,
    duration: trim(raw.duration) || undefined,
    status: trim(raw.status) || "draft",
    orderIndex,
    mediaStatus: trim(raw.mediaStatus ?? raw.media_status) || undefined,
    audioFile: trim(raw.audioFile ?? raw.audio_file) || undefined,
    thumbnailFile: trim(raw.thumbnailFile ?? raw.thumbnail_file) || undefined,
    sourceNote: trim(raw.sourceNote ?? raw.source_note) || manifest?.source,
  };
}

function normalizeVocabularyRow(
  item: Record<string, unknown>,
  index: number,
  errors: string[],
  warnings: string[]
): KoreanZipVocabularyRow | null {
  const korean = trim(item.korean ?? item.target ?? item.chinese);
  const mongolian = trim(item.mongolian);
  const romanization =
    trim(item.romanization ?? item.reading ?? item.pinyin) || null;

  if (!korean) {
    errors.push(`vocabulary[${index}]: korean is required.`);
    return null;
  }
  if (!mongolian) {
    errors.push(`vocabulary[${index}]: mongolian is required.`);
    return null;
  }
  if (!romanization) {
    warnings.push(
      `vocabulary[${index}] "${korean}": romanization missing (recommended).`
    );
  }

  const level =
    trim(item.level ?? item.koreanLevel ?? item.hskLevel) ||
    DEFAULT_KOREAN_LEVEL;

  const skillTags = Array.isArray(item.skillTags)
    ? item.skillTags.filter((tag): tag is string => typeof tag === "string")
    : undefined;

  return {
    id: trim(item.id) || undefined,
    korean,
    romanization,
    mongolian,
    level,
    exampleKorean:
      trim(item.exampleKorean ?? item.example_korean ?? item.exampleChinese) ||
      null,
    exampleRomanization: trim(item.exampleRomanization ?? item.example_romanization) || null,
    exampleMongolian:
      trim(item.exampleMongolian ?? item.example_mongolian) || null,
    audioFile: trim(item.audioFile ?? item.audio_file) || undefined,
    skillTags,
  };
}

function normalizeQuizRow(
  item: Record<string, unknown>,
  index: number,
  errors: string[],
  warnings: string[]
): KoreanZipQuizRow | null {
  const gameType = trim(item.gameType ?? item.game_type);
  if (gameType) {
    warnings.push(
      `quiz[${index}]: gameType "${gameType}" is skipped — practice games generate from vocabulary.`
    );
    return null;
  }

  const typeRaw = trim(item.type);
  const type = normalizeQuizType(typeRaw);
  const question =
    trim(item.question ?? item.prompt) ||
    trim(item.promptKorean) ||
    trim(item.prompt_korean);

  const options = parseOptions(item.options);
  const correctAnswer = trim(
    item.correctAnswer ?? item.correct_answer ?? item.answer
  );

  if (!type) {
    errors.push(`quiz[${index}]: type must be multiple_choice or cloze.`);
  }
  if (!question) {
    errors.push(`quiz[${index}]: question (or promptKorean) is required.`);
  }
  if (!correctAnswer) {
    errors.push(`quiz[${index}]: correctAnswer is required.`);
  }

  const skillTags = Array.isArray(item.skillTags)
    ? item.skillTags.filter((tag): tag is string => typeof tag === "string")
    : undefined;
  const difficulty = trim(item.difficulty) || undefined;
  const skill = trim(item.skill) || undefined;

  if (!skillTags?.length && !skill) {
    warnings.push(`quiz[${index}]: skillTags/skill missing (optional).`);
  }
  if (!difficulty) {
    warnings.push(`quiz[${index}]: difficulty missing (optional).`);
  }

  if (type === "multiple_choice" && options.length < 2) {
    errors.push(`quiz[${index}]: multiple_choice requires at least 2 options.`);
  }

  if (
    correctAnswer &&
    options.length >= 2 &&
    !options.includes(correctAnswer)
  ) {
    errors.push(`quiz[${index}]: correctAnswer is not in options.`);
  }

  if (errors.some((msg) => msg.startsWith(`quiz[${index}]`))) {
    return null;
  }

  return {
    id: trim(item.id) || undefined,
    type: typeRaw || "multiple_choice",
    skill,
    question,
    promptKorean: trim(item.promptKorean ?? item.prompt_korean) || undefined,
    promptRomanization:
      trim(item.promptRomanization ?? item.prompt_romanization) || undefined,
    options,
    correctAnswer,
    explanation: trim(item.explanation) || undefined,
    difficulty,
    skillTags,
  };
}

/** Normalize parsed Korean ZIP JSON files into a package object. */
export function normalizeKoreanLessonPackage(
  files: KoreanParsedZipFiles
): KoreanLessonPackage {
  const errors: string[] = [];
  const warnings: string[] = [];

  const manifest = normalizeManifest(files.manifest, errors);
  const lesson = normalizeLesson(files.lesson, manifest, errors, warnings);

  const vocabularyRaw = parseArray(
    files.vocabulary,
    "vocabulary.json",
    errors,
    true
  );
  const vocabulary: KoreanZipVocabularyRow[] = [];
  for (let i = 0; i < vocabularyRaw.length; i += 1) {
    const row = normalizeVocabularyRow(vocabularyRaw[i], i, errors, warnings);
    if (row) vocabulary.push(row);
  }

  const quizRaw = parseArray(files.quiz, "quiz.json", errors, true);
  const quizQuestions: KoreanZipQuizRow[] = [];
  for (let i = 0; i < quizRaw.length; i += 1) {
    const row = normalizeQuizRow(quizRaw[i], i, errors, warnings);
    if (row) quizQuestions.push(row);
  }

  let subtitles: Record<string, unknown>[] = [];
  if (files.subtitles != null) {
    subtitles = parseArray(files.subtitles, "subtitles.json", errors, false);
  }

  let practiceRows: Record<string, unknown>[] = [];
  if (files.practice != null) {
    practiceRows = parseArray(files.practice, "practice.json", errors, false);
    if (practiceRows.length > 0) {
      warnings.push(
        "practice.json found — workbook exercises are reference-only in v1 (not imported into quiz table)."
      );
    }
  }

  let grammarRows: Record<string, unknown>[] = [];
  if (files.grammar != null) {
    grammarRows = parseArray(files.grammar, "grammar.json", errors, false);
    if (grammarRows.length > 0) {
      warnings.push(
        "grammar.json found — grammar notes are reference-only in v1 (store in lesson description or source_note manually if needed)."
      );
    }
  }

  return {
    manifest,
    lesson,
    vocabulary,
    quizQuestions,
    subtitles,
    practiceRows,
    grammarRows,
    warnings,
    errors,
  };
}

function buildImportPayload(pkg: KoreanLessonPackage): LessonImportPayload {
  return {
    subtitles: mapSubtitlesForImport(pkg.subtitles),
    vocabulary: pkg.vocabulary.map(mapKoreanVocabularyToDb),
    quizQuestions: pkg.quizQuestions.map(mapKoreanQuizToDb),
  };
}

function buildPreview(
  pkg: KoreanLessonPackage,
  audioFileCount: number,
  imageFileCount: number
): KoreanImportPreview | null {
  if (!pkg.manifest || !pkg.lesson) return null;

  return {
    courseId: pkg.lesson.courseId || pkg.manifest.courseId,
    lessonId: pkg.manifest.lessonId,
    language: pkg.manifest.language,
    title: pkg.lesson.title,
    targetTitle: pkg.lesson.targetTitle,
    mongolianTitle: pkg.lesson.mongolianTitle,
    lessonType: pkg.lesson.lessonType ?? pkg.manifest.lessonType,
    source: pkg.manifest.source ?? pkg.lesson.sourceNote,
    vocabularyCount: pkg.vocabulary.length,
    quizCount: pkg.quizQuestions.length,
    subtitleCount: pkg.subtitles.length,
    practiceCount: pkg.practiceRows.length,
    grammarCount: pkg.grammarRows.length,
    audioFileCount,
    imageFileCount,
  };
}

/** Validate a normalized Korean package — Korean-specific rules, no Chinese field warnings. */
export function validateKoreanLessonPackage(
  pkg: KoreanLessonPackage,
  media?: { audioFileCount: number; imageFileCount: number; hasLessonAudio?: boolean }
): KoreanLessonValidation {
  const errors = [...pkg.errors];
  const warnings = [...pkg.warnings];

  if (!pkg.manifest) {
    errors.push("manifest.json is required.");
  }
  if (!pkg.lesson) {
    errors.push("lesson.json is required.");
  }
  if (!pkg.manifest?.courseId && !pkg.lesson?.courseId) {
    errors.push("courseId is required in manifest.json or lesson.json.");
  }
  if (pkg.vocabulary.length === 0) {
    errors.push("vocabulary.json must contain at least one row.");
  }
  if (pkg.quizQuestions.length === 0) {
    errors.push("quiz.json must contain at least one question.");
  }

  if (pkg.lesson?.status && pkg.lesson.status !== "draft") {
    warnings.push("Imported lessons are forced to draft status on import.");
  }

  const audioCount = media?.audioFileCount ?? 0;
  const imageCount = media?.imageFileCount ?? 0;

  if (audioCount === 0 && !media?.hasLessonAudio) {
    warnings.push(
      "Audio missing — info only. TTS pronunciation fallback is available in the app."
    );
  }
  if (imageCount === 0) {
    warnings.push("Images missing — info only (optional for Korean book lessons).");
  }

  if (pkg.subtitles.length === 0) {
    warnings.push("subtitles.json missing — OK for Hangul/prelesson packages.");
  }

  let importPayload: LessonImportPayload | null = null;
  if (
    errors.length === 0 &&
    pkg.lesson &&
    pkg.vocabulary.length > 0 &&
    pkg.quizQuestions.length > 0
  ) {
    importPayload = buildImportPayload(pkg);
  }

  const preview = buildPreview(pkg, audioCount, imageCount);
  const ok =
    errors.length === 0 &&
    Boolean(preview) &&
    importPayload !== null &&
    importPayload.vocabulary.length > 0 &&
    importPayload.quizQuestions.length > 0;

  return {
    ...pkg,
    ok,
    errors,
    warnings,
    preview,
    importPayload,
  };
}

/** SQL snippet shown when korean-1 course is missing. */
export const KOREAN_COURSE_SETUP_SQL = `-- Run in Supabase SQL editor before Korean import
insert into public.courses (id, title, description, level, status, order_index)
values (
  'korean-1',
  'Солонгост ажиллахад хэрэгтэй Солонгос хэл',
  'Korean Book 1 course shell for admin import.',
  'Beginner',
  'available',
  10
)
on conflict (id) do nothing;`;
