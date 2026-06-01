export const MONGOLIA_TIME_ZONE = "Asia/Ulaanbaatar";
export const MONGOLIA_TIME_LABEL = "Монгол цаг";

export type MongoliaTimeFormat = "datetime" | "date" | "time";

function parseTimestamp(
  value: string | number | Date | null | undefined
): Date | null {
  if (value == null || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function buildFormatOptions(
  format: MongoliaTimeFormat
): Intl.DateTimeFormatOptions {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: MONGOLIA_TIME_ZONE,
  };

  if (format === "datetime" || format === "date") {
    options.year = "numeric";
    options.month = "2-digit";
    options.day = "2-digit";
  }
  if (format === "datetime" || format === "time") {
    options.hour = "2-digit";
    options.minute = "2-digit";
  }

  return options;
}

/** Format a UTC/ISO timestamp for display in Mongolia (Asia/Ulaanbaatar). */
export function formatMongoliaDateTime(
  value: string | number | Date | null | undefined,
  format: MongoliaTimeFormat = "datetime"
): string {
  const date = parseTimestamp(value);
  if (!date) return "";

  return new Intl.DateTimeFormat("mn-MN", buildFormatOptions(format)).format(
    date
  );
}

export function formatMongoliaDateTimeOrFallback(
  value: string | number | Date | null | undefined,
  fallback = "—",
  format: MongoliaTimeFormat = "datetime"
): string {
  return formatMongoliaDateTime(value, format) || fallback;
}

/** Formatted timestamp prefixed with the Mongolia time label. */
export function formatMongoliaDateTimeWithLabel(
  value: string | number | Date | null | undefined,
  format: MongoliaTimeFormat = "datetime"
): string {
  const formatted = formatMongoliaDateTime(value, format);
  if (!formatted) return "";
  return `${MONGOLIA_TIME_LABEL}: ${formatted}`;
}

export function toIsoDateTimeAttribute(
  value: string | number | Date | null | undefined
): string | undefined {
  return parseTimestamp(value)?.toISOString();
}
