"use client";

import Link from "next/link";
import { TemeeEmojiIcon } from "@/components/temee/temee-emoji-icon";
import { BichlegVideoCard } from "@/components/temee/bichleg-video-card";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { SHELL_MAIN_NARROW } from "@/lib/app-shell-classes";
import { seriesCoverInitial } from "@/lib/bichleg/series-cover";
import { resolveSeriesThumbnailUrl } from "@/lib/bichleg/series-thumbnail";
import type { SeriesWatchProgress, VideoSeriesCard } from "@/lib/bichleg/types";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { tr } from "@/lib/i18n/translate";

type Props = {
  seriesList: VideoSeriesCard[];
  orphanCount: number;
  seriesProgress?: Record<string, SeriesWatchProgress>;
};

export function BichlegSeriesPickerClient({
  seriesList,
  orphanCount,
  seriesProgress = {},
}: Props) {
  const locale = useUiLocale();
  return (
    <MobileAppShell activeTab="clips" mainClassName={SHELL_MAIN_NARROW}>
      <h1 className="bs-tm-page-title">{tr(locale, "Бичлэг")}</h1>

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
        <div className="bs-tm-bichleg-list">
          {seriesList.map((series, index) => {
            const titleMn = series.title_mn ?? series.title_zh ?? series.id;
            const progress = seriesProgress[series.id];
            const watchedCount = progress?.watchedCount ?? 0;
            const totalCount = progress?.totalCount ?? series.videoCount;
            const pct =
              totalCount > 0
                ? Math.min(100, Math.round((watchedCount / totalCount) * 100))
                : 0;

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
                showProgressBar
                progressPct={pct}
                progressLabel={`${watchedCount}/${totalCount} ${tr(locale, "анги үзсэн")}`}
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
