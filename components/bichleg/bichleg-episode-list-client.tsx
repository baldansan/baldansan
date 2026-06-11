"use client";

import Link from "next/link";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobilePageHeader } from "@/components/mobile/mobile-page-header";
import {
  formatEpisodeListTitle,
  formatSeriesHeaderMeta,
} from "@/lib/bichleg/episode-label";
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

function EpisodeRow({
  seriesId,
  episode,
  index,
  completed,
}: {
  seriesId: string;
  episode: VideoEpisodeItem;
  index: number;
  completed: boolean;
}) {
  const label = formatEpisodeListTitle(episode.episode_no, episode.title_mn);
  const displayNo =
    episode.episode_no != null && Number.isFinite(episode.episode_no)
      ? episode.episode_no
      : index + 1;

  return (
    <Link href={episodeHref(seriesId, episode.id)} className="bs-bichleg-ep-row">
      <div className="bs-bichleg-ep-rail">
        <div
          className={`app-timeline-node ${
            completed ? "bs-bichleg-ep-node--done" : "app-timeline-node-next"
          }`}
        >
          {completed ? "✓" : displayNo}
        </div>
        <div className="bs-bichleg-ep-rail-line" aria-hidden />
      </div>
      <div className="bs-bichleg-ep-body">
        <p className="bs-bichleg-ep-title">{label}</p>
        {episode.subtitleCount > 0 ? (
          <p className="bs-bichleg-ep-meta">{episode.subtitleCount} мөр</p>
        ) : null}
      </div>
      <span className="bs-bichleg-ep-chevron" aria-hidden>
        ›
      </span>
    </Link>
  );
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

  return (
    <MobileAppShell activeTab="clips" mainClassName="max-w-[390px] mx-auto w-full">
      <Link href="/bichleg" className="bs-mem-back">
        ← Цуврал сонгох
      </Link>
      <MobilePageHeader title={titleMn} subtitle={headerMeta} />

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
        <div className="bs-bichleg-ep-list">
          {episodes.map((episode, index) => (
            <EpisodeRow
              key={episode.id}
              seriesId={seriesId}
              episode={episode}
              index={index}
              completed={Boolean(progressByVideoId[episode.id]?.completed)}
            />
          ))}
        </div>
      )}
    </MobileAppShell>
  );
}
