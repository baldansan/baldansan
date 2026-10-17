import type { VideoSubtitleRow } from "@/lib/bichleg/types";
import { subtitlePlayerSeekSec } from "@/lib/bichleg/subtitle-offset";

/** ⏪/⏩ товч болон давхар товшилтын алхам (секунд). */
export const BICHLEG_SKIP_SECONDS = 10;

/** Хэвтээ шудрах (swipe) дохио: 1px = хэдэн секунд. */
export const BICHLEG_SWIPE_SEC_PER_PX = 0.25;

/** Үргэлжлүүлэх: үзсэн цаг ≥ 10с бол л санал болгоно. */
export const BICHLEG_RESUME_MIN_SEC = 10;
/** Үргэлжлүүлэх: үзсэн хувь ≥ 95% бол эхнээс эхлүүлнэ. */
export const BICHLEG_RESUME_MAX_RATIO = 0.95;
/** Үргэлжлүүлэхэд хэдэн секунд ухарч эхлэх вэ (контекст сэргээх). */
export const BICHLEG_RESUME_REWIND_SEC = 2;

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

/**
 * Үзэж байсан цагаас үргэлжлүүлэх эсэх. null → эхнээс.
 * Буцаах утга нь тоглуулагчийн seek хийх секунд (2с ухарсан).
 */
export function resolveResumeSeekSec(
  watchedSec: number | null | undefined,
  durationSec: number | null | undefined
): number | null {
  const watched = Number(watchedSec ?? 0);
  const duration = Number(durationSec ?? 0);
  if (!Number.isFinite(watched) || watched < BICHLEG_RESUME_MIN_SEC) return null;
  if (Number.isFinite(duration) && duration > 0) {
    if (watched >= duration * BICHLEG_RESUME_MAX_RATIO) return null;
  }
  return Math.max(0, watched - BICHLEG_RESUME_REWIND_SEC);
}

/** Идэвхтэй мөрийн байрлал (массивын индекс), олдохгүй бол -1. */
export function subtitlePosition(
  subtitles: VideoSubtitleRow[],
  activeIdx: number | null
): number {
  if (activeIdx == null) return -1;
  return subtitles.findIndex((s) => s.idx === activeIdx);
}

/**
 * «◀ өгүүлбэр»: мөрийн эхнээс 1.2с илүү явсан бол тэр мөрийн эхлэл,
 * үгүй бол өмнөх мөр. Буцаах нь seek хийх секунд (offset тооцсон) эсвэл null.
 */
export function prevSentenceSeekSec(
  subtitles: VideoSubtitleRow[],
  activeIdx: number | null,
  playerTimeSec: number,
  totalOffsetSec: number
): number | null {
  if (!subtitles.length) return null;
  let pos = subtitlePosition(subtitles, activeIdx);
  if (pos < 0) {
    // Мөрүүдийн завсарт байна — өмнө нь дууссан хамгийн сүүлийн мөр
    pos = subtitles.findIndex((s) => s.start_sec + totalOffsetSec > playerTimeSec);
    pos = pos < 0 ? subtitles.length : pos;
    const prev = subtitles[pos - 1];
    return prev ? subtitlePlayerSeekSec(prev, totalOffsetSec) : 0;
  }
  const cur = subtitles[pos]!;
  const curStart = subtitlePlayerSeekSec(cur, totalOffsetSec);
  if (playerTimeSec - curStart > 1.2) return curStart;
  const prev = subtitles[pos - 1];
  return prev ? subtitlePlayerSeekSec(prev, totalOffsetSec) : curStart;
}

/** «▶ өгүүлбэр»: дараагийн мөрийн эхлэл (offset тооцсон) эсвэл null. */
export function nextSentenceSeekSec(
  subtitles: VideoSubtitleRow[],
  activeIdx: number | null,
  playerTimeSec: number,
  totalOffsetSec: number
): number | null {
  if (!subtitles.length) return null;
  const pos = subtitlePosition(subtitles, activeIdx);
  const next =
    pos >= 0
      ? subtitles[pos + 1]
      : subtitles.find((s) => s.start_sec + totalOffsetSec > playerTimeSec);
  return next ? subtitlePlayerSeekSec(next, totalOffsetSec) : null;
}
