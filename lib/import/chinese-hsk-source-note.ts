import type {
  ChineseHskManifest,
  ChineseHskPackageMeta,
  ChineseHskRawFiles,
} from "@/lib/import/chinese-hsk-normalize";
import {
  mergeHskProfileIntoSourceNote,
  normalizeChineseHskManifest,
} from "@/lib/import/chinese-hsk-normalize";
import type { LessonZipValidation } from "@/lib/import/lesson-zip-import";
import {
  buildChineseHskSourceNoteJson,
  buildHskStudyContentBundle,
} from "@/lib/import/chinese-hsk-study-bundle";
import {
  isJsonSourceNote,
  mergeJsonSourceNoteFields,
  parseLessonSourceNote,
} from "@/lib/lesson/source-note-json";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasHskStudyContent(sourceNote: string | undefined | null): boolean {
  if (!sourceNote?.trim() || !isJsonSourceNote(sourceNote)) return false;
  const parsed = parseLessonSourceNote(sourceNote);
  return parsed.format === "json" && isRecord(parsed.data.hskStudyContent);
}

function rawFilesFromValidation(
  validation: LessonZipValidation
): ChineseHskRawFiles | null {
  const hskMeta = validation.hskMeta;
  if (!hskMeta?.manifest) return null;

  return {
    manifest: validation.manifest,
    lesson: validation.lesson,
    texts: hskMeta.textsPayload,
    vocabulary: validation.vocabulary,
    grammar: hskMeta.grammarPayload,
    notes: hskMeta.notesPayload,
    workbook: hskMeta.workbookPayload,
    quiz: validation.quizQuestions,
    characters: null,
    audioManifest: null,
    subtitles: validation.subtitles,
    studyContent: hskMeta.studyContentPayload,
    media: null,
  };
}

function legacySourceNoteFallback(validation: LessonZipValidation): string {
  const fromLesson = validation.lesson?.sourceNote?.trim();
  if (fromLesson) return fromLesson;

  const manifestSource = validation.manifest?.source?.trim();
  if (manifestSource) return manifestSource;

  return `ZIP package import (${validation.manifest?.packageVersion ?? "1.0"})`;
}

export type ChineseHskSourceNoteResolution = {
  sourceNote: string;
  warnings: string[];
};

/**
 * Prefer JSON source_note with hskStudyContent built from ZIP sections (studyContent,
 * texts.json, workbook, etc.). Fall back to legacy plain-text source_note when needed.
 */
export function resolveChineseHskSourceNoteForValidation(
  validation: LessonZipValidation,
  options?: {
    lessonType?: string | null;
    audioManifest?: unknown;
  }
): ChineseHskSourceNoteResolution {
  const warnings: string[] = [];
  const legacyNote = legacySourceNoteFallback(validation);
  const existingNote = validation.lesson?.sourceNote?.trim() || legacyNote;

  if (hasHskStudyContent(existingNote)) {
    let sourceNote = existingNote;
    const lessonType = options?.lessonType?.trim();
    if (lessonType && isJsonSourceNote(sourceNote)) {
      sourceNote = mergeJsonSourceNoteFields(sourceNote, { lessonType });
    }
    return { sourceNote, warnings };
  }

  const hskMeta = validation.hskMeta;
  const manifest =
    hskMeta?.manifest ??
    normalizeChineseHskManifest(validation.manifest, warnings);

  if (manifest && hskMeta) {
    const rawFiles = rawFilesFromValidation(validation);
    if (rawFiles) {
      try {
        const built = mergeHskProfileIntoSourceNote(existingNote, manifest, hskMeta, {
          lessonJson: validation.lesson,
          audioManifest: options?.audioManifest,
          rawFiles,
          lessonType: options?.lessonType ?? manifest.lessonProfile,
        });
        if (isJsonSourceNote(built)) {
          return { sourceNote: built, warnings };
        }
      } catch {
        warnings.push(
          "hskStudyContent JSON bundle could not be built — using legacy source_note text."
        );
      }
    }
  }

  if (existingNote.startsWith("{") && isJsonSourceNote(existingNote)) {
    warnings.push(
      "source_note JSON is missing hskStudyContent — stored as-is; lesson UI may use package tables only."
    );
    return { sourceNote: existingNote, warnings };
  }

  if (legacyNote) {
    warnings.push(
      "Using legacy text source_note (no hskStudyContent JSON). Vocabulary/quiz still import from ZIP tables."
    );
    return { sourceNote: legacyNote, warnings };
  }

  return { sourceNote: legacySourceNoteFallback(validation), warnings };
}

/** Build full JSON lessons.source_note for a Chinese HSK ZIP package. */
export function buildChineseHskImportSourceNote(
  manifest: ChineseHskManifest,
  meta: ChineseHskPackageMeta,
  rawFiles: ChineseHskRawFiles,
  existingNote?: string | null,
  options?: {
    audioManifest?: unknown;
    lessonType?: string | null;
  }
): string {
  const bundle = buildHskStudyContentBundle(rawFiles, manifest, meta);
  let note = buildChineseHskSourceNoteJson(manifest, bundle, existingNote);

  if (options?.audioManifest) {
    try {
      const parsed = JSON.parse(note) as Record<string, unknown>;
      parsed.hskAudioManifest = options.audioManifest;
      note = JSON.stringify(parsed);
    } catch {
      // keep note as-is
    }
  }

  const lessonType = options?.lessonType?.trim();
  if (lessonType && isJsonSourceNote(note)) {
    note = mergeJsonSourceNoteFields(note, { lessonType });
  }

  return note;
}

export function resolveChineseHskImportSourceNote(
  validationSourceNote: string | undefined | null,
  manifest: ChineseHskManifest,
  meta: ChineseHskPackageMeta,
  rawFiles: ChineseHskRawFiles,
  options?: {
    audioManifest?: unknown;
    lessonType?: string | null;
  }
): string {
  const rebuilt = buildChineseHskImportSourceNote(
    manifest,
    meta,
    rawFiles,
    validationSourceNote,
    options
  );

  if (isJsonSourceNote(rebuilt)) {
    return rebuilt;
  }

  return rebuilt;
}
