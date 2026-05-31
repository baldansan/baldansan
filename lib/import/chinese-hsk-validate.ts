import {
  getHskProfile,
  isKnownHskProfile,
  QUIZ_SECTION_ALIASES,
  VOCABULARY_SECTION_ALIASES,
  type HskLessonProfileId,
} from "@/lib/import/chinese-hsk-profiles";
import {
  buildChineseHskPackageMeta,
  sectionIsPresent,
  type ChineseHskManifest,
  type ChineseHskPackageMeta,
  type ChineseHskRawFiles,
} from "@/lib/import/chinese-hsk-normalize";

export type ChineseHskValidationResult = {
  criticalErrors: string[];
  warnings: string[];
  info: string[];
  profileId: HskLessonProfileId | null;
  meta: ChineseHskPackageMeta | null;
};

function hasVocabularyFile(vocabularyRaw: unknown): boolean {
  if (Array.isArray(vocabularyRaw)) return vocabularyRaw.length > 0;
  if (typeof vocabularyRaw === "object" && vocabularyRaw !== null) {
    return Object.keys(vocabularyRaw as Record<string, unknown>).length > 0;
  }
  return false;
}

function hasQuizFile(quizRaw: unknown, sections: ChineseHskPackageMeta["sections"]): boolean {
  if (Array.isArray(quizRaw) && quizRaw.length > 0) return true;
  return QUIZ_SECTION_ALIASES.some((key) => sectionIsPresent(sections, key));
}

export function validateChineseHskPackage(
  raw: ChineseHskRawFiles,
  manifest: ChineseHskManifest | null,
  options?: {
    vocabularyRowCount: number;
    quizRowCount: number;
    audioFileCount: number;
    imageFileCount: number;
    hasQaReport: boolean;
  }
): ChineseHskValidationResult {
  const criticalErrors: string[] = [];
  const warnings: string[] = [];
  const info: string[] = [];

  if (!manifest) {
    criticalErrors.push("manifest.json cannot be parsed or missing required HSK fields.");
    return {
      criticalErrors,
      warnings,
      info,
      profileId: null,
      meta: null,
    };
  }

  if (!isKnownHskProfile(manifest.lessonProfile)) {
    criticalErrors.push(`Unknown lessonProfile: ${manifest.lessonProfile}`);
  }

  const profile = getHskProfile(manifest.lessonProfile);
  const meta = buildChineseHskPackageMeta(raw, manifest);

  info.push(`Detected HSK level: HSK${manifest.hskLevel}`);
  info.push(`Detected profile: ${profile.badgeLabel} (${manifest.lessonProfile})`);
  info.push(`Vocabulary rows: ${options?.vocabularyRowCount ?? 0}`);
  info.push(`Quiz rows: ${options?.quizRowCount ?? 0}`);
  info.push(`Text count: ${meta.textCount}`);
  info.push(`Workbook listening: ${meta.workbookListeningCount}`);
  info.push(`Workbook reading: ${meta.workbookReadingCount}`);
  info.push(`Workbook writing: ${meta.workbookWritingCount}`);
  info.push(`Audio files: ${options?.audioFileCount ?? 0}`);
  info.push(`Image files: ${options?.imageFileCount ?? 0}`);

  if (manifest.source) {
    info.push(`Source inventory: ${Object.keys(manifest.source).join(", ")}`);
  }

  if (!raw.lesson) {
    criticalErrors.push("lesson.json is required.");
  }

  if (!hasVocabularyFile(raw.vocabulary) && options?.vocabularyRowCount === 0) {
    criticalErrors.push("vocabulary.json is missing or empty.");
  }

  const quizPresent = hasQuizFile(raw.quiz, meta.sections) || (options?.quizRowCount ?? 0) > 0;
  if (profile.requiresQuiz && !quizPresent) {
    criticalErrors.push(
      `quiz.json (or ${QUIZ_SECTION_ALIASES.join("/")} section) is required for ${profile.badgeLabel}.`
    );
  } else if (!quizPresent) {
    warnings.push("quiz.json missing — lesson will import without quiz questions.");
  }

  for (const sectionKey of profile.requiredSections) {
    if (VOCABULARY_SECTION_ALIASES.includes(sectionKey as (typeof VOCABULARY_SECTION_ALIASES)[number])) {
      if (
        !sectionIsPresent(meta.sections, sectionKey) &&
        (options?.vocabularyRowCount ?? 0) === 0
      ) {
        criticalErrors.push(`Required section missing: ${sectionKey}`);
      }
      continue;
    }

    if (QUIZ_SECTION_ALIASES.includes(sectionKey as (typeof QUIZ_SECTION_ALIASES)[number])) {
      if (!quizPresent) {
        criticalErrors.push(`Required section missing: ${sectionKey}`);
      }
      continue;
    }

    if (!sectionIsPresent(meta.sections, sectionKey)) {
      criticalErrors.push(`Required section missing: ${sectionKey}`);
    }
  }

  for (const sectionKey of profile.optionalSections) {
    if (!sectionIsPresent(meta.sections, sectionKey)) {
      warnings.push(`Optional section missing: ${sectionKey}`);
    }
  }

  if (profile.recommendedTextCount != null && meta.textCount !== profile.recommendedTextCount) {
    warnings.push(
      `Text count is ${meta.textCount}; recommended ${profile.recommendedTextCount} for ${profile.badgeShort}.`
    );
  }

  if (manifest.verification?.answerStatus !== "official_verified") {
    warnings.push("answerStatus is not official_verified.");
  }

  if (!options?.hasQaReport) {
    warnings.push("QA_REPORT.md missing — optional but recommended.");
  }

  if ((options?.audioFileCount ?? 0) === 0) {
    warnings.push("No audio files in ZIP — import allowed.");
  }

  if ((options?.imageFileCount ?? 0) === 0) {
    warnings.push("No images in ZIP — import allowed.");
  }

  if (meta.workbookExerciseCount === 0) {
    warnings.push("Workbook sections appear incomplete or empty.");
  }

  return {
    criticalErrors,
    warnings,
    info,
    profileId: manifest.lessonProfile,
    meta,
  };
}
