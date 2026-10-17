"use client";

import Link from "next/link";
import { BichlegVideoCard } from "@/components/temee/bichleg-video-card";
import { youtubeThumbUrl } from "@/lib/bichleg/youtube-thumb";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { SHELL_MAIN_NARROW } from "@/lib/app-shell-classes";
import {
  formatEpisodeListTitle,
  formatSeriesHeaderMeta,
} from "@/lib/bichleg/episode-label";
import {
  episodeProgressPct,
  episodeWatchHref,
  formatResumeLabel,
  getNextEpisodeInList,
  resolveEpisodeWatchState,
  resolveLastWatchedVideoId,
  resolveSeriesContinueTarget,
} from "@/lib/bichleg/episode-progress";
import { seriesCoverInitial } from "@/lib/bichleg/series-cover";
import type {
  UserVideoProgress,
  VideoEpisodeItem,
  VideoSeriesInfo,
} from "@/lib/bichleg/types";
import { useUiLocale, type UiLocale } from "@/lib/i18n/ui-locale";
import { tr } from "@/lib/i18n/translate";

type Props = {
  seriesId: string;
  series: VideoSeriesInfo | null;
  episodes: VideoEpisodeItem[];
  progressByVideoId?: Record<string, UserVideoProgress>;
  /** false (зочин) бол явцын UI огт харуулахгүй. */
  loggedIn?: boolean;
};

function episodeHanzi(episode: VideoEpisodeItem): string {
  const zh = episode.title_zh?.trim();
  if (zh) return zh.charAt(0);
  return seriesCoverInitial(episode.title_mn);
}

function episodeBadgeLabel(
  locale: UiLocale,
  episode: VideoEpisodeItem,
  index: number
): string {
  const no = episode.episode_no ?? index + 1;
  return locale === "zh" ? `第${no}集` : `${no}-р анги`;
}

export function BichlegEpisodeListClient({
  seriesId,
  series,
  episodes,
  progressByVideoId = {},
  loggedIn = false,
}: Props) {
  const locale = useUiLocale();
  const isOther = seriesId === "other";
  const titleMn =
    series?.title_mn ??
    series?.title_zh ??
    (isOther ? tr(locale, "Бусад бичлэг") : seriesId);
  const hskLevel = series?.hsk_level ?? episodes[0]?.hsk_level ?? null;

  const headerMeta =
    episodes.length > 0
      ? formatSeriesHeaderMeta(episodes.length, hskLevel).replace(
          "анги",
          tr(locale, "анги")
        )
      : tr(locale, isOther ? "Цувралгүй бичлэг" : "Анги олдсонгүй");

  const showProgress = loggedIn;
  const watchedCount = showProgress
    ? episodes.filter(
        (ep) =>
          resolveEpisodeWatchState(progressByVideoId[ep.id], ep.duration_sec) ===
          "completed"
      ).length
    : 0;

  const continueTarget = showProgress
    ? resolveSeriesContinueTarget(episodes, progressByVideoId)
    : null;
  const continueEpisode = continueTarget
    ? episodes.find((ep) => ep.id === continueTarget.videoId) ?? null
    : null;
  const continuePct = continueEpisode
    ? episodeProgressPct(progressByVideoId[continueEpisode.id], continueEpisode.duration_sec)
    : 0;
  const continueKicker =
    continueTarget?.kind === "resume"
      ? tr(locale, "Үргэлжлүүлэх")
      : continueTarget?.kind === "next"
        ? tr(locale, "Дараагийн анги")
        : tr(locale, "Эхлэх");
  const allDone = showProgress && episodes.length > 0 && !continueTarget;

  // Сүүлд үзсэн ангийн дараагийнх — «Дараагийн анги →» онцлох карт.
  const lastWatchedId = showProgress
    ? resolveLastWatchedVideoId(episodes, progressByVideoId)
    : null;
  const nextAfterLast = lastWatchedId
    ? getNextEpisodeInList(episodes, lastWatchedId)
    : null;
  const nextAfterLastId =
    nextAfterLast &&
    resolveEpisodeWatchState(progressByVideoId[nextAfterLast.id], nextAfterLast.duration_sec) !==
      "completed"
      ? nextAfterLast.id
      : null;

  return (
    <MobileAppShell activeTab="clips" mainClassName={SHELL_MAIN_NARROW} desktopWidth="wide">
      <Link href="/bichleg" className="bs-mem-back">
        {tr(locale, "← Цуврал сонгох")}
      </Link>
      <h1 className="bs-tm-page-title" translate="no">{titleMn}</h1>
      <p className="mb-4 text-sm font-semibold text-[#7a8c82]">
        {headerMeta}
        {showProgress && episodes.length > 0
          ? ` · ${watchedCount}/${episodes.length} ${tr(locale, "анги үзсэн")}`
          : null}
      </p>

      {episodes.length === 0 ? (
        <div className="bs-bichleg-pick-empty">
          <p className="text-sm font-bold text-[var(--app-text)]">
            {tr(locale, "Энэ цувралд бичлэг байхгүй")}
          </p>
          <p className="mt-2 text-xs text-[var(--app-muted)]">
            {isOther
              ? tr(locale, "series_id хоосон бичлэг олдсонгүй.")
              : `series_id «${seriesId}»${tr(locale, "-тай бичлэг олдсонгүй. Импорт шалгана уу.")}`}
          </p>
          <Link href="/bichleg" className="bs-bichleg-back-link mt-4">
            {tr(locale, "← Цуврал сонгох")}
          </Link>
        </div>
      ) : (
        <>
          {continueTarget && continueEpisode ? (
            <Link
              href={episodeWatchHref(
                seriesId,
                continueEpisode.id,
                continueTarget.kind === "resume" ? continueTarget.watchedSec : 0
              )}
              className="bs-tm-continue bs-tm-continue--bichleg mb-4"
            >
              <span className="bs-tm-continue-ic" aria-hidden>
                ▶
              </span>
              <span className="min-w-0 flex-1">
                <p className="bs-tm-continue-kicker">{continueKicker}</p>
                <p className="bs-tm-continue-title" translate="no">
                  {formatEpisodeListTitle(
                    continueEpisode.episode_no,
                    continueEpisode.title_mn
                  )}
                </p>
                {continueTarget.kind === "resume" ? (
                  <span className="bs-tm-continue-progress">
                    <span className="bs-tm-video-progress-track">
                      <i style={{ width: `${continuePct}%` }} />
                    </span>
                    <span className="bs-tm-continue-progress-label">
                      {formatResumeLabel(locale, continuePct, continueTarget.watchedSec)}
                    </span>
                  </span>
                ) : null}
              </span>
              <span className="bs-tm-continue-arrow" aria-hidden>
                →
              </span>
            </Link>
          ) : null}
          {allDone ? (
            <p className="bs-tm-continue-done mb-4">
              {tr(locale, "Бүх ангийг үзсэн ✓")}
            </p>
          ) : null}
          <div className="bs-bichleg-ep-grid">
          {episodes.map((episode, index) => {
            const progress = showProgress ? progressByVideoId[episode.id] : undefined;
            const state = resolveEpisodeWatchState(progress, episode.duration_sec);
            const pct = episodeProgressPct(progress, episode.duration_sec);
            const label = formatEpisodeListTitle(
              episode.episode_no,
              episode.title_mn
            );
            const stateLabel = !showProgress
              ? undefined
              : state === "completed"
                ? tr(locale, "✓ Үзсэн")
                : state === "partial" && progress
                  ? formatResumeLabel(locale, pct, progress.watched_sec)
                  : tr(locale, "Үзээгүй");
            const isNext = nextAfterLastId === episode.id;

            return (
              <BichlegVideoCard
                key={episode.id}
                href={episodeWatchHref(
                  seriesId,
                  episode.id,
                  state === "partial" ? progress?.watched_sec : 0
                )}
                titleMn={label}
                titleZh={episode.title_zh}
                hanzi={episodeHanzi(episode)}
                coverUrl={youtubeThumbUrl(episode.youtube_id)}
                thumbIndex={index}
                episodeBadge={episodeBadgeLabel(locale, episode, index)}
                hskLevel={episode.hsk_level}
                showProgressBar={showProgress}
                progressPct={showProgress ? pct : undefined}
                progressLabel={stateLabel}
                progressDone={state === "completed"}
                accentLabel={isNext ? tr(locale, "Дараагийн анги →") : undefined}
              />
            );
          })}
          </div>
        </>
      )}
    </MobileAppShell>
  );
}
