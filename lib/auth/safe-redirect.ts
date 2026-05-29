/** Allow only same-origin relative paths (no protocol-relative or external URLs). */
export function isSafeInternalPath(path: string | null | undefined): path is string {
  if (!path || typeof path !== "string") return false;
  const trimmed = path.trim();
  if (!trimmed.startsWith("/")) return false;
  if (trimmed.startsWith("//")) return false;
  if (trimmed.includes("://")) return false;
  if (trimmed.includes("\\")) return false;
  return true;
}

export function getSafeRedirectPath(
  next: string | null | undefined,
  fallback = "/profile"
): string {
  return isSafeInternalPath(next) ? next : fallback;
}
