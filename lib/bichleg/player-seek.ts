export const BICHLEG_SKIP_SECONDS = 3;

export function clampPlaybackTime(time: number, duration: number): number {
  if (!Number.isFinite(time)) return 0;
  if (duration > 0) return Math.min(duration, Math.max(0, time));
  return Math.max(0, time);
}

export function formatSubtitleClock(sec: number): string {
  const total = Math.max(0, Math.floor(sec));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
