import { normalizeZipPath } from "@/lib/import/zip-path";
import { applyWorkbookListeningPlayableAudio } from "@/lib/lesson/workbook-exercises";
import { resolveWorkbookListeningItemAudio } from "@/lib/lesson/workbook-listening-audio";
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

  return joinPackageRelativeAudioPath(input.packageAudioBase ?? undefined, path);
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

function patchWorkbookListeningAudio(
  exercises: Record<string, unknown>,
  resolve: (path: string) => string | undefined
): void {
  const listening = exercises.listening;
  if (!isRecord(listening)) return;
  const parts = listening.parts;
  if (!Array.isArray(parts)) return;

  listening.parts = parts.map((part) => {
    if (!isRecord(part)) return part;
    const partCopy = { ...part };
    const items = partCopy.items;
    if (Array.isArray(items)) {
      partCopy.items = items.map((row) => {
        if (!isRecord(row)) return row;
        const copy = { ...row };
        const raw =
          resolveWorkbookListeningItemAudio(partCopy, copy) ??
          pickPackageAudioPath(copy);
        if (!raw || /^https?:\/\//i.test(raw)) return copy;
        const url = resolve(raw);
        if (url) copy.audio = url;
        return copy;
      });
    }
    return partCopy;
  });
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

  const workbook = container.exercises_workbook;
  if (isRecord(workbook)) {
    patchWorkbookListeningAudio(workbook, resolve);
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
    const workbook = hskStudy.workbook;
    if (isRecord(workbook)) {
      patchWorkbookListeningAudio(workbook, resolve);
      hskStudy.workbook = workbook;
    }
    data.hskStudyContent = hskStudy;
  }

  if (isRecord(data.hskLessonPackage)) {
    patchDialoguesAndTextsAudio(data.hskLessonPackage, resolve);
  }

  return JSON.stringify(data);
}

/** Import ZIP / lesson.json may use `audio`, `audioFile`, or `audio_file`. */
export function pickPackageAudioPath(record: Record<string, unknown>): string | undefined {
  const audio = trim(record.audio);
  if (audio) return audio;
  const audioFile = trim(record.audioFile) || trim(record.audio_file);
  return audioFile || undefined;
}

/** Resolve to a single browser-fetchable URL (no audio/audio/ double prefix). */
export function resolveLessonPackagePlayableUrl(
  itemPath: string | null | undefined,
  ctx: {
    publicStorageBase?: string | null;
    packageAudioBase?: string | null;
    uploadMap?: PackageAudioUploadMap;
  }
): string | null {
  const path = trim(itemPath);
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;

  const uploadMap = ctx.uploadMap ?? {};
  const fromMap = lookupUploadMap(uploadMap, path);
  if (fromMap) return fromMap;

  const publicBase = trim(ctx.publicStorageBase);
  if (publicBase && /^https?:\/\//i.test(publicBase)) {
    const fileName = normalizeZipPath(path).split("/").pop() ?? normalizeZipPath(path);
    return `${publicBase.replace(/\/+$/, "")}/${fileName}`;
  }

  const legacyBase = trim(ctx.packageAudioBase);
  if (legacyBase && /^https?:\/\//i.test(legacyBase)) {
    const fileName = normalizeZipPath(path).split("/").pop() ?? normalizeZipPath(path);
    return `${legacyBase.replace(/\/+$/, "")}/${fileName}`;
  }

  return resolvePackageAudioFileUrl({
    filePath: path,
    publicStorageBase: publicBase || null,
    packageAudioBase: legacyBase || undefined,
    uploadMap,
  });
}

function resolveItemAudioForPlayer(
  raw: string,
  ctx: {
    publicStorageBase: string | null;
    packageAudioBase?: string;
    uploadMap: PackageAudioUploadMap;
  }
): string {
  return (
    resolveLessonPackagePlayableUrl(raw, ctx) ?? raw
  );
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
  const raw = pickPackageAudioPath(record as unknown as Record<string, unknown>);
  if (!raw) return dialogue;
  return { ...dialogue, audio: resolveItemAudioForPlayer(raw, ctx) };
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
  const raw = pickPackageAudioPath(record as unknown as Record<string, unknown>);
  if (!raw) return text;
  return { ...text, audio: resolveItemAudioForPlayer(raw, ctx) };
}

export function resolveStorageLessonIdForAudio(
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
    packageAudioBase: publicStorageBase ? undefined : pkg.audio_base_path,
    uploadMap,
  };

  const dialogues = pkg.dialogues?.map((d) => resolveDialogueAudio(d, ctx));
  const texts = pkg.texts?.map((t) => resolveTextAudio(t, ctx));

  let exercises_workbook = pkg.exercises_workbook;
  if (isRecord(exercises_workbook)) {
    exercises_workbook = applyWorkbookListeningPlayableAudio(
      exercises_workbook as Record<string, unknown>,
      {
        publicStorageBase: ctx.publicStorageBase,
        packageAudioBase: ctx.packageAudioBase,
        uploadMap: ctx.uploadMap,
      }
    );
  }

  return {
    ...pkg,
    dialogues,
    texts,
    exercises_workbook,
    audio_base_path: publicStorageBase ?? undefined,
  };
}
