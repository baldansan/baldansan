/** YouTube always serves hqdefault (480x360) for every video. */
export function youtubeThumbUrl(
  youtubeId: string | null | undefined
): string | null {
  const id = youtubeId?.trim();
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}
