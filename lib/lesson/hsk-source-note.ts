const SOURCE_NOTE_SEP = " · ";

/** Parse a `key=value` segment from lessons.source_note (shared with teaching-media). */
export function parseSourceNoteSegment(
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

export function appendSourceNoteSegment(
  sourceNote: string | undefined | null,
  key: string,
  value: string
): string {
  const base = removeSourceNoteSegment(sourceNote, key);
  const segment = `${key}=${value}`;
  return base ? `${base}${SOURCE_NOTE_SEP}${segment}` : segment;
}

function removeSourceNoteSegment(
  sourceNote: string | undefined | null,
  key: string
): string {
  if (!sourceNote?.trim()) return "";
  return sourceNote
    .split(SOURCE_NOTE_SEP)
    .map((part) => part.trim())
    .filter((part) => part && !part.startsWith(`${key}=`))
    .join(SOURCE_NOTE_SEP);
}
