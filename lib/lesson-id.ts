/** Normalize route param from /lessons/[lessonId]. */
export function normalizeLessonRouteId(lessonId: string): string {
  return lessonId.trim();
}

/** True when the id is numeric-only (matches integer/bigserial lesson PK rows). */
export function isNumericLessonId(lessonId: string): boolean {
  return /^\d+$/.test(normalizeLessonRouteId(lessonId));
}

/** Alias used by Supabase query helpers. */
export function normalizeLessonIdForQuery(lessonId: string): string {
  return normalizeLessonRouteId(lessonId);
}

/**
 * Query candidates for lessons.id — numeric first when route param is numeric-like,
 * because Supabase/PostgREST integer/bigint columns may not match string "5".
 * For alphanumeric package ids (e.g. KR-L1-PRELESSON-00), include case variants.
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

  const candidates: Array<string | number> = [normalized];
  const lower = normalized.toLowerCase();
  const upper = normalized.toUpperCase();
  if (lower !== normalized) candidates.push(lower);
  if (upper !== normalized && upper !== lower) candidates.push(upper);

  return candidates;
}

/** Slug-style lookup for imported package ids (case-insensitive). */
export function lessonIdSlugCandidates(lessonId: string): string[] {
  const normalized = normalizeLessonRouteId(lessonId);
  const slug = normalized.toLowerCase();
  const variants = new Set([normalized, slug, normalized.toUpperCase()]);
  return [...variants];
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
