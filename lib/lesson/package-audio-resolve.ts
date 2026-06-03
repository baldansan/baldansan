import { normalizeZipPath } from "@/lib/import/zip-path";
import { parseLessonSourceNote } from "@/lib/lesson/source-note-json";
import { LESSON_MEDIA_BUCKET } from "@/lib/supabase/media-upload";
import type {
  HskLessonPackage,
  HskPackageDialogue,
  HskPackageShortText,
} from "@/types/hsk-lesson-package";
import type { LessonContent } from "@/types/lesson-content";

function trim(value: unknown): string {
  return String(value ?? "").trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Supabase public URL prefix for ZIP-imported lesson audio ({course}/{lesson}/audio/). */
export function buildLessonPackageAudioPublicBase(
  courseId: string,
  lessonId: string
): string | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, "");
  if (!supabaseUrl) return null;
  const course = trim(courseId);
  const lesson = trim(lessonId);
  if (!course || !lesson) return null;
  return `${supabaseUrl}/storage/v1/object/public/${LESSON_MEDIA_BUCKET}/${course}/${lesson}/audio`;
}

export type PackageAudioUploadMap = Record<string, string>;

export function buildPackageAudioUploadMapFromMediaUploads(
  uploads: Array<{
    zipPath: string;
    kind: string;
    publicUrl: string | null;
    error: string | null;
  }>
): PackageAudioUploadMap {
  const map: PackageAudioUploadMap = {};
  for (const item of uploads) {
    if (item.kind !== "audio" || item.error || !item.publicUrl) continue;
    const zip = normalizeZipPath(item.zipPath);
    const lower = zip.toLowerCase();
    map[lower] = item.publicUrl;
    if (!zip.startsWith("audio/")) {
      map[`audio/${lower}`] = item.publicUrl;
    }
    const base = zip.split("/").pop();
    if (base) map[base.toLowerCase()] = item.publicUrl;
  }
  return map;
}

export function parsePackageAudioUploadMapFromSourceNote(
  sourceNote?: string | null
): PackageAudioUploadMap {
  const parsed = parseLessonSourceNote(sourceNote);
  if (parsed.format !== "json") return {};
  const raw = parsed.data.packageAudioUrls;
  if (!isRecord(raw)) return {};
  const map: PackageAudioUploadMap = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string" && value.trim()) {
      map[key.toLowerCase()] = value.trim();
    }
  }
  return map;
}

function audioPathCandidates(path: string): string[] {
  const normalized = normalizeZipPath(path);
  const out = new Set<string>();
  out.add(normalized.toLowerCase());
  if (!normalized.toLowerCase().startsWith("audio/")) {
    out.add(`audio/${normalized}`.toLowerCase());
  }
  const stripped = normalized.replace(/^audio\//i, "");
  if (stripped) out.add(stripped.toLowerCase());
  const base = normalized.split("/").pop();
  if (base) out.add(base.toLowerCase());
  return [...out];
}

function lookupUploadMap(map: PackageAudioUploadMap, path: string): string | undefined {
  for (const key of audioPathCandidates(path)) {
    const hit = map[key];
    if (hit) return hit;
  }
  return undefined;
}

/** Join package base + relative path without duplicating `audio/` segments. */
export function joinPackageRelativeAudioPath(
  packageBase: string | undefined,
  filePath: string
): string {
  const b = (packageBase ?? "").replace(/\/+$/, "");
  let p = normalizeZipPath(filePath);
  if (!b) return p.startsWith("/") ? p : `/${p}`;

  const bLower = b.toLowerCase();
  const pLower = p.toLowerCase();
  if (pLower === bLower) return b;
  if (pLower.startsWith(`${bLower}/`)) return p;

  if (bLower.endsWith("/audio") || bLower === "audio") {
    if (pLower.startsWith("audio/")) p = p.slice("audio/".length);
  }

  return `${b}/${p}`;
}

/**
 * Resolve a package audio path to a browser-fetchable URL.
 * ZIP imports store files at `{course}/{lesson}/audio/{fileName}` in Supabase.
 */
export function resolvePackageAudioFileUrl(input: {
  filePath?: string | null;
  publicStorageBase?: string | null;
  packageAudioBase?: string | null;
  uploadMap?: PackageAudioUploadMap;
}): string | null {
  const path = trim(input.filePath);
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;

  const fromMap = lookupUploadMap(input.uploadMap ?? {}, path);
  if (fromMap) return fromMap;

  if (input.publicStorageBase) {
    const fileName = normalizeZipPath(path).split("/").pop() ?? normalizeZipPath(path);
    return `${input.publicStorageBase.replace(/\/+$/, "")}/${fileName}`;
  }

  return joinPackageRelativeAudioPath(input.packageAudioBase, path);
}

function patchAudioFieldOnRecord(
  record: Record<string, unknown>,
  keys: string[],
  resolve: (path: string) => string | undefined
): void {
  for (const key of keys) {
    const raw = trim(record[key]);
    if (!raw || /^https?:\/\//i.test(raw)) continue;
    const url = resolve(raw);
    if (url) record[key] = url;
  }
}

function patchDialoguesAndTextsAudio(
  container: Record<string, unknown>,
  resolve: (path: string) => string | undefined
): void {
  const dialogues = container.dialogues;
  if (Array.isArray(dialogues)) {
    container.dialogues = dialogues.map((row) => {
      if (!isRecord(row)) return row;
      const copy = { ...row };
      patchAudioFieldOnRecord(copy, ["audio", "audioFile"], resolve);
      return copy;
    });
  }

  const texts = container.texts;
  if (Array.isArray(texts)) {
    container.texts = texts.map((row) => {
      if (!isRecord(row)) return row;
      const copy = { ...row };
      patchAudioFieldOnRecord(copy, ["audio", "audioFile"], resolve);
      return copy;
    });
  }
}

/** Persist absolute audio URLs into source_note JSON after ZIP media upload. */
export function patchSourceNotePackageAudioUrls(
  sourceNote: string,
  uploads: Array<{
    zipPath: string;
    kind: string;
    publicUrl: string | null;
    error: string | null;
  }>
): string {
  const parsed = parseLessonSourceNote(sourceNote);
  if (parsed.format !== "json") return sourceNote;

  const map = buildPackageAudioUploadMapFromMediaUploads(uploads);
  if (!Object.keys(map).length) return sourceNote;

  const data = { ...parsed.data };
  data.packageAudioUrls = map;

  const resolve = (path: string) => lookupUploadMap(map, path);

  const hskStudy = data.hskStudyContent;
  if (isRecord(hskStudy)) {
    const teaching = hskStudy.lessonTeaching;
    if (isRecord(teaching)) {
      patchDialoguesAndTextsAudio(teaching, resolve);
      hskStudy.lessonTeaching = teaching;
    }
    data.hskStudyContent = hskStudy;
  }

  if (isRecord(data.hskLessonPackage)) {
    patchDialoguesAndTextsAudio(data.hskLessonPackage, resolve);
  }

  return JSON.stringify(data);
}

function resolveDialogueAudio(
  dialogue: HskPackageDialogue,
  ctx: {
    publicStorageBase: string | null;
    packageAudioBase?: string;
    uploadMap: PackageAudioUploadMap;
  }
): HskPackageDialogue {
  const record = dialogue as HskPackageDialogue & { audioFile?: string };
  const raw = record.audio ?? record.audioFile;
  const audio = resolvePackageAudioFileUrl({
    filePath: raw,
    publicStorageBase: ctx.publicStorageBase,
    packageAudioBase: ctx.packageAudioBase,
    uploadMap: ctx.uploadMap,
  });
  if (!audio || audio === raw) return dialogue;
  return { ...dialogue, audio };
}

function resolveTextAudio(
  text: HskPackageShortText,
  ctx: {
    publicStorageBase: string | null;
    packageAudioBase?: string;
    uploadMap: PackageAudioUploadMap;
  }
): HskPackageShortText {
  const record = text as HskPackageShortText & { audioFile?: string };
  const raw = record.audio ?? record.audioFile;
  const audio = resolvePackageAudioFileUrl({
    filePath: raw,
    publicStorageBase: ctx.publicStorageBase,
    packageAudioBase: ctx.packageAudioBase,
    uploadMap: ctx.uploadMap,
  });
  if (!audio || audio === raw) return text;
  return { ...text, audio };
}

function resolveStorageLessonIdForAudio(
  lesson: Pick<LessonContent, "id" | "sourceNote">
): string {
  const parsed = parseLessonSourceNote(lesson.sourceNote);
  if (parsed.format === "json") {
    const packageLessonId = trim(parsed.data.packageLessonId);
    if (packageLessonId) return packageLessonId;
  }
  return lesson.id;
}

/** Rewrite dialogue/text audio paths to public URLs for LessonPlayer modules. */
export function applyLessonPackageAudioUrls(
  pkg: HskLessonPackage,
  lesson: Pick<LessonContent, "courseId" | "id" | "sourceNote">
): HskLessonPackage {
  const uploadMap = parsePackageAudioUploadMapFromSourceNote(lesson.sourceNote);
  const publicStorageBase = buildLessonPackageAudioPublicBase(
    lesson.courseId,
    resolveStorageLessonIdForAudio(lesson)
  );

  const ctx = {
    publicStorageBase,
    packageAudioBase: pkg.audio_base_path,
    uploadMap,
  };

  const dialogues = pkg.dialogues?.map((d) => resolveDialogueAudio(d, ctx));
  const texts = pkg.texts?.map((t) => resolveTextAudio(t, ctx));

  const hasAbsolute =
    dialogues?.some((d) => d.audio?.startsWith("http")) ||
    texts?.some((t) => t.audio?.startsWith("http"));

  return {
    ...pkg,
    dialogues,
    texts,
    audio_base_path: hasAbsolute ? undefined : pkg.audio_base_path,
  };
}
