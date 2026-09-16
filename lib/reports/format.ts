/**
 * Formatting helpers shared by the printable reports and the certificate.
 *
 * One rule runs through all of them: a figure that could not be measured comes
 * back as «—», never as 0. A zero is a measurement («нэг ч сурагч дуусгаагүй»);
 * a dash is an admission («хэмжих өгөгдөл алга»). Mixing the two is how a
 * report starts lying.
 */

/** Printed wherever a number could not be computed. */
export const MISSING = "—";

export function isMeasured(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** A plain number, or «—» when it was not measured. */
export function numberText(value: number | null | undefined): string {
  return isMeasured(value) ? String(Math.round(value)) : MISSING;
}

/** A percentage with its sign, or «—». */
export function percentText(value: number | null | undefined): string {
  return isMeasured(value) ? `${Math.round(value)}%` : MISSING;
}

/** A score out of 100, or «—». */
export function scoreText(value: number | null | undefined): string {
  return isMeasured(value) ? `${Math.round(value)} оноо` : MISSING;
}

function pad(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

/** 2026.09.16 — compact, for table cells. */
export function dateText(iso: string | null | undefined): string {
  if (!iso) return MISSING;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return MISSING;
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
}

/** 2026 оны 09 сарын 16 — for headings and the certificate. */
export function dateTextLong(iso: string | null | undefined): string {
  if (!iso) return MISSING;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return MISSING;
  return `${date.getFullYear()} оны ${pad(date.getMonth() + 1)} сарын ${pad(date.getDate())}`;
}

/** «2026.01.10 – 2026.09.16» or «—» when the start date is unknown. */
export function periodText(
  startIso: string | null | undefined,
  endIso: string | null | undefined
): string {
  const start = dateText(startIso);
  const end = dateText(endIso);
  if (start === MISSING && end === MISSING) return MISSING;
  if (start === MISSING) return `… – ${end}`;
  if (end === MISSING) return `${start} – …`;
  return `${start} – ${end}`;
}

/** Escape a value so it cannot break out of a Markdown table row. */
export function mdCell(value: string | number | null | undefined): string {
  if (value == null || value === "") return MISSING;
  return String(value).replace(/\|/g, "\\|").replace(/\r?\n/g, " ").trim() || MISSING;
}

/** One Markdown table row from already-escaped cells. */
export function mdRow(cells: (string | number | null | undefined)[]): string {
  return `| ${cells.map((cell) => mdCell(cell)).join(" | ")} |`;
}

/** Join sentences into one paragraph, trimming empties. */
export function paragraph(sentences: string[]): string {
  return sentences
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .join(" ");
}

export const DELIVERY_MODE_LABELS: Record<string, string> = {
  in_person: "Танхим",
  online: "Онлайн",
  hybrid: "Холимог",
};

export function deliveryModeText(mode: string | null | undefined): string {
  if (!mode) return MISSING;
  return DELIVERY_MODE_LABELS[mode] ?? mode;
}

const HSK_COURSE_LABELS: Record<string, string> = {
  hsk1: "HSK 1",
  hsk2: "HSK 2",
  hsk3: "HSK 3",
  hsk4: "HSK 4",
  hsk5: "HSK 5",
  hsk6: "HSK 6",
};

/** «HSK 2» from a course id, or the raw id when it is not an HSK course. */
export function courseLabel(courseId: string | null | undefined): string | null {
  if (!courseId) return null;
  return HSK_COURSE_LABELS[courseId.toLowerCase()] ?? courseId;
}

/** Level shown in a report header: course label first, free-text level second. */
export function levelLabelFrom(
  courseId: string | null | undefined,
  level: string | null | undefined
): string | null {
  return courseLabel(courseId) ?? (level?.trim() || null);
}
