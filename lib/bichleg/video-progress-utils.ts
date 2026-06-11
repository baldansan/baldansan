import type { UserVideoProgress, VideoRow } from "@/lib/bichleg/types";

const COMPLETED_RATIO = 0.9;

export function isVideoWatchCompleted(
  watchedSec: number,
  durationSec: number | null | undefined
): boolean {
  const duration = Number(durationSec ?? 0);
  if (!Number.isFinite(duration) || duration <= 0) return false;
  return watchedSec >= duration * COMPLETED_RATIO;
}

export function resolveBichlegStartIndex(
  videos: VideoRow[],
  progressByVideoId: Record<string, UserVideoProgress>,
  startVideoId?: string | null
): number {
  if (startVideoId) {
    const fromQuery = videos.findIndex((v) => v.id === startVideoId);
    if (fromQuery >= 0) return fromQuery;
  }

  const firstUnwatched = videos.findIndex((v) => !progressByVideoId[v.id]?.completed);
  return firstUnwatched >= 0 ? firstUnwatched : 0;
}
