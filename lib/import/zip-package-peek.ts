import JSZip from "jszip";
import { normalizeZipPath } from "@/lib/import/zip-path";
import type { PackageDetectionInput } from "@/lib/import/detect-lesson-package-type";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readJsonFromZip(
  zip: JSZip,
  path: string
): Promise<unknown | null> {
  const normalized = normalizeZipPath(path);
  const file =
    zip.file(normalized) ??
    zip.file(normalized.toLowerCase()) ??
    Object.entries(zip.files).find(
      ([name]) => normalizeZipPath(name).toLowerCase() === normalized.toLowerCase()
    )?.[1];

  if (!file || file.dir) return null;

  try {
    const text = await file.async("string");
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function sampleVocabularyRows(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) {
    return raw.filter(isRecord).slice(0, 8);
  }
  if (isRecord(raw)) return [raw];
  return [];
}

/** Read manifest/lesson/vocabulary sample from ZIP for track detection (no validation). */
export async function peekZipPackageDetection(
  file: File
): Promise<PackageDetectionInput> {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const manifestRaw = await readJsonFromZip(zip, "manifest.json");
    const lessonRaw = await readJsonFromZip(zip, "lesson.json");
    const vocabularyRaw = await readJsonFromZip(zip, "vocabulary.json");

    return {
      manifest: isRecord(manifestRaw) ? manifestRaw : null,
      lesson: isRecord(lessonRaw) ? lessonRaw : null,
      vocabularyRows: sampleVocabularyRows(vocabularyRaw),
    };
  } catch {
    return {};
  }
}
