"use client";

import Link from "next/link";
import { useState } from "react";

const THUMB_GRADS = [
  "linear-gradient(145deg, #4d9fff 0%, #2563eb 100%)",
  "linear-gradient(145deg, #ff8a3d 0%, #e65c2e 100%)",
  "linear-gradient(145deg, #9b6bff 0%, #6d28d9 100%)",
  "linear-gradient(145deg, #1fb85a 0%, #0e9c47 100%)",
  "linear-gradient(145deg, #ff6b9d 0%, #db2777 100%)",
];

type Props = {
  href: string;
  titleMn: string;
  titleZh?: string | null;
  hanzi: string;
  thumbIndex?: number;
  coverUrl?: string | null;
  episodeBadge?: string;
  hskLevel?: number | null;
  progressPct?: number;
  progressLabel?: string;
  /** Catalog row for series picker; stack for episode list. */
  layout?: "catalog" | "stack";
  showProgressBar?: boolean;
};

export function BichlegVideoCard({
  href,
  titleMn,
  titleZh,
  hanzi,
  thumbIndex = 0,
  coverUrl,
  episodeBadge,
  hskLevel,
  progressPct,
  progressLabel,
  layout = "stack",
  showProgressBar = false,
}: Props) {
  const [coverFailed, setCoverFailed] = useState(false);
  const grad = THUMB_GRADS[thumbIndex % THUMB_GRADS.length];
  const showCover = coverUrl && !coverFailed;
  const pct =
    progressPct != null ? Math.min(100, Math.max(0, progressPct)) : 0;
  const isCatalog = layout === "catalog";

  if (isCatalog) {
    return (
      <Link
        href={href}
        className="bs-tm-video-card bs-tm-video-card--catalog"
      >
        <div className="bs-tm-video-row">
          <div
            className="bs-tm-video-thumb-sm"
            style={showCover ? undefined : { background: grad }}
          >
            {showCover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverUrl}
                alt=""
                className="bs-tm-video-thumb-img"
                onError={() => setCoverFailed(true)}
              />
            ) : (
              <span className="bs-tm-video-hanzi hanzi" aria-hidden>
                {hanzi}
              </span>
            )}
          </div>
          <div className="bs-tm-video-info">
            <p className="bs-tm-video-title">{titleMn}</p>
            {titleZh ? (
              <p className="bs-tm-video-zh hanzi">{titleZh}</p>
            ) : null}
            <div className="bs-tm-video-tags">
              {episodeBadge ? (
                <span className="bs-tm-video-tag">{episodeBadge}</span>
              ) : null}
              {hskLevel != null ? (
                <span className="bs-tm-video-tag bs-tm-video-tag--hsk">
                  HSK {hskLevel}
                </span>
              ) : null}
            </div>
          </div>
          <span className="bs-tm-video-chev" aria-hidden>›</span>
        </div>
        {showProgressBar && progressLabel ? (
          <div className="bs-tm-video-progress">
            <p className="bs-tm-video-progress-label">{progressLabel}</p>
            <div className="bs-tm-video-progress-track">
              <i style={{ width: `${pct}%` }} />
            </div>
          </div>
        ) : null}
      </Link>
    );
  }

  return (
    <Link href={href} className="bs-tm-video-card bs-tm-video-card--stack">
      <div
        className="bs-tm-video-thumb"
        style={showCover ? undefined : { background: grad }}
      >
        {showCover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt=""
            className="bs-tm-video-thumb-img"
            onError={() => setCoverFailed(true)}
          />
        ) : (
          <span className="bs-tm-video-hanzi hanzi" aria-hidden>
            {hanzi}
          </span>
        )}
        <span className="bs-tm-video-play" aria-hidden>▶</span>
      </div>
      <div className="bs-tm-video-body">
        <p className="bs-tm-video-title">{titleMn}</p>
        {titleZh ? (
          <p className="bs-tm-video-zh hanzi">{titleZh}</p>
        ) : null}
        <div className="bs-tm-video-tags">
          {episodeBadge ? (
            <span className="bs-tm-video-tag">{episodeBadge}</span>
          ) : null}
          {hskLevel != null ? (
            <span className="bs-tm-video-tag bs-tm-video-tag--hsk">
              HSK {hskLevel}
            </span>
          ) : null}
        </div>
        {progressPct != null && progressPct > 0 ? (
          <div className="bs-tm-video-progress">
            {progressLabel ? (
              <p className="bs-tm-video-progress-label">{progressLabel}</p>
            ) : null}
            <div className="bs-tm-video-progress-track">
              <i style={{ width: `${pct}%` }} />
            </div>
          </div>
        ) : null}
      </div>
    </Link>
  );
}
