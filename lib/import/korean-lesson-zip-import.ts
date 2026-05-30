import JSZip from "jszip";
import { detectLessonPackageType } from "@/lib/import/detect-lesson-package-type";
import { peekZipPackageDetection } from "@/lib/import/zip-package-peek";
import { buildWrongImporterValidation } from "@/lib/import/wrong-importer-validation";
import {
  normalizeKoreanLessonPackage,
  validateKoreanLessonPackage,
  type KoreanLessonValidation,
} from "@/lib/import/korean-lesson-normalize";
import { normalizeZipPath } from "@/lib/import/zip-path";
import {
  extractZipMediaFiles,
  type LessonImportPreview,
  type LessonZipMediaFile,
  type LessonZipValidation,
} from "@/lib/import/lesson-zip-import";

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

/** Map Korean validation into the shared LessonZipValidation shape for the import UI. */
export function koreanValidationToLessonZipValidation(
  korean: KoreanLessonValidation,
  mediaFiles: LessonZipMediaFile[]
): LessonZipValidation {
  const preview: LessonImportPreview | null = korean.preview
    ? {
        courseId: korean.preview.courseId,
        lessonId: korean.preview.lessonId,
        language: korean.preview.language,
        targetLanguage: "ko",
        uiLanguage: "mn",
        title: korean.preview.title,
        targetTitle: korean.preview.targetTitle,
        targetTitleLabel: "Target title (Korean)",
        mongolianTitle: korean.preview.mongolianTitle,
        source: korean.preview.source,
        vocabularyCount: korean.preview.vocabularyCount,
        quizCount: korean.preview.quizCount,
        subtitleCount: korean.preview.subtitleCount,
        audioFileCount: korean.preview.audioFileCount,
        imageFileCount: korean.preview.imageFileCount,
        mediaStatus: korean.lesson?.mediaStatus,
      }
    : null;

  return {
    ok: korean.ok,
    manifest: korean.manifest
      ? {
          packageVersion: korean.manifest.packageVersion,
          courseId: korean.manifest.courseId,
          lessonId: korean.manifest.lessonId,
          language: korean.manifest.language,
          targetLanguage: korean.manifest.targetLanguage,
          uiLanguage: korean.manifest.uiLanguage,
          title: korean.manifest.title,
          mongolianTitle: korean.manifest.mongolianTitle,
          source: korean.manifest.source,
          lessonType: korean.manifest.lessonType,
        }
      : null,
    lesson: korean.lesson
      ? {
          courseId: korean.lesson.courseId,
          title: korean.lesson.title,
          targetTitle: korean.lesson.targetTitle,
          chineseTitle: korean.lesson.targetTitle,
          mongolianTitle: korean.lesson.mongolianTitle,
          subtitle: korean.lesson.subtitle,
          description: korean.lesson.description,
          duration: korean.lesson.duration,
          status: korean.lesson.status,
          orderIndex: korean.lesson.orderIndex,
          mediaStatus: korean.lesson.mediaStatus,
          audioFile: korean.lesson.audioFile,
          thumbnailFile: korean.lesson.thumbnailFile,
          sourceNote: korean.lesson.sourceNote,
          lessonType: korean.lesson.lessonType,
          teachingImages: korean.lesson.teachingImages,
        }
      : null,
    importContext: korean.manifest
      ? {
          courseId: korean.manifest.courseId,
          language: korean.manifest.language,
          targetLanguage: korean.manifest.targetLanguage ?? "ko",
          uiLanguage: korean.manifest.uiLanguage ?? "mn",
          isKorean: true,
        }
      : null,
    vocabulary: korean.vocabulary.map((row) => ({
      id: row.id,
      chinese: row.korean,
      pinyin: row.romanization,
      mongolian: row.mongolian,
      hskLevel: row.level,
      exampleChinese: row.exampleKorean,
      exampleMongolian: row.exampleMongolian,
      audioFile: row.audioFile,
    })),
    quizQuestions: korean.quizQuestions.map((row) => ({
      type: row.type,
      question: row.question,
      options: row.options,
      correctAnswer: row.correctAnswer,
      explanation: row.explanation,
      skillTags: row.skillTags,
      difficulty: row.difficulty,
    })),
    subtitles: korean.subtitles,
    mediaFiles,
    warnings: korean.warnings,
    errors: korean.errors,
    info: korean.info,
    preview,
    importPayload: korean.importPayload,
    contentValidation: korean.importPayload
      ? {
          valid: korean.ok,
          errors: korean.errors,
          warnings: korean.warnings,
          payload: korean.importPayload,
          counts: {
            subtitles: korean.importPayload.subtitles.length,
            vocabulary: korean.importPayload.vocabulary.length,
            quizQuestions: korean.importPayload.quizQuestions.length,
          },
        }
      : null,
  };
}

export async function parseKoreanLessonZip(file: File): Promise<LessonZipValidation> {
  const peek = await peekZipPackageDetection(file);
  const detected = detectLessonPackageType(peek);
  if (detected.type === "chinese") {
    return buildWrongImporterValidation("korean", {
      type: "chinese",
      reason: detected.reason,
    });
  }

  if (typeof window === "undefined") {
    return koreanValidationToLessonZipValidation(
      {
        ok: false,
        manifest: null,
        lesson: null,
        vocabulary: [],
        quizQuestions: [],
        subtitles: [],
        practiceRows: [],
        grammarRows: [],
        warnings: [],
        errors: ["ZIP parsing is only available in the browser."],
        preview: null,
        importPayload: null,
        info: [],
      },
      []
    );
  }

  const warnings: string[] = [];
  if (!file.name.toLowerCase().endsWith(".zip")) {
    warnings.push("File extension is not .zip — parsing will still be attempted.");
  }

  try {
    const buffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(buffer);

    const manifestResult = await readJsonFile(zip, "manifest.json");
    const lessonResult = await readJsonFile(zip, "lesson.json");
    const vocabularyResult = await readJsonFile(zip, "vocabulary.json");
    const quizResult = await readJsonFile(zip, "quiz.json");
    const subtitlesResult = await readJsonFile(zip, "subtitles.json");
    const practiceResult = await readJsonFile(zip, "practice.json");
    const grammarResult = await readJsonFile(zip, "grammar.json");
    const teachingImagesResult = await readJsonFile(zip, "teaching-images.json");

    const errors: string[] = [];
    if (manifestResult.error) errors.push(manifestResult.error);
    if (lessonResult.error) errors.push(lessonResult.error);
    if (vocabularyResult.error) errors.push(vocabularyResult.error);
    if (quizResult.error) errors.push(quizResult.error);

    if (subtitlesResult.error && !subtitlesResult.error.includes("not found")) {
      errors.push(subtitlesResult.error);
    }
    if (practiceResult.error && !practiceResult.error.includes("not found")) {
      errors.push(practiceResult.error);
    }
    if (grammarResult.error && !grammarResult.error.includes("not found")) {
      errors.push(grammarResult.error);
    }
    if (
      teachingImagesResult.error &&
      !teachingImagesResult.error.includes("not found")
    ) {
      errors.push(teachingImagesResult.error);
    }

    const normalized = normalizeKoreanLessonPackage({
      manifest: manifestResult.data,
      lesson: lessonResult.data,
      vocabulary: vocabularyResult.data,
      quiz: quizResult.data,
      subtitles: subtitlesResult.error?.includes("not found")
        ? undefined
        : subtitlesResult.data,
      practice: practiceResult.error?.includes("not found")
        ? undefined
        : practiceResult.data,
      grammar: grammarResult.error?.includes("not found")
        ? undefined
        : grammarResult.data,
      teachingImages: teachingImagesResult.error?.includes("not found")
        ? undefined
        : teachingImagesResult.data,
    });

    const mediaFiles = await extractZipMediaFiles(zip);

    const indexEntry = zip.file("index.html") ?? zip.file("Index.html");
    if (indexEntry) {
      normalized.warnings.push(
        "index.html found — teacher reference only; not imported into CMS."
      );
    }

    const validated = validateKoreanLessonPackage(normalized, {
      audioFileCount: mediaFiles.filter((f) => f.kind === "audio").length,
      imageFileCount: mediaFiles.filter((f) => f.kind === "image").length,
      hasLessonAudio: Boolean(normalized.lesson?.audioFile),
    });

    validated.warnings.push(...warnings);
    if (errors.length) {
      validated.errors.push(...errors.filter((e) => !validated.errors.includes(e)));
      validated.ok = validated.ok && errors.length === 0;
    }

    return koreanValidationToLessonZipValidation(validated, mediaFiles);
  } catch {
    return koreanValidationToLessonZipValidation(
      {
        ok: false,
        manifest: null,
        lesson: null,
        vocabulary: [],
        quizQuestions: [],
        subtitles: [],
        practiceRows: [],
        grammarRows: [],
        warnings,
        errors: ["ZIP файл уншихад алдаа гарлаа."],
        preview: null,
        importPayload: null,
        info: [],
      },
      []
    );
  }
}
