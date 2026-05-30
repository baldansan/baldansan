import {
  buildLessonImportPreview,
  mapZipPackageToBulkImport,
  parseLessonZip,
  type LessonZipPackage,
  type LessonZipValidation,
} from "@/lib/import/lesson-zip-import";
import { buildZipImportContext } from "@/lib/import/lesson-zip-normalize";
import { validateLessonImportPayload } from "@/lib/supabase/admin-import";

function zipPathExists(paths: Set<string>, ref: string): boolean {
  const normalized = ref.toLowerCase();
  return [...paths].some(
    (path) => path.toLowerCase() === normalized || path.toLowerCase().endsWith(normalized)
  );
}

/** Validate with Chinese/HSK-specific rules — pinyin/HSK recommended, media optional. */
export function validateChineseLessonZipPackage(
  pkg: LessonZipPackage
): LessonZipValidation {
  const errors = [...pkg.errors].filter(
    (msg) =>
      !msg.includes("audioFile") &&
      !msg.includes("thumbnailFile") &&
      !msg.includes("icon missing")
  );
  const warnings = [
    ...pkg.warnings.filter(
      (msg) =>
        !msg.includes("icon missing") &&
        !msg.includes("skillTags missing") &&
        !msg.includes("difficulty missing")
    ),
  ];

  if (!pkg.manifest) errors.push("manifest.json is required.");
  if (!pkg.lesson) errors.push("lesson.json is required.");
  if (pkg.vocabulary.length === 0) {
    errors.push("vocabulary.json must contain at least one row.");
  }
  if (!pkg.quizQuestions?.length) {
    warnings.push("quiz.json is empty — lesson will import without quiz questions.");
  }

  const zipPaths = new Set(
    pkg.mediaFiles.map((file) => file.zipPath.replace(/\\/g, "/"))
  );

  if (pkg.lesson?.audioFile && !zipPathExists(zipPaths, pkg.lesson.audioFile)) {
    warnings.push(
      `lesson.json audioFile "${pkg.lesson.audioFile}" not in ZIP — optional; audio can be added later.`
    );
  }
  if (
    pkg.lesson?.thumbnailFile &&
    !zipPathExists(zipPaths, pkg.lesson.thumbnailFile)
  ) {
    warnings.push(
      `lesson.json thumbnailFile "${pkg.lesson.thumbnailFile}" not in ZIP — optional.`
    );
  }
  if (pkg.subtitles.length === 0) {
    warnings.push("subtitles.json missing — optional for some HSK packages.");
  }
  if (pkg.lesson?.status && pkg.lesson.status !== "draft") {
    warnings.push("Imported lessons are forced to draft status on import.");
  }

  const importContext = pkg.importContext ?? (pkg.manifest
    ? {
        ...buildZipImportContext(
          pkg.manifest.courseId,
          pkg.manifest.language,
          pkg.manifest.targetLanguage ?? "zh",
          pkg.manifest.uiLanguage
        ),
        isKorean: false as const,
      }
    : null);

  const pkgWithContext = { ...pkg, importContext, errors, warnings };

  let importPayload = null;
  let contentValidation = null;

  if (errors.length === 0 && pkg.lesson && pkg.vocabulary.length > 0) {
    contentValidation = validateLessonImportPayload(
      mapZipPackageToBulkImport(pkgWithContext),
      {
        courseId: pkg.lesson.courseId,
        isKorean: false,
        targetLanguage: importContext?.targetLanguage ?? "zh",
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

  const preview = buildLessonImportPreview(pkgWithContext);
  const ok =
    errors.length === 0 &&
    Boolean(preview) &&
    Boolean(importPayload) &&
    Boolean(contentValidation?.valid);

  return {
    ...pkgWithContext,
    ok,
    errors,
    warnings,
    preview,
    importPayload,
    contentValidation,
  };
}

/** Parse a Chinese/HSK lesson ZIP with Chinese-specific validation. */
export async function parseChineseLessonZip(file: File): Promise<LessonZipValidation> {
  const parsed = await parseLessonZip(file);
  return validateChineseLessonZipPackage(parsed);
}
