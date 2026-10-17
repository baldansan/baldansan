"use client";

import Link from "next/link";
import { TemeeEmojiIcon } from "@/components/temee/temee-emoji-icon";
import { BichlegVideoCard } from "@/components/temee/bichleg-video-card";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { SHELL_MAIN_NARROW } from "@/lib/app-shell-classes";
import { formatEpisodeListTitle } from "@/lib/bichleg/episode-label";
import {
  episodeWatchHref,
  formatResumeLabel,
  pickGlobalContinueSeries,
  sortSeriesByContinue,
  type SeriesWatchProgressDetail,
} from "@/lib/bichleg/episode-progress";
import { seriesCoverInitial } from "@/lib/bichleg/series-cover";
import { resolveSeriesThumbnailUrl } from "@/lib/bichleg/series-thumbnail";
import { youtubeThumbUrl } from "@/lib/bichleg/youtube-thumb";
import type { VideoSeriesCard } from "@/lib/bichleg/types";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { tr } from "@/lib/i18n/translate";
import { MediaTabs } from "@/components/songs/media-tabs";

type Props = {
  seriesList: VideoSeriesCard[];
  orphanCount: number;
  seriesProgress?: Record<string, SeriesWatchProgressDetail>;
  /** false (зочин) бол явцын UI огт харуулахгүй. */
  loggedIn?: boolean;
};

export function BichlegSeriesPickerClient({
  seriesList,
  orphanCount,
  seriesProgress = {},
  loggedIn = false,
}: Props) {
  const locale = useUiLocale();
  const showProgress = loggedIn;

  const orderedSeries = showProgress
    ? sortSeriesByContinue(seriesList, seriesProgress)
    : seriesList;

  const globalContinue = showProgress ? pickGlobalContinueSeries(seriesProgress) : null;
  const continueSeries = globalContinue
    ? seriesList.find((s) => s.id === globalContinue.seriesId) ?? null
    : null;
  const continueTarget = globalContinue?.target ?? null;
  const continuePct =
    continueTarget && continueTarget.kind === "resume" && continueTarget.duration_sec
      ? Math.min(
          99,
          Math.max(1, Math.round((continueTarget.watchedSec / continueTarget.duration_sec) * 100))
        )
      : 0;
  const continueKicker =
    continueTarget?.kind === "resume"
      ? tr(locale, "Үргэлжлүүлэх")
      : continueTarget?.kind === "next"
        ? tr(locale, "Дараагийн анги")
        : tr(locale, "Эхлэх");
  const continueThumb = continueTarget ? youtubeThumbUrl(continueTarget.youtube_id) : null;

  return (
    <MobileAppShell activeTab="clips" mainClassName={SHELL_MAIN_NARROW} desktopWidth="wide">
      <h1 className="bs-tm-page-title bs-page-in">{tr(locale, "Дуу ба бичлэг")}</h1>
      <MediaTabs active="videos" />

      <div className="bs-tm-bichleg-greet">
        <TemeeEmojiIcon
          variant="bichleg"
          className="bs-tm-bichleg-greet-img"
          width={72}
          height={72}
        />
        <div>
          <p className="bs-tm-bichleg-greet-title">
            {tr(locale, "Өнөөдөр юу үзэх вэ? 📺")}
          </p>
          <p className="bs-tm-bichleg-greet-sub">
            {tr(locale, "Тэмээ багштай хамт хятад контент үзээрэй")}
          </p>
        </div>
      </div>

      {continueTarget && continueSeries ? (
        <Link
          href={episodeWatchHref(
            continueSeries.id,
            continueTarget.videoId,
            continueTarget.kind === "resume" ? continueTarget.watchedSec : 0
          )}
          className="bs-tm-continue bs-tm-continue--bichleg mb-4"
        >
          {continueThumb ? (
            <span className="bs-tm-continue-thumb" aria-hidden>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={continueThumb} alt="" loading="lazy" decoding="async" />
              <span className="bs-tm-continue-thumb-play">▶</span>
            </span>
          ) : (
            <span className="bs-tm-continue-ic" aria-hidden>
              ▶
            </span>
          )}
          <span className="min-w-0 flex-1">
            <p className="bs-tm-continue-kicker">
              {continueKicker} · {continueSeries.title_mn ?? continueSeries.title_zh ?? continueSeries.id}
            </p>
            <p className="bs-tm-continue-title" translate="no">
              {formatEpisodeListTitle(continueTarget.episode_no, continueTarget.title_mn)}
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

      {seriesList.length === 0 && orphanCount === 0 ? (
        <div className="bs-bichleg-pick-empty">
          <p className="text-sm font-bold text-[var(--app-text)]">
            {tr(locale, "Бичлэг олдсонгүй")}
          </p>
          <p className="mt-2 text-xs text-[var(--app-muted)]">
            {tr(locale, "Админ импорт эсвэл")} <code>npm run load:videos</code>{" "}
            {tr(locale, "ашиглана уу.")}
          </p>
        </div>
      ) : (
        <div className="bs-tm-bichleg-list bs-stagger">
          {orderedSeries.map((series, index) => {
            const titleMn = series.title_mn ?? series.title_zh ?? series.id;
            const progress = seriesProgress[series.id];
            const watchedCount = progress?.watchedCount ?? 0;
            const totalCount = Math.max(progress?.totalCount ?? 0, series.videoCount);
            const pct =
              totalCount > 0
                ? Math.min(100, Math.round((watchedCount / totalCount) * 100))
                : 0;
            const allDone = showProgress && totalCount > 0 && watchedCount >= totalCount;
            const isContinue =
              showProgress && progress?.continueTarget?.kind === "resume";
            const progressLabel = !showProgress
              ? undefined
              : allDone
                ? `${watchedCount}/${totalCount} ${tr(locale, "анги үзсэн")} ✓`
                : `${watchedCount}/${totalCount} ${tr(locale, "анги үзсэн")}`;

            return (
              <BichlegVideoCard
                key={series.id}
                href={`/bichleg/${encodeURIComponent(series.id)}`}
                layout="catalog"
                titleMn={titleMn}
                titleZh={series.title_zh}
                hanzi={seriesCoverInitial(series.title_zh)}
                thumbIndex={index}
                coverUrl={resolveSeriesThumbnailUrl(series)}
                episodeBadge={`${series.videoCount} ${tr(locale, "анги")}`}
                hskLevel={series.hsk_level}
                showProgressBar={showProgress}
                progressPct={pct}
                progressLabel={progressLabel}
                progressDone={allDone}
                accentLabel={isContinue ? tr(locale, "Үргэлжлүүлэх") : undefined}
              />
            );
          })}
          {orphanCount > 0 ? (
            <BichlegVideoCard
              href="/bichleg/other"
              layout="catalog"
              titleMn={tr(locale, "Бусад бичлэг")}
              titleZh="其他视频"
              hanzi="其"
              thumbIndex={seriesList.length}
              episodeBadge={`${orphanCount} ${tr(locale, "анги")}`}
            />
          ) : null}
        </div>
      )}
    </MobileAppShell>
  );
}
