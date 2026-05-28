/** Normalize Next.js searchParams preview value. */
export function parsePreviewParam(
  preview: string | string[] | undefined
): string | undefined {
  if (Array.isArray(preview)) {
    return preview[0];
  }
  return preview;
}

export function isAdminPreviewParam(
  preview: string | string[] | undefined
): boolean {
  return parsePreviewParam(preview) === "admin";
}
