const RAW_KEY_PATTERN =
  /^(id|type|titlemn|titlechinese|teacherspeechmn|practicemn|sourceref|metadata|sectionkey|sectionid)$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function trim(value: unknown): string {
  return String(value ?? "").trim();
}

function looksLikeRawKeyDump(text: string): boolean {
  const upper = text.toUpperCase();
  if (RAW_KEY_PATTERN.test(text.trim())) return true;
  if (/^(ID|TYPE|TITLEMN|TEACHERSPEECHMN):/i.test(text)) return true;
  if (upper === text && text.length <= 24 && /^[A-Z_]+$/.test(text)) return true;
  return false;
}

/** Turn importer/admin teacher note payloads into warm learner-facing copy. */
export function formatLearnerTeacherNote(note: unknown): string | null {
  if (note == null) return null;

  if (typeof note === "string") {
    const text = note.trim();
    if (!text || looksLikeRawKeyDump(text)) return null;
    return text;
  }

  if (Array.isArray(note)) {
    const parts = note
      .map((item) => formatLearnerTeacherNote(item))
      .filter((item): item is string => Boolean(item));
    if (parts.length === 0) return null;
    return parts.join("\n\n");
  }

  if (!isRecord(note)) return null;

  const speech =
    trim(note.teacherSpeechMn) ||
    trim(note.teacherNoteMn) ||
    trim(note.teacherSpeech) ||
    trim(note.speechMn) ||
    trim(note.bodyMn) ||
    trim(note.mongolian) ||
    trim(note.mn) ||
    trim(note.text) ||
    trim(note.content) ||
    trim(note.summary);

  if (speech && !looksLikeRawKeyDump(speech)) return speech;

  return null;
}

export function formatLearnerTeacherNotes(notes: unknown[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  for (const note of notes) {
    const formatted = formatLearnerTeacherNote(note);
    if (!formatted) continue;
    const key = formatted.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(formatted);
  }

  return out;
}
