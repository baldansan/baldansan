import {
  resolveLessonPackagePlayableUrl,
  type PackageAudioUploadMap,
} from "@/lib/lesson/package-audio-resolve";
import { resolveWorkbookListeningItemAudio } from "@/lib/lesson/workbook-listening-audio";

function trim(value: unknown): string {
  return String(value ?? "").trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function listeningItemCount(exercises: Record<string, unknown>): number {
  const listening = exercises.listening;
  if (!isRecord(listening)) return 0;
  const parts = listening.parts;
  if (!Array.isArray(parts)) return 0;
  let count = 0;
  for (const part of parts) {
    if (!isRecord(part)) continue;
    const items = part.items;
    if (Array.isArray(items)) count += items.length;
  }
  return count;
}

function sectionHasItems(value: unknown): boolean {
  if (!value) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (!isRecord(value)) return false;
  for (const nested of Object.values(value)) {
    if (Array.isArray(nested) && nested.length > 0) return true;
    if (isRecord(nested) && sectionHasItems(nested)) return true;
  }
  return Object.keys(value).length > 0;
}

/** True when workbook exercises include learner-facing sections (listening q01+, reading, writing). */
export function workbookExercisesHasContent(exercises: unknown): boolean {
  if (!isRecord(exercises)) return false;
  if (listeningItemCount(exercises) > 0) return true;
  if (sectionHasItems(exercises.reading)) return true;
  if (sectionHasItems(exercises.writing)) return true;
  const metaKeys = new Set(["source", "audio_available"]);
  return Object.keys(exercises).some(
    (key) => !metaKeys.has(key) && sectionHasItems(exercises[key])
  );
}

/** ZIP `workbook.json` or nested `exercises_workbook` object. */
function hasWorkbookListening(value: unknown): boolean {
  return Array.isArray(value) || isRecord(value);
}

export function workbookFileToExercisesShape(
  workbookFile: unknown
): Record<string, unknown> | null {
  if (!isRecord(workbookFile)) return null;
  if (
    hasWorkbookListening(workbookFile.listening) ||
    isRecord(workbookFile.reading) ||
    isRecord(workbookFile.writing) ||
    hasWorkbookListening(workbookFile.workbookListening) ||
    isRecord(workbookFile.workbookReading) ||
    isRecord(workbookFile.workbookWriting)
  ) {
    return workbookFile;
  }
  if (isRecord(workbookFile.exercises_workbook)) {
    return workbookFile.exercises_workbook as Record<string, unknown>;
  }
  return null;
}

function extractListeningPayload(source: Record<string, unknown>): unknown {
  if (hasWorkbookListening(source.listening)) return source.listening;
  if (hasWorkbookListening(source.workbookListening)) return source.workbookListening;
  return undefined;
}

function normalizeListeningItem(raw: unknown): Record<string, unknown> | null {
  if (!isRecord(raw)) return null;
  const n = Number(raw.n);
  const audio = trim(raw.audio) || trim(raw.audioFile) || trim(raw.audio_file) || undefined;
  const statement_zh =
    trim(raw.statement_zh) || trim(raw.statement) || trim(raw.zh) || undefined;
  const options = raw.options;
  const answer = raw.answer;

  if (options != null && typeof options === "object") {
    const out: Record<string, unknown> = {
      n: Number.isFinite(n) ? n : undefined,
      options,
      answer,
    };
    if (audio) out.audio = audio;
    if (statement_zh) out.statement_zh = statement_zh;
    return out;
  }

  if (statement_zh != null) {
    const out: Record<string, unknown> = {
      n: Number.isFinite(n) ? n : undefined,
      statement_zh,
      answer,
    };
    if (audio) out.audio = audio;
    return out;
  }

  if (audio && Number.isFinite(n)) {
    return { n, audio, answer };
  }

  return null;
}

function normalizeListeningPart(raw: unknown): Record<string, unknown> | null {
  if (!isRecord(raw)) return null;
  const itemsRaw = raw.items;
  if (!Array.isArray(itemsRaw) || itemsRaw.length === 0) return null;

  const items = itemsRaw
    .map((row) => normalizeListeningItem(row))
    .filter((row): row is Record<string, unknown> => row !== null);

  if (items.length === 0) return null;

  const part: Record<string, unknown> = {
    instruction_mn:
      trim(raw.instruction_mn) ||
      trim(raw.instruction) ||
      trim(raw.title_mn) ||
      "Сонсгол",
    items,
  };

  const shared = raw.shared_audio;
  if (typeof shared === "string" && shared.trim()) {
    part.shared_audio = shared.trim();
  } else if (Array.isArray(shared) && shared.length > 0) {
    part.shared_audio = shared;
  }

  return part;
}

/**
 * Normalize import listening → LessonPlayer shape:
 * `{ parts: [{ instruction_mn, shared_audio?, items: [...] }] }`.
 * Import may store `listening` as a parts array (no `{ parts }` wrapper).
 */
export function normalizeWorkbookListening(raw: unknown): Record<string, unknown> | null {
  let partsRaw: unknown;
  let audio_available: unknown;

  if (Array.isArray(raw)) {
    partsRaw = raw;
  } else if (isRecord(raw)) {
    partsRaw = raw.parts ?? raw.sections;
    audio_available = raw.audio_available;
  } else {
    return null;
  }

  if (!Array.isArray(partsRaw)) return null;

  const parts = partsRaw
    .map((row) => normalizeListeningPart(row))
    .filter((row): row is Record<string, unknown> => row !== null);

  if (parts.length === 0) return null;

  const out: Record<string, unknown> = { parts };
  if (audio_available != null) out.audio_available = audio_available;
  return out;
}

function pickBestListening(
  sources: Array<Record<string, unknown>>
): Record<string, unknown> | undefined {
  let best: Record<string, unknown> | undefined;
  let bestCount = 0;

  for (const source of sources) {
    const raw = extractListeningPayload(source);
    const normalized = normalizeWorkbookListening(raw);
    if (!normalized) continue;
    const count = listeningItemCount({ listening: normalized });
    if (count > bestCount) {
      best = normalized;
      bestCount = count;
    }
  }

  return best;
}

/** Player-ready workbook exercises (listening + reading + writing). */
export function normalizeExercisesWorkbookForPlayer(
  raw: Record<string, unknown>
): Record<string, unknown> {
  const listening = pickBestListening([raw]) ?? normalizeWorkbookListening(raw.listening);

  const out: Record<string, unknown> = { ...raw };
  if (listening) out.listening = listening;

  if (isRecord(raw.workbookReading) && !out.reading) out.reading = raw.workbookReading;
  if (isRecord(raw.workbookWriting) && !out.writing) out.writing = raw.workbookWriting;

  delete out.workbookListening;
  delete out.workbookReading;
  delete out.workbookWriting;

  return out;
}

function teachingExercisesWorkbook(
  teaching: Record<string, unknown> | null
): Record<string, unknown> {
  if (!teaching) return {};
  if (isRecord(teaching.exercises_workbook)) {
    return teaching.exercises_workbook as Record<string, unknown>;
  }
  if (
    hasWorkbookListening(teaching.listening) ||
    isRecord(teaching.reading) ||
    isRecord(teaching.writing)
  ) {
    return teaching;
  }
  return {};
}

/**
 * Merge lesson.json `exercises_workbook` with ZIP `workbook.json` (top-level listening/reading).
 * Import often stores listening only in workbook.json while lessonTeaching omits it.
 */
export function resolveExercisesWorkbook(
  teaching: Record<string, unknown> | null,
  workbookFile: unknown,
  existing?: unknown
): Record<string, unknown> | undefined {
  const teachingEb = teachingExercisesWorkbook(teaching);
  const existingEb = isRecord(existing) ? existing : {};
  const fileEb = workbookFileToExercisesShape(workbookFile) ?? {};

  const listeningSources = [fileEb, existingEb, teachingEb];
  if (isRecord(teaching)) listeningSources.push(teaching);

  const bestListening = pickBestListening(listeningSources);

  const merged: Record<string, unknown> = {
    ...fileEb,
    ...existingEb,
    ...teachingEb,
  };

  if (bestListening) merged.listening = bestListening;
  else if (!isRecord(merged.listening)) delete merged.listening;

  if (!merged.reading && fileEb.reading) merged.reading = fileEb.reading;
  if (!merged.writing && fileEb.writing) merged.writing = fileEb.writing;
  if (!merged.reading && isRecord(fileEb.workbookReading)) {
    merged.reading = fileEb.workbookReading;
  }
  if (!merged.writing && isRecord(fileEb.workbookWriting)) {
    merged.writing = fileEb.workbookWriting;
  }

  const normalized = normalizeExercisesWorkbookForPlayer(merged);
  return workbookExercisesHasContent(normalized) ? normalized : undefined;
}

/** Rewrite workbook listening item audio paths to playable URLs (post-resolve). */
export function applyWorkbookListeningPlayableAudio(
  exercises_workbook: Record<string, unknown>,
  ctx: {
    packageAudioBase?: string | null;
    publicStorageBase?: string | null;
    uploadMap?: PackageAudioUploadMap;
  }
): Record<string, unknown> {
  const listening = exercises_workbook.listening;
  if (!isRecord(listening) || !Array.isArray(listening.parts)) {
    return exercises_workbook;
  }

  const resolvePath = (path: string): string | undefined => {
    const url = resolveLessonPackagePlayableUrl(path, ctx);
    return url ?? undefined;
  };

  const parts = listening.parts.map((part) => {
    if (!isRecord(part)) return part;
    const partCopy = { ...part };

    const shared = partCopy.shared_audio;
    if (Array.isArray(shared)) {
      partCopy.shared_audio = shared.map((entry) => {
        if (!isRecord(entry)) return entry;
        const copy = { ...entry };
        const raw = trim(copy.audio);
        if (raw && !/^https?:\/\//i.test(raw)) {
          const url = resolvePath(raw);
          if (url) copy.audio = url;
        }
        return copy;
      });
    } else if (typeof shared === "string" && shared.trim() && !/^https?:\/\//i.test(shared)) {
      const url = resolvePath(shared.trim());
      if (url) partCopy.shared_audio = url;
    }

    const items = partCopy.items;
    if (Array.isArray(items)) {
      partCopy.items = items.map((row) => {
        if (!isRecord(row)) return row;
        const copy = { ...row };
        const raw =
          resolveWorkbookListeningItemAudio(partCopy, copy) ??
          (trim(copy.audio) || trim(copy.audioFile));
        if (raw && !/^https?:\/\//i.test(raw)) {
          const url = resolvePath(raw);
          if (url) copy.audio = url;
        }
        return copy;
      });
    }

    return partCopy;
  });

  return {
    ...exercises_workbook,
    listening: { ...listening, parts },
  };
}
