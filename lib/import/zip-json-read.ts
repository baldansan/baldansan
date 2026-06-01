import JSZip from "jszip";
import { normalizeZipPath } from "@/lib/import/zip-path";

function basename(path: string): string {
  const normalized = normalizeZipPath(path);
  const parts = normalized.split("/");
  return parts[parts.length - 1] ?? normalized;
}

/** Find a ZIP entry by file name (any folder depth). */
export function findZipEntryByBasename(
  zip: JSZip,
  fileName: string
): JSZip.JSZipObject | null {
  const target = fileName.toLowerCase();
  for (const [path, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    if (basename(path).toLowerCase() === target) {
      return entry;
    }
  }
  return null;
}

export async function readJsonFromZip(
  zip: JSZip,
  path: string
): Promise<{ data: unknown | null; error: string | null; path?: string }> {
  const normalized = normalizeZipPath(path);
  const file =
    zip.file(normalized) ??
    zip.file(normalized.toLowerCase()) ??
    findZipEntryByBasename(zip, basename(normalized));

  if (!file || file.dir) {
    return { data: null, error: null };
  }

  try {
    const text = await file.async("string");
    return {
      data: JSON.parse(text) as unknown,
      error: null,
      path: normalizeZipPath(file.name),
    };
  } catch {
    return { data: null, error: `${path} is not valid JSON.` };
  }
}

export async function readJsonFromZipFirst(
  zip: JSZip,
  paths: string[]
): Promise<{ data: unknown | null; error: string | null; path?: string }> {
  for (const path of paths) {
    const result = await readJsonFromZip(zip, path);
    if (result.data) {
      return result;
    }
    if (result.error) {
      return result;
    }
  }
  return { data: null, error: null };
}
