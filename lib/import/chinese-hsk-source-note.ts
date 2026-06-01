import type { ChineseHskManifest, ChineseHskPackageMeta, ChineseHskRawFiles } from "@/lib/import/chinese-hsk-normalize";
import {
  buildChineseHskSourceNoteJson,
  buildHskStudyContentBundle,
} from "@/lib/import/chinese-hsk-study-bundle";
import { isJsonSourceNote, mergeJsonSourceNoteFields } from "@/lib/lesson/source-note-json";

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
