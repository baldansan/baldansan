/** Normalize route param from /lessons/[lessonId]. */
export function normalizeLessonRouteId(lessonId: string): string {
  return lessonId.trim();
}

/** Alias used by Supabase query helpers. */
export function normalizeLessonIdForQuery(lessonId: string): string {
  return normalizeLessonRouteId(lessonId);
}

/**
 * Query candidates for lessons.id — numeric first when route param is numeric-like,
 * because Supabase/PostgREST integer/bigint columns may not match string "5".
 */
export function lessonIdQueryCandidates(
  lessonId: string
): Array<string | number> {
  const normalized = normalizeLessonRouteId(lessonId);

  if (/^\d+$/.test(normalized)) {
    const numeric = Number(normalized);
    if (!Number.isNaN(numeric)) {
      return [numeric, normalized];
    }
  }

  return [normalized];
}

export function canonicalLessonId(value: string | number): string {
  return String(value).trim();
}

export function lessonIdsMatch(
  a: string | number,
  b: string | number
): boolean {
  return canonicalLessonId(a) === canonicalLessonId(b);
}
