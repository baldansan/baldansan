/** First Chinese character for series cover placeholder. */
export function seriesCoverInitial(titleZh: string | null | undefined): string {
  const trimmed = titleZh?.trim();
  if (!trimmed) return "课";
  return trimmed.charAt(0);
}

export function normalizeSeriesCoverUrl(
  value: string | null | undefined
): string | null {
  const trimmed = value?.trim();
  return trimmed || null;
}
