import JSZip from "jszip";
import {
  buildZipImportContext,
  normalizeZipLesson,
  normalizeZipQuiz,
  normalizeZipVocabularyRow,
  type ZipImportContext,
} from "@/lib/import/lesson-zip-normalize";
import {
  buildLessonImportPreview,
  extractZipMediaFiles,
  mapZipPackageToBulkImport,
  type LessonZipMediaFile,
  type LessonZipPackage,
  type LessonZipValidation,
} from "@/lib/import/lesson-zip-import";
import { normalizeZipPath } from "@/lib/import/zip-path";
import { readJsonFromZip, readJsonFromZipFirst } from "@/lib/import/zip-json-read";
import { validateLessonImportPayload } from "@/lib/supabase/admin-import";
import { profileBadgeLabel } from "@/lib/import/chinese-hsk-profiles";
import {
  buildHskStudyContentBundle,
  summarizeHskStudyContentBundle,
} from "@/lib/import/chinese-hsk-study-bundle";
import {
  isChineseHskManifestRaw,
  attachCharactersFileToLesson,
  normalizeChineseHskManifest,
  normalizeChineseHskVocabularyRow,
  type ChineseHskManifest,
  type ChineseHskRawFiles,
} from "@/lib/import/chinese-hsk-normalize";
import { validateChineseHskPackage } from "@/lib/import/chinese-hsk-validate";
import type { HskImportPreview } from "@/lib/import/chinese-hsk-types";
import {
  buildTeachingImageRefsFromMedia,
  findHskHeroImage,
  resolveHskHeroThumbnailFile,
  summarizeHskImageImportStatus,
} from "@/lib/lesson/hsk-package-media";
import type { TeachingImageRef } from "@/lib/lesson/teaching-media";
import { isJsonSourceNote } from "@/lib/lesson/source-note-json";
import { resolveChineseHskSourceNoteForValidation } from "@/lib/import/chinese-hsk-source-note";

async function readJsonFile(
  zip: JSZip,
  path: string
): Promise<{ data: unknown | null; error: string | null }> {
  const result = await readJsonFromZip(zip, path);
  return { data: result.data, error: result.error };
}

async function readJsonFileFirst(
  zip: JSZip,
  paths: string[]
): Promise<{ data: unknown | null; error: string | null; path?: string }> {
  return readJsonFromZipFirst(zip, paths);
}

function zipHasFile(zip: JSZip, path: string): boolean {
  const normalized = normalizeZipPath(path).toLowerCase();
  return Object.keys(zip.files).some(
    (name) => normalizeZipPath(name).toLowerCase() === normalized
  );
}

function parseVocabularyArray(
  raw: unknown,
  ctx: ZipImportContext,
  errors: string[],
  warnings: string[]
) {
  if (raw == null) return [];
  if (!Array.isArray(raw)) {
    errors.push("vocabulary.json must be an array or object.");
    return [];
  }

  const rows = [];
  for (let i = 0; i < raw.length; i += 1) {
    const item = raw[i];
    if (typeof item !== "object" || item === null) continue;
    const normalized = normalizeChineseHskVocabularyRow(
      item as Record<string, unknown>,
      i,
      errors,
      warnings
    );
    if (!normalized) continue;
    const mapped = normalizeZipVocabularyRow(
      normalized as Record<string, unknown>,
      i,
      ctx,
      errors,
      warnings
    );
    if (mapped) rows.push(mapped);
  }
  return rows;
}

function buildTeachingImagesFromMedia(media: unknown): TeachingImageRef[] {
  return buildTeachingImageRefsFromMedia(media);
}

function resolveHskImportLessonType(
  manifest: ChineseHskManifest,
  lessonJson: unknown
): string {
  if (manifest.lessonType === "prelesson") return "prelesson";
  if (isRecord(lessonJson)) {
    const fromLesson = String(lessonJson.lessonType ?? lessonJson.lesson_type ?? "").trim();
    if (fromLesson) return fromLesson;
  }
  if (manifest.lessonNumber === 0) return "prelesson";
  return manifest.lessonProfile;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function trim(value: unknown): string {
  return String(value ?? "").trim();
}

function buildHskImportPreview(
  pkg: LessonZipPackage,
  manifest: ChineseHskManifest,
  hskValidation: ReturnType<typeof validateChineseHskPackage>,
  rawFiles: ChineseHskRawFiles
): HskImportPreview | null {
  const base = buildLessonImportPreview(pkg);
  if (!base) return null;

  const profile = manifest.lessonProfile;
  const meta = hskValidation.meta;

  const studySummary = meta
    ? summarizeHskStudyContentBundle(
        buildHskStudyContentBundle(rawFiles, manifest, meta)
      )
    : null;

  const videoRequired =
    Boolean(trim((rawFiles.lesson as Record<string, unknown> | null)?.videoFile)) ||
    (studySummary?.videoRequired ?? false);

  const heroImageFound = Boolean(findHskHeroImage(rawFiles.media));
  const imageStatus = summarizeHskImageImportStatus({
    mediaImageCount: studySummary?.mediaImageCount ?? 0,
    zipImageFileCount: base.imageFileCount,
    heroImageFound,
  });

  return {
    ...base,
    hskLevel: manifest.hskLevel,
    lessonProfile: profile,
    profileBadgeLabel: profileBadgeLabel(profile),
    lessonNumber: manifest.lessonNumber,
    bookPart: manifest.bookPart,
    textCount: meta?.textCount ?? 0,
    workbookListeningCount: meta?.workbookListeningCount ?? 0,
    workbookReadingCount: meta?.workbookReadingCount ?? 0,
    workbookWritingCount: meta?.workbookWritingCount ?? 0,
    workbookExerciseCount: meta?.workbookExerciseCount ?? 0,
    studySectionCount: studySummary?.studySectionCount ?? 0,
    guidedStepCount: studySummary?.guidedStepCount ?? 0,
    hasPronunciationContent: studySummary?.hasPronunciationContent ?? false,
    hasPinyinContent: studySummary?.hasPronunciationContent ?? false,
    hasToneContent: studySummary?.hasToneContent ?? false,
    hasTeacherNotes: studySummary?.hasTeacherNotes ?? false,
    mediaImageCount: studySummary?.mediaImageCount ?? base.imageFileCount,
    heroImageFound: imageStatus.heroImageFound,
    imageStorageStatus: imageStatus.imageStorageStatus,
    videoRequired,
    storesJsonSourceNote: isJsonSourceNote(pkg.lesson?.sourceNote),
    answerStatus:
      (manifest.verification?.answerStatus as string | undefined) ?? null,
    textStatus: (manifest.verification?.textStatus as string | undefined) ?? null,
    audioStatus: (manifest.verification?.audioStatus as string | undefined) ?? null,
  };
}

/** Parse a BUUNDUU Chinese HSK profile-aware lesson ZIP. */
export async function parseChineseHskLessonZip(file: File): Promise<LessonZipValidation> {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (typeof window === "undefined") {
    return {
      ok: false,
      manifest: null,
      lesson: null,
      importContext: null,
      vocabulary: [],
      quizQuestions: [],
      subtitles: [],
      mediaFiles: [],
      warnings,
      errors: ["ZIP parsing is only available in the browser."],
      preview: null,
      importPayload: null,
      contentValidation: null,
    };
  }

  try {
    const buffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(buffer);

    const manifestResult = await readJsonFile(zip, "manifest.json");
    if (manifestResult.error) errors.push(manifestResult.error);
    if (!manifestResult.data) {
      errors.push("manifest.json is required.");
    }

    if (!isChineseHskManifestRaw(manifestResult.data)) {
      errors.push("manifest.json is not a chinese-hsk package.");
      return {
        ok: false,
        manifest: null,
        lesson: null,
        importContext: null,
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

    const hskManifest = normalizeChineseHskManifest(manifestResult.data, warnings);
    if (!hskManifest) {
      errors.push("manifest.json: invalid or missing hskLevel / courseId.");
    }

    const studyContentResult = await readJsonFileFirst(zip, [
      "study-content.json",
      "study_content.json",
      "studyContent.json",
    ]);

    const mediaResult = await readJsonFileFirst(zip, [
      "media.json",
      "media/manifest.json",
    ]);

    const charactersResult = await readJsonFile(zip, "characters.json");

    let rawFiles: ChineseHskRawFiles = attachCharactersFileToLesson({
      manifest: manifestResult.data,
      lesson: (await readJsonFile(zip, "lesson.json")).data,
      texts: (await readJsonFile(zip, "texts.json")).data,
      vocabulary: (await readJsonFile(zip, "vocabulary.json")).data,
      grammar: (await readJsonFile(zip, "grammar.json")).data,
      notes: (await readJsonFile(zip, "notes.json")).data,
      workbook: (await readJsonFile(zip, "workbook.json")).data,
      quiz: (await readJsonFile(zip, "quiz.json")).data,
      characters: charactersResult.data,
      audioManifest: (await readJsonFile(zip, "audio-manifest.json")).data,
      subtitles: (await readJsonFile(zip, "subtitles.json")).data,
      studyContent: studyContentResult.data,
      media: mediaResult.data,
    });

    if (charactersResult.error) {
      warnings.push(charactersResult.error);
    }

    if (studyContentResult.path) {
      warnings.push(`Loaded study content from ${studyContentResult.path}.`);
    }

    if (mediaResult.path) {
      warnings.push(`Loaded media manifest from ${mediaResult.path}.`);
    }

    if (studyContentResult.error) {
      errors.push(studyContentResult.error);
    }

    if (!rawFiles.lesson) {
      errors.push("lesson.json is required.");
    }

    const importContext = hskManifest
      ? buildZipImportContext(
          hskManifest.courseId,
          hskManifest.language,
          hskManifest.targetLanguage,
          hskManifest.uiLanguage,
          hskManifest.hskLevel
        )
      : null;

    const lesson =
      rawFiles.lesson && importContext
        ? normalizeZipLesson(rawFiles.lesson, importContext, warnings)
        : null;

    const vocabulary =
      importContext && rawFiles.vocabulary
        ? parseVocabularyArray(rawFiles.vocabulary, importContext, errors, warnings)
        : [];

    const quizQuestions =
      importContext && rawFiles.quiz && Array.isArray(rawFiles.quiz)
        ? normalizeZipQuiz(rawFiles.quiz as Record<string, unknown>[], errors, warnings)
        : [];

    const subtitles = Array.isArray(rawFiles.subtitles)
      ? rawFiles.subtitles.filter(
          (row): row is Record<string, unknown> =>
            typeof row === "object" && row !== null
        )
      : [];

    const mediaFiles: LessonZipMediaFile[] = await extractZipMediaFiles(zip);
    const hasQaReport = zipHasFile(zip, "QA_REPORT.md") || zipHasFile(zip, "qa_report.md");

    const hskValidation = validateChineseHskPackage(rawFiles, hskManifest, {
      vocabularyRowCount: vocabulary.length,
      quizRowCount: quizQuestions.length,
      audioFileCount: mediaFiles.filter((file) => file.kind === "audio").length,
      imageFileCount: mediaFiles.filter((file) => file.kind === "image").length,
      hasQaReport,
    });

    for (const message of hskValidation.criticalErrors) {
      if (!errors.includes(message)) errors.push(message);
    }
    for (const message of hskValidation.warnings) {
      if (!warnings.includes(message)) warnings.push(message);
    }

    const manifest = hskManifest
      ? {
          packageVersion: hskManifest.packageVersion,
          courseId: hskManifest.courseId,
          lessonId: hskManifest.lessonId,
          language: hskManifest.language,
          targetLanguage: hskManifest.targetLanguage,
          uiLanguage: hskManifest.uiLanguage,
          title: hskManifest.title,
          mongolianTitle: hskManifest.mongolianTitle,
          source: hskManifest.source
            ? JSON.stringify(hskManifest.source)
            : undefined,
          lessonType: resolveHskImportLessonType(hskManifest, rawFiles.lesson),
        }
      : null;

    if (lesson && hskManifest && hskValidation.meta) {
      const importLessonType = resolveHskImportLessonType(
        hskManifest,
        rawFiles.lesson
      );
      if (
        hskManifest.lessonNumber != null &&
        lesson.orderIndex == null
      ) {
        lesson.orderIndex = hskManifest.lessonNumber;
      }
      const teachingFromMedia = buildTeachingImagesFromMedia(rawFiles.media);
      if (teachingFromMedia.length > 0) {
        lesson.teachingImages = [
          ...(lesson.teachingImages ?? []),
          ...teachingFromMedia,
        ];
      }

      const heroThumbnailFile = resolveHskHeroThumbnailFile(rawFiles.media);
      if (heroThumbnailFile && !lesson.thumbnailFile) {
        lesson.thumbnailFile = heroThumbnailFile;
      }

      const resolved = resolveChineseHskSourceNoteForValidation(
        {
          ok: errors.length === 0,
          manifest,
          lesson,
          importContext,
          vocabulary,
          quizQuestions,
          subtitles,
          mediaFiles,
          warnings,
          errors,
          preview: null,
          importPayload: null,
          contentValidation: null,
          hskProfile: hskManifest.lessonProfile,
          hskMeta: hskValidation.meta,
        },
        {
          lessonType: importLessonType,
          audioManifest: rawFiles.audioManifest,
        }
      );
      lesson.sourceNote = resolved.sourceNote;
      for (const message of resolved.warnings) {
        if (!warnings.includes(message)) warnings.push(message);
      }
      lesson.courseId = hskManifest.courseId;
      lesson.lessonType = importLessonType;
      lesson.status = "draft";
    } else if (lesson && hskManifest) {
      const resolved = resolveChineseHskSourceNoteForValidation(
        {
          ok: errors.length === 0,
          manifest,
          lesson,
          importContext,
          vocabulary,
          quizQuestions,
          subtitles,
          mediaFiles,
          warnings,
          errors,
          preview: null,
          importPayload: null,
          contentValidation: null,
          hskProfile: hskManifest.lessonProfile,
          hskMeta: hskValidation.meta,
        },
        { lessonType: lesson.lessonType ?? hskManifest.lessonProfile }
      );
      lesson.sourceNote = resolved.sourceNote;
      for (const message of resolved.warnings) {
        if (!warnings.includes(message)) warnings.push(message);
      }
      lesson.courseId = hskManifest.courseId;
      lesson.lessonType =
        lesson.lessonType ?? resolveHskImportLessonType(hskManifest, rawFiles.lesson);
      lesson.status = "draft";
    }

    const pkg: LessonZipPackage & { hskMeta?: typeof hskValidation.meta } = {
      ok: errors.length === 0,
      manifest,
      lesson,
      importContext,
      vocabulary,
      quizQuestions,
      subtitles,
      mediaFiles,
      warnings,
      errors,
      hskMeta: hskValidation.meta ?? undefined,
    };

    let importPayload = null;
    let contentValidation = null;

    if (errors.length === 0 && lesson && vocabulary.length > 0) {
      contentValidation = validateLessonImportPayload(
        mapZipPackageToBulkImport(pkg),
        {
          courseId: lesson.courseId,
          isKorean: false,
          targetLanguage: importContext?.targetLanguage ?? "zh",
          defaultHskLevel: hskManifest?.hskLevel,
        }
      );
      importPayload = contentValidation.payload;
      for (const message of contentValidation.errors) {
        if (!errors.includes(message)) errors.push(message);
      }
      for (const message of contentValidation.warnings) {
        if (!warnings.includes(message)) warnings.push(message);
      }
    }

    const preview = hskManifest
      ? buildHskImportPreview(pkg, hskManifest, hskValidation, rawFiles)
      : buildLessonImportPreview(pkg);

    const ok =
      errors.length === 0 &&
      Boolean(preview) &&
      Boolean(importPayload) &&
      Boolean(contentValidation?.valid);

    return {
      ...pkg,
      ok,
      preview,
      importPayload,
      contentValidation,
      info: hskValidation.info,
      hskProfile: hskManifest?.lessonProfile ?? null,
      hskMeta: hskValidation.meta ?? null,
    };
  } catch {
    return {
      ok: false,
      manifest: null,
      lesson: null,
      importContext: null,
      vocabulary: [],
      quizQuestions: [],
      subtitles: [],
      mediaFiles: [],
      warnings,
      errors: ["ZIP файл уншихад алдаа гарлаа."],
      preview: null,
      importPayload: null,
      contentValidation: null,
    };
  }
}

export async function peekChineseHskManifest(file: File): Promise<unknown | null> {
  if (typeof window === "undefined") return null;
  try {
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const result = await readJsonFile(zip, "manifest.json");
    return result.data;
  } catch {
    return null;
  }
}

export function shouldUseChineseHskImporter(manifestRaw: unknown): boolean {
  return isChineseHskManifestRaw(manifestRaw);
}
