/**
 * Normalize cover_url from Supabase (public path under /covers/...).
 * Хуучин зурсан нүүр (`/covers/<id>.png|svg`) DB-д үлдсэн бол бодит номын
 * нүүр (`/covers/<id>.jpg`) руу шилжүүлнэ — admin-аас оруулсан бусад URL хэвээр.
 */
export function normalizeCourseCoverUrl(
  value: string | null | undefined
): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const legacy = trimmed.match(/^\/covers\/(hsk[1-6]|fazhan-[a-z0-9]+|yct-\d+)\.(png|svg)$/);
  if (legacy) return `/covers/${legacy[1]}.jpg`;
  return trimmed;
}
