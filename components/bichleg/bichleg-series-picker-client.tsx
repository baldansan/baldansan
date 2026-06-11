"use client";

import Link from "next/link";
import { useState } from "react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobilePageHeader } from "@/components/mobile/mobile-page-header";
import { seriesCoverInitial } from "@/lib/bichleg/series-cover";
import type { VideoSeriesCard } from "@/lib/bichleg/types";

type Props = {
  seriesList: VideoSeriesCard[];
  orphanCount: number;
};

function SeriesCoverArt({
  coverUrl,
  titleZh,
  alt,
}: {
  coverUrl: string | null;
  titleZh: string | null;
  alt: string;
}) {
  const [failed, setFailed] = useState(false);

  if (coverUrl && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={coverUrl}
        alt={alt}
        className="bs-bichleg-series-cover-img"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div className="bs-bichleg-series-cover-placeholder hanzi" aria-hidden>
      {seriesCoverInitial(titleZh)}
    </div>
  );
}

function SeriesPickerCard({ series }: { series: VideoSeriesCard }) {
  const titleMn = series.title_mn ?? series.title_zh ?? series.id;
  return (
    <Link
      href={`/bichleg/${encodeURIComponent(series.id)}`}
      className="bs-bichleg-series-card"
    >
      <SeriesCoverArt
        coverUrl={series.cover_url}
        titleZh={series.title_zh}
        alt={titleMn}
      />
      <div className="bs-bichleg-series-card-body">
        <h2 className="bs-bichleg-series-card-title">{titleMn}</h2>
        {series.title_zh ? (
          <p className="bs-bichleg-series-card-sub hanzi">{series.title_zh}</p>
        ) : null}
        <div className="bs-bichleg-series-card-meta">
          <span className="bs-bichleg-series-card-badge">
            {series.videoCount} анги
          </span>
          {series.hsk_level != null ? (
            <span className="bs-bichleg-series-card-hsk">
              HSK {series.hsk_level}
            </span>
          ) : null}
        </div>
      </div>
      <span className="bs-bichleg-series-card-chevron" aria-hidden>
        ›
      </span>
    </Link>
  );
}

export function BichlegSeriesPickerClient({ seriesList, orphanCount }: Props) {
  return (
    <MobileAppShell activeTab="clips" mainClassName="max-w-[390px] mx-auto w-full">
      <MobilePageHeader title="Бичлэг" subtitle="Юу үзэх вэ?" />

      {seriesList.length === 0 && orphanCount === 0 ? (
        <div className="bs-bichleg-pick-empty">
          <p className="text-sm font-bold text-[var(--app-text)]">
            Бичлэг олдсонгүй
          </p>
          <p className="mt-2 text-xs text-[var(--app-muted)]">
            Админ импорт эсвэл <code>npm run load:videos</code> ашиглана уу.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {seriesList.map((series) => (
            <SeriesPickerCard key={series.id} series={series} />
          ))}
          {orphanCount > 0 ? (
            <Link href="/bichleg/other" className="bs-bichleg-series-card">
              <div className="bs-bichleg-series-cover-placeholder bs-bichleg-series-cover-placeholder--other">
                ···
              </div>
              <div className="bs-bichleg-series-card-body">
                <h2 className="bs-bichleg-series-card-title">Бусад бичлэг</h2>
                <p className="bs-bichleg-series-card-sub">
                  Цувралд хамаарахгүй бичлэгүүд
                </p>
                <div className="bs-bichleg-series-card-meta">
                  <span className="bs-bichleg-series-card-badge">
                    {orphanCount} анги
                  </span>
                </div>
              </div>
              <span className="bs-bichleg-series-card-chevron" aria-hidden>
                ›
              </span>
            </Link>
          ) : null}
        </div>
      )}
    </MobileAppShell>
  );
}
