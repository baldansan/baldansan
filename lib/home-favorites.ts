/**
 * Нүүр хуудасны "Таалагдсан ном" (favourite book) жагсаалт — localStorage-д
 * хадгална (сервертэй синк хийхгүй, тухайн төхөөрөмж дээрх хялбар сонголт).
 */

const HOME_FAVORITES_KEY = "bs:homeFavoriteBooks";

export function readHomeFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HOME_FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function writeHomeFavorites(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HOME_FAVORITES_KEY, JSON.stringify(ids));
  } catch {
    // ignore — favourites are a convenience, not critical state
  }
}

/** Toggles `id` in the stored favourites set and returns the new list. */
export function toggleHomeFavorite(id: string): string[] {
  const current = readHomeFavorites();
  const next = current.includes(id)
    ? current.filter((v) => v !== id)
    : [...current, id];
  writeHomeFavorites(next);
  return next;
}
