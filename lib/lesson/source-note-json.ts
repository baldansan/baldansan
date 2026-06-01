const SOURCE_NOTE_SEP = " · ";

export type ParsedLessonSourceNote =
  | { format: "json"; data: Record<string, unknown> }
  | { format: "legacy"; raw: string };

export function isJsonSourceNote(sourceNote: string | undefined | null): boolean {
  const trimmed = sourceNote?.trim();
  if (!trimmed?.startsWith("{")) return false;
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed);
  } catch {
    return false;
  }
}

export function parseLessonSourceNote(
  sourceNote: string | undefined | null
): ParsedLessonSourceNote {
  const raw = sourceNote?.trim() ?? "";
  if (isJsonSourceNote(raw)) {
    return {
      format: "json",
      data: JSON.parse(raw) as Record<string, unknown>,
    };
  }
  return { format: "legacy", raw };
}

export function getJsonSourceNoteField(
  sourceNote: string | undefined | null,
  key: string
): unknown {
  const parsed = parseLessonSourceNote(sourceNote);
  if (parsed.format === "json") {
    return parsed.data[key];
  }
  return parseLegacySourceNoteSegment(sourceNote, key);
}

export function parseLegacySourceNoteSegment(
  sourceNote: string | undefined | null,
  key: string
): string | null {
  if (!sourceNote?.trim()) return null;
  for (const part of sourceNote.split(SOURCE_NOTE_SEP)) {
    const trimmed = part.trim();
    if (trimmed.startsWith(`${key}=`)) {
      return trimmed.slice(key.length + 1);
    }
  }
  return null;
}

export function parseLegacySourceNoteJsonSegment<T = unknown>(
  sourceNote: string | undefined | null,
  key: string
): T | null {
  const raw = parseLegacySourceNoteSegment(sourceNote, key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function getSourceNoteTag(
  sourceNote: string | undefined | null,
  tag: string
): string | null {
  const parsed = parseLessonSourceNote(sourceNote);
  if (parsed.format === "json") {
    const value = parsed.data[tag];
    if (value == null) return null;
    return String(value).trim().toLowerCase() || null;
  }

  const pattern = new RegExp(`${tag}=([^·\\s,]+)`, "i");
  const match = parsed.raw.match(pattern);
  return match?.[1]?.trim().toLowerCase() ?? null;
}

export function mergeJsonSourceNoteFields(
  sourceNote: string | undefined | null,
  fields: Record<string, unknown>
): string {
  const parsed = parseLessonSourceNote(sourceNote);
  const base =
    parsed.format === "json"
      ? { ...parsed.data }
      : parsed.raw
        ? { legacySourceNote: parsed.raw }
        : {};

  const merged = { ...base, ...fields };
  return JSON.stringify(merged);
}

export function mergeTeachingMediaIntoJsonOrLegacySourceNote(
  sourceNote: string | undefined | null,
  media: {
    teachingImages?: unknown[];
    vocabAudio?: Record<string, string>;
    vocabPronMn?: Record<string, string>;
  }
): string {
  const parsed = parseLessonSourceNote(sourceNote);

  if (parsed.format === "json") {
    const next = { ...parsed.data };
    if (media.teachingImages?.length) {
      next.teachingImages = media.teachingImages;
    }
    if (media.vocabAudio && Object.keys(media.vocabAudio).length > 0) {
      next.vocabAudio = media.vocabAudio;
    }
    if (media.vocabPronMn && Object.keys(media.vocabPronMn).length > 0) {
      next.vocabPronMn = media.vocabPronMn;
    }
    return JSON.stringify(next);
  }

  let note = parsed.raw;
  const append = (key: string, value: string) => {
    const segment = `${key}=${value}`;
    if (!note) {
      note = segment;
      return;
    }
    if (note.includes(`${key}=`)) return;
    note = `${note}${SOURCE_NOTE_SEP}${segment}`;
  };

  if (media.teachingImages?.length) {
    append("teachingImages", JSON.stringify(media.teachingImages));
  }
  if (media.vocabAudio && Object.keys(media.vocabAudio).length > 0) {
    append("vocabAudio", JSON.stringify(media.vocabAudio));
  }
  if (media.vocabPronMn && Object.keys(media.vocabPronMn).length > 0) {
    append("vocabPronMn", JSON.stringify(media.vocabPronMn));
  }

  return note;
}
