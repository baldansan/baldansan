export type ImportErrorDetail = {
  field?: string;
  reason: string;
  section?: string;
  lessonId?: string;
};

/** Turn API/import error strings into structured UI rows. */
export function parseImportErrorDetails(
  errors: string[],
  lessonId?: string
): ImportErrorDetail[] {
  return errors.map((raw) => {
    const reason = raw.trim();
    if (!reason) {
      return { reason: "Unknown import error.", lessonId };
    }

    const bracketMatch = reason.match(/^([a-zA-Z_[\].0-9]+):\s*(.+)$/);
    if (bracketMatch) {
      const field = bracketMatch[1];
      const section = field.includes("[") ? field.split("[")[0] : field;
      return { field, section, reason: bracketMatch[2], lessonId };
    }

    if (reason.toLowerCase().includes("source_note")) {
      return { field: "sourceNote", section: "source_note", reason, lessonId };
    }
    if (reason.toLowerCase().includes("draft lesson")) {
      return { field: "lesson", section: "lessons", reason, lessonId };
    }
    if (reason.toLowerCase().includes("bulk import")) {
      return { field: "importPayload", section: "content", reason, lessonId };
    }

    return { reason, lessonId };
  });
}
