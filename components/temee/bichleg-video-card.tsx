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
}: Props) {
  const [coverFailed, setCoverFailed] = useState(false);
  const grad = THUMB_GRADS[thumbIndex % THUMB_GRADS.length];
  const showCover = coverUrl && !coverFailed;

  return (
    <Link href={href} className="bs-tm-video-card">
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
        <span className="bs-tm-video-play" aria-hidden>
          ▶
        </span>
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
              <i style={{ width: `${Math.min(100, progressPct)}%` }} />
            </div>
          </div>
        ) : null}
      </div>
    </Link>
  );
}
