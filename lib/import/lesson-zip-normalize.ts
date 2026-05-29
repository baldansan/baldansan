/** Multilingual normalization for lesson ZIP packages (Korean + Chinese/HSK). */

import { inferLanguageFromCourseId } from "@/lib/language-track";

export type ZipImportContext = {
  courseId: string;
  language: string;
  targetLanguage?: string;
  uiLanguage?: string;
  isKorean: boolean;
};

export type NormalizedZipManifest = {
  packageVersion: string;
  courseId: string;
  lessonId: string;
  language: string;
  targetLanguage?: string;
  uiLanguage?: string;
  title?: string;
  mongolianTitle?: string;
  source?: string;
  hasAudio?: boolean;
  hasImages?: boolean;
  contentType?: string;
  lessonType?: string;
};

export type NormalizedZipLesson = {
  courseId: string;
  lessonId?: string;
  /** Learner-facing title (Mongolian preferred). */
  title: string;
  /** Target-script line stored in DB `chinese_title`. */
  targetTitle: string;
  mongolianTitle?: string;
  /** Legacy alias kept for import shell + preview. */
  chineseTitle: string;
  subtitle?: string;
  description?: string;
  duration?: string;
  status?: string;
  orderIndex?: number;
  mediaStatus?: string;
  audioFile?: string;
  thumbnailFile?: string;
  videoFile?: string;
  sourceNote?: string;
  contentType?: string;
  lessonType?: string;
};

export type NormalizedZipVocabulary = {
  id?: string;
  chinese: string;
  pinyin: string | null;
  mongolian: string;
  hskLevel: string | null;
  exampleChinese: string | null;
  exampleMongolian: string | null;
};

export type NormalizedZipQuiz = {
  id?: string;
  type: string;
  question: string;
  options: unknown;
  correctAnswer: string;
  explanation?: string;
  skillTags?: string[];
  difficulty?: string;
  lessonSection?: string;
  phase?: string;
  orderIndex?: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function trim(value: unknown): string {
  return String(value ?? "").trim();
}

export function buildZipImportContext(
  courseId: string,
  language: string,
  targetLanguage?: string,
  uiLanguage?: string
): ZipImportContext {
  const isKorean =
    targetLanguage === "ko" ||
    courseId.toLowerCase().startsWith("korean") ||
    inferLanguageFromCourseId(courseId) === "ko" ||
    language.toLowerCase().startsWith("ko");

  return {
    courseId,
    language,
    targetLanguage: targetLanguage || undefined,
    uiLanguage: uiLanguage || undefined,
    isKorean,
  };
}

export function targetScriptLabel(ctx: ZipImportContext): string {
  return ctx.isKorean ? "Target title (Korean)" : "Chinese title";
}

export function normalizeZipManifest(
  raw: unknown,
  errors: string[],
  warnings: string[]
): NormalizedZipManifest | null {
  if (!isRecord(raw)) {
    errors.push("manifest.json must be an object.");
    return null;
  }

  for (const key of ["packageVersion", "courseId", "lessonId"] as const) {
    if (!trim(raw[key])) {
      errors.push(`manifest.json: ${key} is required.`);
    }
  }

  if (errors.length > 0) return null;

  const courseId = trim(raw.courseId);
  const languageRaw = trim(raw.language);
  const targetLanguage = trim(raw.targetLanguage) || undefined;
  const uiLanguage = trim(raw.uiLanguage) || undefined;

  let language = languageRaw;
  if (!language) {
    language = targetLanguage === "ko" || courseId.toLowerCase().startsWith("korean")
      ? "ko-MN"
      : "zh-MN";
    warnings.push("language field missing; defaulting based on courseId.");
  }

  return {
    packageVersion: trim(raw.packageVersion),
    courseId,
    lessonId: trim(raw.lessonId),
    language,
    targetLanguage,
    uiLanguage,
    title: trim(raw.title) || undefined,
    mongolianTitle: trim(raw.mongolianTitle ?? raw.mongolian_title) || undefined,
    source: trim(raw.source) || undefined,
    hasAudio: raw.hasAudio === true,
    hasImages: raw.hasImages === true,
    contentType: trim(raw.contentType ?? raw.content_type) || undefined,
    lessonType: trim(raw.lessonType ?? raw.lesson_type) || undefined,
  };
}

export function normalizeZipLesson(
  raw: unknown,
  ctx: ZipImportContext,
  warnings: string[]
): NormalizedZipLesson | null {
  const errors: string[] = [];

  if (!isRecord(raw)) {
    errors.push("lesson.json must be an object.");
    return null;
  }

  if (!trim(raw.courseId)) {
    errors.push("lesson.json: courseId is required.");
  }

  const targetTitle =
    trim(raw.targetTitle ?? raw.target_title) ||
    trim(raw.chineseTitle ?? raw.chinese_title) ||
    trim(raw.title);

  if (!targetTitle) {
    errors.push(
      "lesson.json: one of title, targetTitle, or chineseTitle is required."
    );
  }

  const mongolianTitle =
    trim(raw.mongolianTitle ?? raw.mongolian_title) || undefined;

  if (!mongolianTitle) {
    warnings.push("lesson.json: mongolianTitle missing (recommended for learner UI).");
  }

  if (errors.length > 0) return null;

  const displayTitle = mongolianTitle || trim(raw.title) || targetTitle;
  const orderIndexRaw = raw.orderIndex ?? raw.order_index;
  const orderIndex =
    orderIndexRaw != null && Number.isFinite(Number(orderIndexRaw))
      ? Math.floor(Number(orderIndexRaw))
      : undefined;

  return {
    courseId: trim(raw.courseId),
    lessonId: trim(raw.lessonId ?? raw.lesson_id) || undefined,
    title: displayTitle,
    targetTitle,
    mongolianTitle,
    chineseTitle: targetTitle,
    subtitle: trim(raw.subtitle) || undefined,
    description: trim(raw.description) || undefined,
    duration: trim(raw.duration) || undefined,
    status: trim(raw.status) || "draft",
    orderIndex,
    mediaStatus: trim(raw.mediaStatus ?? raw.media_status) || undefined,
    audioFile: trim(raw.audioFile ?? raw.audio_file) || undefined,
    thumbnailFile: trim(raw.thumbnailFile ?? raw.thumbnail_file) || undefined,
    videoFile: trim(raw.videoFile ?? raw.video_file) || undefined,
    sourceNote: trim(raw.sourceNote ?? raw.source_note) || undefined,
    contentType: trim(raw.contentType ?? raw.content_type) || undefined,
    lessonType: trim(raw.lessonType ?? raw.lesson_type) || undefined,
  };
}

function readExampleFields(item: Record<string, unknown>): {
  exampleChinese: string | null;
  exampleMongolian: string | null;
} {
  const example = isRecord(item.example) ? item.example : null;
  const exampleChinese =
    trim(example?.target) ||
    trim(item.exampleSentence) ||
    trim(item.exampleChinese ?? item.example_chinese) ||
    trim(item.exampleTarget) ||
    trim(item.sentence) ||
    "";

  const exampleMongolian =
    trim(example?.mongolian) ||
    trim(item.exampleMongolian ?? item.example_mongolian) ||
    trim(item.exampleSentenceMn) ||
    "";

  return {
    exampleChinese: exampleChinese || null,
    exampleMongolian: exampleMongolian || null,
  };
}

export function normalizeZipVocabularyRow(
  item: Record<string, unknown>,
  index: number,
  _ctx: ZipImportContext,
  errors: string[],
  _warnings: string[]
): NormalizedZipVocabulary | null {
  const target =
    trim(item.target) ||
    trim(item.korean) ||
    trim(item.chinese);

  const mongolian = trim(item.mongolian);

  if (!target) {
    errors.push(`vocabulary[${index}]: target or chinese is required.`);
    return null;
  }
  if (!mongolian) {
    errors.push(`vocabulary[${index}]: mongolian is required.`);
    return null;
  }

  const reading =
    trim(item.reading ?? item.romanization ?? item.pinyin) || null;
  const level =
    trim(item.level ?? item.koreanLevel ?? item.hskLevel ?? item.hsk_level) ||
    null;

  const examples = readExampleFields(item);

  return {
    id: trim(item.id) || undefined,
    chinese: target,
    pinyin: reading,
    mongolian,
    hskLevel: level,
    exampleChinese: examples.exampleChinese,
    exampleMongolian: examples.exampleMongolian,
  };
}

export function normalizeZipQuizRow(
  item: Record<string, unknown>,
  index: number,
  errors: string[],
  warnings: string[]
): NormalizedZipQuiz | null {
  const gameType = trim(item.gameType ?? item.game_type);
  if (gameType) {
    warnings.push(
      `quiz[${index}]: gameType "${gameType}" is not imported as quiz — app games generate from vocabulary. Remove or keep as author note only.`
    );
    return null;
  }

  const id = trim(item.id);
  const type = trim(item.type).toLowerCase().replace(/\s+/g, "_");
  const question = trim(item.question ?? item.prompt);
  const correctAnswer = trim(item.correctAnswer ?? item.correct_answer ?? item.answer);
  const options = item.options;

  if (!id) {
    warnings.push(`quiz[${index}]: id missing (recommended).`);
  }
  if (!type) {
    errors.push(`quiz[${index}]: type is required.`);
  }
  if (!question) {
    errors.push(`quiz[${index}]: prompt (or question) is required.`);
  }
  if (!correctAnswer) {
    errors.push(`quiz[${index}]: answer (or correctAnswer) is required.`);
  }

  const skillTags = Array.isArray(item.skillTags)
    ? item.skillTags.filter((tag): tag is string => typeof tag === "string")
    : undefined;
  const difficulty = trim(item.difficulty) || undefined;
  const lessonSection =
    trim(item.lessonSection ?? item.lesson_section ?? item.section) || undefined;
  const phase = trim(item.phase) || undefined;
  const orderRaw = item.orderIndex ?? item.order_index;
  const orderIndex =
    typeof orderRaw === "number" && Number.isFinite(orderRaw)
      ? orderRaw
      : undefined;

  if (!skillTags?.length) {
    warnings.push(`quiz[${index}]: skillTags missing.`);
  }
  if (!difficulty) {
    warnings.push(`quiz[${index}]: difficulty missing.`);
  }

  const isMultipleChoice =
    type === "multiple_choice" ||
    type === "multiplechoice" ||
    type === "mcq" ||
    type === "choice";

  if (isMultipleChoice) {
    const optionList = Array.isArray(options)
      ? options.filter(
          (opt): opt is string => typeof opt === "string" && Boolean(opt.trim())
        )
      : [];
    if (optionList.length < 2) {
      errors.push(`quiz[${index}]: multiple_choice requires at least 2 options.`);
    }
  }

  if (errors.some((msg) => msg.startsWith(`quiz[${index}]`))) {
    return null;
  }

  return {
    id: id || undefined,
    type,
    question,
    options: options ?? [],
    correctAnswer,
    explanation: trim(item.explanation) || undefined,
    skillTags,
    difficulty,
    lessonSection,
    phase,
    orderIndex,
  };
}

export function normalizeZipVocabulary(
  rows: Record<string, unknown>[],
  ctx: ZipImportContext,
  errors: string[],
  warnings: string[]
): NormalizedZipVocabulary[] {
  const normalized: NormalizedZipVocabulary[] = [];
  for (let i = 0; i < rows.length; i += 1) {
    const row = normalizeZipVocabularyRow(rows[i], i, ctx, errors, warnings);
    if (row) normalized.push(row);
  }
  return normalized;
}

export function normalizeZipQuiz(
  rows: Record<string, unknown>[],
  errors: string[],
  warnings: string[]
): NormalizedZipQuiz[] {
  const normalized: NormalizedZipQuiz[] = [];
  for (let i = 0; i < rows.length; i += 1) {
    const row = normalizeZipQuizRow(rows[i], i, errors, warnings);
    if (row) normalized.push(row);
  }
  return normalized;
}

export function mapNormalizedVocabularyToBulkImport(
  rows: NormalizedZipVocabulary[]
): Record<string, unknown>[] {
  return rows.map((row) => ({
    chinese: row.chinese,
    pinyin: row.pinyin,
    mongolian: row.mongolian,
    hskLevel: row.hskLevel,
    exampleChinese: row.exampleChinese,
    exampleMongolian: row.exampleMongolian,
  }));
}

export function mapNormalizedQuizToBulkImport(
  rows: NormalizedZipQuiz[]
): Record<string, unknown>[] {
  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    question: row.question,
    options: row.options,
    correctAnswer: row.correctAnswer,
    explanation: row.explanation,
    skillTags: row.skillTags,
    difficulty: row.difficulty,
    lessonSection: row.lessonSection,
    phase: row.phase,
    orderIndex: row.orderIndex,
  }));
}

export function mapSubtitlesForBulkImport(
  rows: Record<string, unknown>[]
): Record<string, unknown>[] {
  return rows.map((row) => ({
    start: row.start ?? row.startTime,
    end: row.end ?? row.endTime,
    chinese: row.chinese ?? row.target,
    pinyin: row.pinyin ?? row.reading,
    mongolian: row.mongolian,
  }));
}
