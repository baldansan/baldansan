import JSZip from "jszip";
import { normalizeZipPath } from "@/lib/import/zip-path";
import {
  validateLessonImportPayload,
  type ImportValidationResult,
  type LessonImportPayload,
} from "@/lib/supabase/admin-import";

export type LessonZipManifest = {
  packageVersion: string;
  courseId: string;
  lessonId: string;
  language: string;
  title?: string;
  mongolianTitle?: string;
  source?: string;
  hasAudio?: boolean;
  hasImages?: boolean;
};

export type LessonZipLesson = {
  courseId: string;
  title: string;
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
};

export type LessonZipMediaKind = "audio" | "image";

export type LessonZipMediaFile = {
  zipPath: string;
  kind: LessonZipMediaKind;
  fileName: string;
  blob: Blob;
  mimeType: string;
};

export type LessonZipPackage = {
  ok: boolean;
  manifest: LessonZipManifest | null;
  lesson: LessonZipLesson | null;
  vocabulary: Record<string, unknown>[];
  quizQuestions: Record<string, unknown>[];
  subtitles: Record<string, unknown>[];
  mediaFiles: LessonZipMediaFile[];
  warnings: string[];
  errors: string[];
};

export type LessonImportPreview = {
  courseId: string;
  lessonId: string;
  language: string;
  title: string;
  mongolianTitle?: string;
  source?: string;
  vocabularyCount: number;
  quizCount: number;
  subtitleCount: number;
  audioFileCount: number;
  imageFileCount: number;
  mediaStatus?: string;
};

export type LessonZipValidation = LessonZipPackage & {
  preview: LessonImportPreview | null;
  importPayload: LessonImportPayload | null;
  contentValidation: ImportValidationResult | null;
};

function emptyLessonZipValidation(
  errors: string[],
  warnings: string[] = []
): LessonZipValidation {
  return {
    ok: false,
    manifest: null,
    lesson: null,
    vocabulary: [],
    quizQuestions: [],
    subtitles: [],
    mediaFiles: [],
    warnings,
    errors,
    preview: null,
    importPayload: null,
    contentValidation: null,
  };
}

const REQUIRED_MANIFEST_KEYS = [
  "packageVersion",
  "courseId",
  "lessonId",
  "language",
] as const;

const REQUIRED_LESSON_KEYS = ["courseId", "title", "chineseTitle"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readJsonFile(
  zip: JSZip,
  path: string
): Promise<{ data: unknown | null; error: string | null }> {
  const normalized = normalizeZipPath(path);
  const file =
    zip.file(normalized) ??
    zip.file(normalized.toLowerCase()) ??
    Object.entries(zip.files).find(
      ([name]) => normalizeZipPath(name).toLowerCase() === normalized.toLowerCase()
    )?.[1];

  if (!file || file.dir) {
    return { data: null, error: `${path} not found in ZIP.` };
  }

  try {
    const text = await file.async("string");
    return { data: JSON.parse(text) as unknown, error: null };
  } catch {
    return { data: null, error: `${path} is not valid JSON.` };
  }
}

function guessMimeType(fileName: string, kind: LessonZipMediaKind): string {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (kind === "audio") {
    if (ext === "mp3") return "audio/mpeg";
    if (ext === "wav") return "audio/wav";
    if (ext === "m4a") return "audio/mp4";
    return "audio/mpeg";
  }
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}

function mediaKindFromPath(path: string): LessonZipMediaKind | null {
  const lower = normalizeZipPath(path).toLowerCase();
  if (lower.startsWith("audio/")) return "audio";
  if (lower.startsWith("images/") || lower.startsWith("image/")) return "image";
  return null;
}

export async function extractZipMediaFiles(
  zip: JSZip
): Promise<LessonZipMediaFile[]> {
  const media: LessonZipMediaFile[] = [];

  for (const [rawPath, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    const path = normalizeZipPath(rawPath);
    const kind = mediaKindFromPath(path);
    if (!kind) continue;

    const fileName = path.split("/").pop() ?? path;
    const blob = await entry.async("blob");
    media.push({
      zipPath: path,
      kind,
      fileName,
      blob,
      mimeType: guessMimeType(fileName, kind),
    });
  }

  return media;
}

function parseManifest(raw: unknown, errors: string[]): LessonZipManifest | null {
  if (!isRecord(raw)) {
    errors.push("manifest.json must be an object.");
    return null;
  }

  for (const key of REQUIRED_MANIFEST_KEYS) {
    const value = String(raw[key] ?? "").trim();
    if (!value) {
      errors.push(`manifest.json: ${key} is required.`);
    }
  }

  if (errors.length > 0) return null;

  return {
    packageVersion: String(raw.packageVersion).trim(),
    courseId: String(raw.courseId).trim(),
    lessonId: String(raw.lessonId).trim(),
    language: String(raw.language).trim(),
    title: String(raw.title ?? "").trim() || undefined,
    mongolianTitle: String(raw.mongolianTitle ?? "").trim() || undefined,
    source: String(raw.source ?? "").trim() || undefined,
    hasAudio: raw.hasAudio === true,
    hasImages: raw.hasImages === true,
  };
}

function parseLessonJson(raw: unknown, errors: string[]): LessonZipLesson | null {
  if (!isRecord(raw)) {
    errors.push("lesson.json must be an object.");
    return null;
  }

  for (const key of REQUIRED_LESSON_KEYS) {
    const value = String(raw[key] ?? "").trim();
    if (!value) {
      errors.push(`lesson.json: ${key} is required.`);
    }
  }

  if (errors.length > 0) return null;

  const orderIndexRaw = raw.orderIndex ?? raw.order_index;
  const orderIndex =
    orderIndexRaw != null && Number.isFinite(Number(orderIndexRaw))
      ? Math.floor(Number(orderIndexRaw))
      : undefined;

  return {
    courseId: String(raw.courseId).trim(),
    title: String(raw.title).trim(),
    chineseTitle: String(raw.chineseTitle ?? raw.chinese_title ?? "").trim(),
    subtitle: String(raw.subtitle ?? "").trim() || undefined,
    description: String(raw.description ?? "").trim() || undefined,
    duration: String(raw.duration ?? "").trim() || undefined,
    status: String(raw.status ?? "draft").trim() || "draft",
    orderIndex,
    mediaStatus: String(raw.mediaStatus ?? raw.media_status ?? "").trim() || undefined,
    audioFile: String(raw.audioFile ?? raw.audio_file ?? "").trim() || undefined,
    thumbnailFile:
      String(raw.thumbnailFile ?? raw.thumbnail_file ?? "").trim() || undefined,
    videoFile: String(raw.videoFile ?? raw.video_file ?? "").trim() || undefined,
    sourceNote: String(raw.sourceNote ?? raw.source_note ?? "").trim() || undefined,
  };
}

function parseArrayFile(
  raw: unknown,
  field: string,
  errors: string[],
  required: boolean
): Record<string, unknown>[] {
  if (raw == null) {
    if (required) errors.push(`${field} is required.`);
    return [];
  }
  if (!Array.isArray(raw)) {
    errors.push(`${field} must be an array.`);
    return [];
  }
  return raw.filter(isRecord);
}

function mapSubtitlesForBulkImport(
  rows: Record<string, unknown>[]
): Record<string, unknown>[] {
  return rows.map((row) => ({
    start: row.start ?? row.startTime,
    end: row.end ?? row.endTime,
    chinese: row.chinese,
    pinyin: row.pinyin,
    mongolian: row.mongolian,
  }));
}

function mapQuizForBulkImport(
  rows: Record<string, unknown>[]
): Record<string, unknown>[] {
  return rows.map((row) => ({
    type: row.type,
    question: row.question,
    options: row.options,
    correctAnswer: row.correctAnswer ?? row.correct_answer,
    explanation: row.explanation,
  }));
}

function zipPathExists(zipPaths: Set<string>, ref: string): boolean {
  const normalized = normalizeZipPath(ref);
  if (zipPaths.has(normalized)) return true;
  return [...zipPaths].some(
    (path) => path.toLowerCase() === normalized.toLowerCase()
  );
}

export function mapZipPackageToBulkImport(
  pkg: LessonZipPackage
): Record<string, unknown> {
  return {
    subtitles: mapSubtitlesForBulkImport(pkg.subtitles),
    vocabulary: pkg.vocabulary,
    quizQuestions: mapQuizForBulkImport(pkg.quizQuestions),
  };
}

export function buildLessonImportPreview(
  pkg: LessonZipPackage
): LessonImportPreview | null {
  if (!pkg.manifest || !pkg.lesson) return null;

  return {
    courseId: pkg.lesson.courseId || pkg.manifest.courseId,
    lessonId: pkg.manifest.lessonId,
    language: pkg.manifest.language,
    title: pkg.lesson.title || pkg.manifest.title || pkg.manifest.lessonId,
    mongolianTitle: pkg.manifest.mongolianTitle,
    source: pkg.manifest.source,
    vocabularyCount: pkg.vocabulary.length,
    quizCount: pkg.quizQuestions.length,
    subtitleCount: pkg.subtitles.length,
    audioFileCount: pkg.mediaFiles.filter((file) => file.kind === "audio").length,
    imageFileCount: pkg.mediaFiles.filter((file) => file.kind === "image").length,
    mediaStatus: pkg.lesson.mediaStatus,
  };
}

export function validateLessonZipPackage(
  pkg: LessonZipPackage
): LessonZipValidation {
  const errors = [...pkg.errors];
  const warnings = [...pkg.warnings];

  if (!pkg.manifest) {
    errors.push("manifest.json is required.");
  }
  if (!pkg.lesson) {
    errors.push("lesson.json is required.");
  }
  if (pkg.vocabulary.length === 0) {
    errors.push("vocabulary.json must contain at least one row.");
  }
  if (!pkg.quizQuestions) {
    errors.push("quiz.json is required.");
  } else if (pkg.quizQuestions.length === 0) {
    warnings.push("quiz.json is empty — lesson will import without quiz questions.");
  }

  const zipPaths = new Set(
    pkg.mediaFiles.map((file) => normalizeZipPath(file.zipPath))
  );

  for (const row of pkg.vocabulary) {
    const audioFile = String(row.audioFile ?? row.audio_file ?? "").trim();
    if (audioFile && !zipPathExists(zipPaths, audioFile)) {
      warnings.push(
        `vocabulary audioFile "${audioFile}" listed but not found in ZIP — per-word audio is not stored in DB yet.`
      );
    }
  }

  if (pkg.lesson?.audioFile && !zipPathExists(zipPaths, pkg.lesson.audioFile)) {
    errors.push(`lesson.json audioFile "${pkg.lesson.audioFile}" not found in ZIP.`);
  }
  if (
    pkg.lesson?.thumbnailFile &&
    !zipPathExists(zipPaths, pkg.lesson.thumbnailFile)
  ) {
    errors.push(
      `lesson.json thumbnailFile "${pkg.lesson.thumbnailFile}" not found in ZIP.`
    );
  }
  if (pkg.lesson?.videoFile) {
    warnings.push(
      "lesson.json videoFile is noted but ZIP video upload is not automated in v1 — set video URL manually after import."
    );
  }

  if (pkg.manifest && pkg.lesson) {
    if (pkg.manifest.courseId !== pkg.lesson.courseId) {
      warnings.push(
        `manifest courseId (${pkg.manifest.courseId}) differs from lesson.json courseId (${pkg.lesson.courseId}). Using lesson.json.`
      );
    }
    if (pkg.lesson.status && pkg.lesson.status !== "draft") {
      warnings.push("Imported lessons are forced to draft status on import.");
    }
  }

  let importPayload: LessonImportPayload | null = null;
  let contentValidation: ImportValidationResult | null = null;

  if (errors.length === 0 && pkg.lesson && pkg.vocabulary.length > 0) {
    contentValidation = validateLessonImportPayload(mapZipPackageToBulkImport(pkg));
    importPayload = contentValidation.payload;
    for (const message of contentValidation.errors) {
      if (!errors.includes(message)) errors.push(message);
    }
    for (const message of contentValidation.warnings) {
      if (!warnings.includes(message)) warnings.push(message);
    }
  }

  const preview = buildLessonImportPreview(pkg);
  const ok =
    errors.length === 0 &&
    Boolean(preview) &&
    Boolean(importPayload) &&
    Boolean(contentValidation?.valid);

  return {
    ...pkg,
    ok,
    errors,
    warnings,
    preview,
    importPayload,
    contentValidation,
  };
}

export async function parseLessonZip(file: File): Promise<LessonZipValidation> {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (typeof window === "undefined") {
    return emptyLessonZipValidation([
      "ZIP parsing is only available in the browser.",
    ]);
  }

  if (!file.name.toLowerCase().endsWith(".zip")) {
    warnings.push("File extension is not .zip — parsing will still be attempted.");
  }

  try {
    const buffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(buffer);

    const manifestResult = await readJsonFile(zip, "manifest.json");
    if (manifestResult.error) errors.push(manifestResult.error);
    const manifest = manifestResult.data
      ? parseManifest(manifestResult.data, errors)
      : null;

    const lessonResult = await readJsonFile(zip, "lesson.json");
    if (lessonResult.error) errors.push(lessonResult.error);
    const lesson = lessonResult.data ? parseLessonJson(lessonResult.data, errors) : null;

    const vocabularyResult = await readJsonFile(zip, "vocabulary.json");
    if (vocabularyResult.error) errors.push(vocabularyResult.error);
    const vocabulary = parseArrayFile(
      vocabularyResult.data,
      "vocabulary.json",
      errors,
      true
    );

    const quizResult = await readJsonFile(zip, "quiz.json");
    if (quizResult.error) errors.push(quizResult.error);
    const quizQuestions = parseArrayFile(
      quizResult.data,
      "quiz.json",
      errors,
      true
    );

    const subtitlesResult = await readJsonFile(zip, "subtitles.json");
    let subtitles: Record<string, unknown>[] = [];
    if (subtitlesResult.error) {
      if (!subtitlesResult.error.includes("not found")) {
        errors.push(subtitlesResult.error);
      }
    } else {
      subtitles = parseArrayFile(
        subtitlesResult.data,
        "subtitles.json",
        errors,
        false
      );
    }

    const mediaFiles = await extractZipMediaFiles(zip);

    const pkg: LessonZipPackage = {
      ok: errors.length === 0,
      manifest,
      lesson,
      vocabulary,
      quizQuestions,
      subtitles,
      mediaFiles,
      warnings,
      errors,
    };

    return validateLessonZipPackage(pkg);
  } catch {
    return emptyLessonZipValidation(["ZIP файл уншихад алдаа гарлаа."], warnings);
  }
}
