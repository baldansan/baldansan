import type { VideoRow, VideoSubtitleRow } from "@/lib/bichleg/types";

export const USER_SUBTITLE_OFFSET_OPTIONS = [-1, -0.5, 0, 0.5, 1] as const;

export type UserSubtitleOffsetOption =
  (typeof USER_SUBTITLE_OFFSET_OPTIONS)[number];

const SESSION_KEY_PREFIX = "bichleg:user-sub-offset:";

export function adminSubtitleOffsetSec(
  video: Pick<VideoRow, "subtitle_offset_sec" | "sync_offset_sec">
): number {
  const primary = Number(video.subtitle_offset_sec);
  if (Number.isFinite(primary)) return primary;
  const legacy = Number(video.sync_offset_sec ?? 0);
  return Number.isFinite(legacy) ? legacy : 0;
}

export function totalSubtitleOffsetSec(
  video: Pick<VideoRow, "subtitle_offset_sec" | "sync_offset_sec">,
  userOffsetSec: number
): number {
  return adminSubtitleOffsetSec(video) + userOffsetSec;
}

export function findActiveSubtitle(
  subtitles: VideoSubtitleRow[],
  playerTimeSec: number,
  totalOffsetSec: number
): VideoSubtitleRow | null {
  return (
    subtitles.find(
      (line) =>
        playerTimeSec >= line.start_sec + totalOffsetSec &&
        playerTimeSec < line.end_sec + totalOffsetSec
    ) ?? null
  );
}

export function subtitlePlayerSeekSec(
  sub: VideoSubtitleRow,
  totalOffsetSec: number
): number {
  return sub.start_sec + totalOffsetSec;
}

export function readUserSubtitleOffset(videoId: string): UserSubtitleOffsetOption {
  if (typeof window === "undefined") return 0;
  try {
    const raw = sessionStorage.getItem(`${SESSION_KEY_PREFIX}${videoId}`);
    if (raw == null) return 0;
    const value = Number(raw);
    return USER_SUBTITLE_OFFSET_OPTIONS.includes(value as UserSubtitleOffsetOption)
      ? (value as UserSubtitleOffsetOption)
      : 0;
  } catch {
    return 0;
  }
}

export function writeUserSubtitleOffset(
  videoId: string,
  offset: UserSubtitleOffsetOption
): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(`${SESSION_KEY_PREFIX}${videoId}`, String(offset));
  } catch {
    /* private mode / quota */
  }
}

export function nextUserSubtitleOffset(
  current: UserSubtitleOffsetOption
): UserSubtitleOffsetOption {
  const index = USER_SUBTITLE_OFFSET_OPTIONS.indexOf(current);
  const nextIndex =
    index < 0 ? 0 : (index + 1) % USER_SUBTITLE_OFFSET_OPTIONS.length;
  return USER_SUBTITLE_OFFSET_OPTIONS[nextIndex];
}

export function formatUserSubtitleOffsetLabel(
  offset: UserSubtitleOffsetOption
): string {
  if (offset === 0) return "0";
  return offset > 0 ? `+${offset}с` : `${offset}с`;
}
