"use client";

import Link from "next/link";
import { BichlegVideoCard } from "@/components/temee/bichleg-video-card";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { SHELL_MAIN_NARROW } from "@/lib/app-shell-classes";
import {
  formatEpisodeListTitle,
  formatSeriesHeaderMeta,
} from "@/lib/bichleg/episode-label";
import {
  formatEpisodePartialPercent,
  resolveSeriesContinueVideoId,
} from "@/lib/bichleg/video-progress-utils";
import { seriesCoverInitial } from "@/lib/bichleg/series-cover";
import type {
  UserVideoProgress,
  VideoEpisodeItem,
  VideoSeriesInfo,
} from "@/lib/bichleg/types";

type Props = {
  seriesId: string;
  series: VideoSeriesInfo | null;
  episodes: VideoEpisodeItem[];
  progressByVideoId?: Record<string, UserVideoProgress>;
};

function episodeHref(seriesId: string, videoId: string): string {
  return `/bichleg/${encodeURIComponent(seriesId)}/${encodeURIComponent(videoId)}`;
}

function episodeHanzi(episode: VideoEpisodeItem): string {
  const zh = episode.title_zh?.trim();
  if (zh) return zh.charAt(0);
  return seriesCoverInitial(episode.title_mn);
}

export function BichlegEpisodeListClient({
  seriesId,
  series,
  episodes,
  progressByVideoId = {},
}: Props) {
  const isOther = seriesId === "other";
  const titleMn =
    series?.title_mn ?? series?.title_zh ?? (isOther ? "Бусад бичлэг" : seriesId);
  const hskLevel = series?.hsk_level ?? episodes[0]?.hsk_level ?? null;

  const headerMeta =
    episodes.length > 0
      ? formatSeriesHeaderMeta(episodes.length, hskLevel)
      : isOther
        ? "Цувралгүй бичлэг"
        : "Анги олдсонгүй";

  const continueVideoId = resolveSeriesContinueVideoId(episodes, progressByVideoId);
  const continueEpisode = continueVideoId
    ? episodes.find((ep) => ep.id === continueVideoId)
    : null;
  const continueLabel = continueEpisode
    ? formatEpisodeListTitle(continueEpisode.episode_no, continueEpisode.title_mn)
    : null;
  const hasPartialProgress =
    continueVideoId != null &&
    Boolean(
      progressByVideoId[continueVideoId]?.watched_sec &&
        !progressByVideoId[continueVideoId]?.completed
    );

  return (
    <MobileAppShell activeTab="clips" mainClassName={SHELL_MAIN_NARROW}>
      <Link href="/bichleg" className="bs-mem-back">
        ← Цуврал сонгох
      </Link>
      <h1 className="bs-tm-page-title">{titleMn}</h1>
      <p className="mb-4 text-sm font-semibold text-[#7a8c82]">{headerMeta}</p>

      {episodes.length === 0 ? (
        <div className="bs-bichleg-pick-empty">
          <p className="text-sm font-bold text-[var(--app-text)]">
            Энэ цувралд бичлэг байхгүй
          </p>
          <p className="mt-2 text-xs text-[var(--app-muted)]">
            {isOther
              ? "series_id хоосон бичлэг олдсонгүй."
              : `series_id «${seriesId}»-тай бичлэг олдсонгүй. Импорт шалгана уу.`}
          </p>
          <Link href="/bichleg" className="bs-bichleg-back-link mt-4">
            ← Цуврал сонгох
          </Link>
        </div>
      ) : (
        <>
          {continueVideoId && continueLabel ? (
            <Link href={episodeHref(seriesId, continueVideoId)} className="bs-tm-continue mb-4">
              <span className="bs-tm-continue-ic" aria-hidden>
                ▶
              </span>
              <span className="min-w-0 flex-1">
                <p className="bs-tm-continue-kicker">
                  {hasPartialProgress ? "Үргэлжлүүлэх" : "Эхлэх"}
                </p>
                <p className="bs-tm-continue-title">{continueLabel}</p>
              </span>
            </Link>
          ) : null}
          {episodes.map((episode, index) => {
            const progress = progressByVideoId[episode.id];
            const completed = Boolean(progress?.completed);
            const partialPct =
              !completed && progress && episode.duration_sec
                ? Math.min(
                    100,
                    Math.round(
                      (progress.watched_sec / episode.duration_sec) * 100
                    )
                  )
                : completed
                  ? 100
                  : 0;
            const label = formatEpisodeListTitle(
              episode.episode_no,
              episode.title_mn
            );
            const partialLabel =
              !completed && progress
                ? formatEpisodePartialPercent(
                    progress.watched_sec,
                    episode.duration_sec
                  )
                : null;

            return (
              <BichlegVideoCard
                key={episode.id}
                href={episodeHref(seriesId, episode.id)}
                titleMn={label}
                titleZh={episode.title_zh}
                hanzi={episodeHanzi(episode)}
                thumbIndex={index}
                episodeBadge={
                  episode.episode_no != null
                    ? `${episode.episode_no}-р анги`
                    : `${index + 1}-р анги`
                }
                hskLevel={episode.hsk_level}
                progressPct={partialPct > 0 ? partialPct : undefined}
                progressLabel={
                  completed
                    ? "Дууссан ✓"
                    : partialLabel
                      ? `${partialLabel} үзсэн`
                      : undefined
                }
              />
            );
          })}
        </>
      )}
    </MobileAppShell>
  );
}
