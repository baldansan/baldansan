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

/** Сүүлд хагас үзсэн анги, эсвэл эхний дуусаагүй анги. */
export function resolveSeriesContinueVideoId(
  episodes: Array<{ id: string }>,
  progressByVideoId: Record<string, UserVideoProgress>
): string | null {
  if (!episodes.length) return null;

  const allCompleted = episodes.every((ep) => progressByVideoId[ep.id]?.completed);
  if (allCompleted) return null;

  let latestPartialId: string | null = null;
  let latestPartialAt = -1;
  for (const ep of episodes) {
    const progress = progressByVideoId[ep.id];
    if (!progress || progress.completed || progress.watched_sec <= 0) continue;
    const at = Date.parse(progress.last_watched_at);
    const safeAt = Number.isFinite(at) ? at : 0;
    if (safeAt > latestPartialAt) {
      latestPartialAt = safeAt;
      latestPartialId = ep.id;
    }
  }
  if (latestPartialId) return latestPartialId;

  const firstUnfinished = episodes.find((ep) => !progressByVideoId[ep.id]?.completed);
  return firstUnfinished?.id ?? null;
}
