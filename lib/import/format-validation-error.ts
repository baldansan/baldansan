/** Parsed row for admin import validation UI (no rule changes). */
export type FormattedValidationError = {
  path: string;
  issue: string;
  expected: string | null;
  found: string | null;
  raw: string;
};

const REQUIRED_FIELD =
  /^([\w[\]./:-]+):\s*(.+?) is required\.?$/i;
const MUST_BE =
  /^([\w[\]./:-]+)\s+must be an (array|object)\.?$/i;
const NOT_FOUND =
  /^([\w[\]./:-]+)\s+not found in ZIP\.?$/i;
const GENERIC_FIELD =
  /^([\w[\]./:-]+):\s*(.+)$/;

/**
 * Turn plain-string validator messages into path + expected/found hints for the UI.
 * Validators stay string-based; this is display-only.
 */
export function formatValidationError(raw: string): FormattedValidationError {
  const trimmed = raw.trim();

  let match = trimmed.match(REQUIRED_FIELD);
  if (match) {
    const [, path, fieldLabel] = match;
    return {
      path,
      issue: `${fieldLabel} is required`,
      expected: `non-empty ${fieldLabel}`,
      found: "(missing or empty)",
      raw: trimmed,
    };
  }

  match = trimmed.match(MUST_BE);
  if (match) {
    const [, path, kind] = match;
    return {
      path,
      issue: `must be a ${kind}`,
      expected: kind,
      found: "wrong type or missing",
      raw: trimmed,
    };
  }

  match = trimmed.match(NOT_FOUND);
  if (match) {
    const [, path] = match;
    return {
      path,
      issue: "file or field not found in ZIP",
      expected: "present in ZIP package",
      found: "missing",
      raw: trimmed,
    };
  }

  match = trimmed.match(GENERIC_FIELD);
  if (match) {
    const [, path, issue] = match;
    return {
      path,
      issue,
      expected: null,
      found: null,
      raw: trimmed,
    };
  }

  return {
    path: "(package)",
    issue: trimmed,
    expected: null,
    found: null,
    raw: trimmed,
  };
}

export function collectValidationErrorMessages(
  validation: {
    ok: boolean;
    errors: string[];
    preview: unknown;
    importPayload: unknown;
    contentValidation?: { valid: boolean; errors: string[] } | null;
  } | null
): string[] {
  if (!validation) return [];

  const messages = [...validation.errors];

  if (!validation.preview) {
    messages.push(
      "Preview could not be built — check manifest.json, lesson.json, and importContext."
    );
  }
  if (!validation.importPayload) {
    messages.push(
      "Import payload missing — bulk import data was not produced (fix errors above first)."
    );
  }
  if (validation.contentValidation && !validation.contentValidation.valid) {
    for (const err of validation.contentValidation.errors) {
      if (!messages.includes(err)) messages.push(err);
    }
  }
  if (!validation.ok && messages.length === 0) {
    messages.push("Validation failed — see Raw validation debug below.");
  }

  return messages;
}
