/**
 * Бичлэг: «хаана байсан / дараа нь юу» — цэвэр (client-safe) тооцоолол.
 *
 * Ангийн жагсаалт, цуврал сонгогч, нүүр хуудас, тоглуулагч бүгд энэ
 * файлаас ашиглана. Supabase дуудлага ЭНД БАЙХГҮЙ — зөвхөн утга тооцоолно.
 */
import type {
  SeriesWatchProgress,
  UserVideoProgress,
} from "@/lib/bichleg/types";
import { tr } from "@/lib/i18n/translate";
import type { UiLocale } from "@/lib/i18n/locale-types";

/** 95%-аас дээш үзсэн бол «үргэлжлүүлэх» биш «дууссан» гэж үзнэ. */
export const CONTINUE_MAX_RATIO = 0.95;

export type EpisodeWatchState = "unwatched" | "partial" | "completed";

export type ContinueKind = "resume" | "next" | "start";

export type SeriesContinueTarget = {
  videoId: string;
  kind: ContinueKind;
  /** «resume» үед хаанаас үргэлжлүүлэх (сек). */
  watchedSec: number;
};

/** Цуврал сонгогчид зориулсан өргөтгөсөн явц (SeriesWatchProgress-той нийцтэй). */
export type SeriesWatchProgressDetail = SeriesWatchProgress & {
  /** Хагас үзсэн (дуусаагүй, watched_sec > 0) ангийн тоо. */
  inProgressCount: number;
  /** Энэ цувралд сүүлд үзсэн цаг (ISO) — эрэмбэлэхэд. */
  lastWatchedAt: string | null;
  /** Үргэлжлүүлэх / дараагийн / эхлэх анги. Бүгдийг үзсэн бол null. */
  continueTarget: SeriesContinueEpisode | null;
};

export type SeriesContinueEpisode = SeriesContinueTarget & {
  title_mn: string | null;
  title_zh: string | null;
  episode_no: number | null;
  duration_sec: number | null;
  youtube_id: string | null;
};

/** 754 → «12:34», 3725 → «1:02:05». */
export function formatClockTime(sec: number): string {
  const s = Math.max(0, Math.floor(Number(sec) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  return `${h > 0 ? `${h}:` : ""}${mm}:${String(r).padStart(2, "0")}`;
}

/** «65% · 12:34-өөс үргэлжлүүлэх» (zh: «65% · 从 12:34 继续»). */
export function formatResumeLabel(
  locale: UiLocale,
  pct: number,
  watchedSec: number
): string {
  return tr(locale, "{pct}% · {time}-өөс үргэлжлүүлэх")
    .replace("{pct}", String(pct))
    .replace("{time}", formatClockTime(watchedSec));
}

export function resolveEpisodeWatchState(
  progress: UserVideoProgress | undefined,
  durationSec: number | null | undefined
): EpisodeWatchState {
  if (!progress) return "unwatched";
  if (progress.completed) return "completed";
  const duration = Number(durationSec ?? 0);
  if (duration > 0 && progress.watched_sec >= duration * CONTINUE_MAX_RATIO) {
    return "completed";
  }
  return progress.watched_sec > 0 ? "partial" : "unwatched";
}

/** 0–100. Дууссан бол 100, хагас бол дээд тал нь 99. */
export function episodeProgressPct(
  progress: UserVideoProgress | undefined,
  durationSec: number | null | undefined
): number {
  const state = resolveEpisodeWatchState(progress, durationSec);
  if (state === "completed") return 100;
  if (state === "unwatched" || !progress) return 0;
  const duration = Number(durationSec ?? 0);
  if (!Number.isFinite(duration) || duration <= 0) return 0;
  return Math.min(99, Math.max(1, Math.round((progress.watched_sec / duration) * 100)));
}

/**
 * Жагсаалт дахь дараагийн анги (эрэмбэ = жагсаалтын дараалал).
 * Тоглуулагч auto-next хийхэд `videos` массивтайгаа дуудна.
 */
export function getNextEpisodeInList<T extends { id: string }>(
  episodes: readonly T[],
  videoId: string
): T | null {
  const idx = episodes.findIndex((ep) => ep.id === videoId);
  if (idx < 0 || idx + 1 >= episodes.length) return null;
  return episodes[idx + 1] ?? null;
}

/** Хамгийн сүүлд (last_watched_at) үзсэн анги — дууссан эсэхээс үл хамаарна. */
export function resolveLastWatchedVideoId(
  episodes: ReadonlyArray<{ id: string }>,
  progressByVideoId: Record<string, UserVideoProgress>
): string | null {
  let bestId: string | null = null;
  let bestAt = -1;
  for (const ep of episodes) {
    const p = progressByVideoId[ep.id];
    if (!p || p.watched_sec <= 0) continue;
    const at = Date.parse(p.last_watched_at);
    const safeAt = Number.isFinite(at) ? at : 0;
    if (safeAt > bestAt) {
      bestAt = safeAt;
      bestId = ep.id;
    }
  }
  return bestId;
}

/**
 * Цувралын «Үргэлжлүүлэх» зорилт:
 *  - resume: сүүлд хагас үзсэн анги (max last_watched_at, < 95 %)
 *  - next:   хагас үзсэн анги байхгүй, ямар нэг анги дууссан → дараагийн үзээгүй анги
 *  - start:  юу ч үзээгүй → эхний анги
 *  - null:   бүгдийг үзсэн
 */
export function resolveSeriesContinueTarget(
  episodes: ReadonlyArray<{ id: string; duration_sec: number | null }>,
  progressByVideoId: Record<string, UserVideoProgress>
): SeriesContinueTarget | null {
  if (!episodes.length) return null;

  let latestPartial: { id: string; watchedSec: number } | null = null;
  let latestPartialAt = -1;
  let anyCompleted = false;
  let lastCompletedIdx = -1;

  episodes.forEach((ep, idx) => {
    const p = progressByVideoId[ep.id];
    const state = resolveEpisodeWatchState(p, ep.duration_sec);
    if (state === "completed") {
      anyCompleted = true;
      lastCompletedIdx = idx;
      return;
    }
    if (state !== "partial" || !p) return;
    const at = Date.parse(p.last_watched_at);
    const safeAt = Number.isFinite(at) ? at : 0;
    if (safeAt > latestPartialAt) {
      latestPartialAt = safeAt;
      latestPartial = { id: ep.id, watchedSec: p.watched_sec };
    }
  });

  if (latestPartial) {
    const lp: { id: string; watchedSec: number } = latestPartial;
    return { videoId: lp.id, kind: "resume", watchedSec: lp.watchedSec };
  }

  // Дараагийн анги: сүүлд дууссан ангийн ард байх эхний үзээгүй; байхгүй бол эхнээс эхлэх үзээгүй.
  const isDone = (ep: { id: string; duration_sec: number | null }) =>
    resolveEpisodeWatchState(progressByVideoId[ep.id], ep.duration_sec) === "completed";
  let next = episodes.slice(lastCompletedIdx + 1).find((ep) => !isDone(ep)) ?? null;
  if (!next) next = episodes.find((ep) => !isDone(ep)) ?? null;
  if (!next) return null;

  return { videoId: next.id, kind: anyCompleted ? "next" : "start", watchedSec: 0 };
}

/** Ангийн линк — хагас үзсэн бол `?t=<sec>` (тоглуулагч уншдаг бол тэр цагаас эхэлнэ). */
export function episodeWatchHref(
  seriesId: string,
  videoId: string,
  resumeSec?: number | null
): string {
  const base = `/bichleg/${encodeURIComponent(seriesId)}/${encodeURIComponent(videoId)}`;
  const t = Math.floor(Number(resumeSec ?? 0));
  return t > 0 ? `${base}?t=${t}` : base;
}

/**
 * Цуврал сонгогчийн дээд «Үргэлжлүүлэх» карт: хамгийн сүүлд үзсэн,
 * дуусаагүй цувралын зорилт. Бүх цуврал дууссан бол null.
 */
export function pickGlobalContinueSeries(
  bySeriesId: Record<string, SeriesWatchProgressDetail>
): { seriesId: string; target: SeriesContinueEpisode } | null {
  let best: { seriesId: string; target: SeriesContinueEpisode } | null = null;
  let bestAt = -1;
  for (const [seriesId, detail] of Object.entries(bySeriesId)) {
    if (!detail.continueTarget || !detail.lastWatchedAt) continue;
    const at = Date.parse(detail.lastWatchedAt);
    const safeAt = Number.isFinite(at) ? at : 0;
    if (safeAt > bestAt) {
      bestAt = safeAt;
      best = { seriesId, target: detail.continueTarget };
    }
  }
  return best;
}

/** Үргэлжлүүлэх цуврал эхэндээ (сүүлд үзсэн нь түрүүлж), үлдсэн нь анхны дарааллаар. */
export function sortSeriesByContinue<T extends { id: string }>(
  seriesList: readonly T[],
  bySeriesId: Record<string, SeriesWatchProgressDetail>
): T[] {
  const active: Array<{ item: T; at: number }> = [];
  const rest: T[] = [];
  for (const s of seriesList) {
    const d = bySeriesId[s.id];
    if (d?.continueTarget && d.lastWatchedAt) {
      const at = Date.parse(d.lastWatchedAt);
      active.push({ item: s, at: Number.isFinite(at) ? at : 0 });
    } else {
      rest.push(s);
    }
  }
  active.sort((a, b) => b.at - a.at);
  return [...active.map((a) => a.item), ...rest];
}
