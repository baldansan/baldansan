/** True when URL looks like a direct playable video file. */
export function isDirectVideoUrl(url: string): boolean {
  return /\.(mp4|webm|ogg)(\?|#|$)/i.test(url.trim());
}

/** True when URL looks like a direct playable audio file. */
export function isDirectAudioUrl(url: string): boolean {
  return /\.(mp3|wav|ogg|m4a|aac)(\?|#|$)/i.test(url.trim());
}

/** Basic http(s) check for admin warnings (non-blocking). */
export function isHttpUrl(url: string): boolean {
  return /^https?:\/\//i.test(url.trim());
}
