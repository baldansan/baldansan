/** Normalize cover_url from Supabase (public path under /covers/...). */
export function normalizeCourseCoverUrl(
  value: string | null | undefined
): string | null {
  const trimmed = value?.trim();
  return trimmed || null;
}
