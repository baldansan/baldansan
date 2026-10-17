"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import type { VideoSubtitleRow } from "@/lib/bichleg/types";
import { findActiveSubtitle } from "@/lib/bichleg/subtitle-offset";
import { clampPlaybackTime, formatSubtitleClock } from "@/lib/bichleg/player-seek";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { tr } from "@/lib/i18n/translate";

type Props = {
  currentTime: number;
  duration: number;
  /** Нийт үзсэн оргил (статистик) — цайвар дүүргэлт. */
  watchedSec?: number;
  subtitles: VideoSubtitleRow[];
  totalOffsetSec: number;
  /** Гаднаас (видео дээр хэвтээ шудрах) ирсэн урьдчилан харах цаг. */
  previewSec?: number | null;
  onSeek: (sec: number) => void;
  onScrubChange?: (scrubbing: boolean) => void;
  /** Гар: ←/→ алхам (секунд). */
  keyStepSec?: number;
};

export function BichlegSeekBar({
  currentTime,
  duration,
  watchedSec = 0,
  subtitles,
  totalOffsetSec,
  previewSec = null,
  onSeek,
  onScrubChange,
  keyStepSec = 5,
}: Props) {
  const locale = useUiLocale();
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragSec, setDragSec] = useState<number | null>(null);
  const draggingRef = useRef(false);

  const secFromClientX = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track || duration <= 0) return 0;
      const rect = track.getBoundingClientRect();
      const ratio = rect.width > 0 ? (clientX - rect.left) / rect.width : 0;
      return clampPlaybackTime(ratio * duration, duration);
    },
    [duration]
  );

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (duration <= 0) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    draggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragSec(secFromClientX(e.clientX));
    onScrubChange?.(true);
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    e.preventDefault();
    setDragSec(secFromClientX(e.clientX));
  }

  function finishDrag(e: PointerEvent<HTMLDivElement>, commit: boolean) {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    const target = secFromClientX(e.clientX);
    setDragSec(null);
    onScrubChange?.(false);
    if (commit) onSeek(target);
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (duration <= 0) return;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const delta = e.key === "ArrowLeft" ? -keyStepSec : keyStepSec;
      onSeek(clampPlaybackTime(currentTime + delta, duration));
    } else if (e.key === "Home") {
      e.preventDefault();
      onSeek(0);
    } else if (e.key === "End") {
      e.preventDefault();
      onSeek(duration);
    }
  }

  useEffect(() => {
    return () => {
      if (draggingRef.current) onScrubChange?.(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shownSec = dragSec ?? previewSec ?? null;
  const headSec = shownSec ?? currentTime;
  const pct = duration > 0 ? Math.min(100, Math.max(0, (headSec / duration) * 100)) : 0;
  const watchedPct =
    duration > 0 ? Math.min(100, Math.max(0, (watchedSec / duration) * 100)) : 0;
  const tooltipSub =
    shownSec != null ? findActiveSubtitle(subtitles, shownSec, totalOffsetSec) : null;

  return (
    <div className="bs-bichleg-seek" data-scrubbing={shownSec != null ? "1" : undefined}>
      <span className="bs-bichleg-seek-time" aria-hidden>
        {formatSubtitleClock(headSec)}
      </span>
      <div
        ref={trackRef}
        className="bs-bichleg-seek-track"
        role="slider"
        tabIndex={0}
        aria-label={tr(locale, "Цаг сонгох")}
        aria-valuemin={0}
        aria-valuemax={Math.max(0, Math.round(duration))}
        aria-valuenow={Math.round(headSec)}
        aria-valuetext={formatSubtitleClock(headSec)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(e) => finishDrag(e, true)}
        onPointerCancel={(e) => finishDrag(e, false)}
        onKeyDown={onKeyDown}
      >
        <div className="bs-bichleg-seek-rail" />
        <div className="bs-bichleg-seek-watched" style={{ width: `${watchedPct}%` }} />
        <div className="bs-bichleg-seek-fill" style={{ width: `${pct}%` }} />
        <div className="bs-bichleg-seek-thumb" style={{ left: `${pct}%` }} />
        {shownSec != null ? (
          <div
            className="bs-bichleg-seek-tip"
            style={{ left: `${Math.min(78, Math.max(22, pct))}%` }}
            translate="no"
            aria-hidden
          >
            <span className="bs-bichleg-seek-tip-time">{formatSubtitleClock(shownSec)}</span>
            {tooltipSub?.zh ? (
              <span className="bs-bichleg-seek-tip-zh hanzi">{tooltipSub.zh}</span>
            ) : null}
            {tooltipSub?.mn ? (
              <span className="bs-bichleg-seek-tip-mn">{tooltipSub.mn}</span>
            ) : null}
          </div>
        ) : null}
      </div>
      <span className="bs-bichleg-seek-time" aria-hidden>
        {formatSubtitleClock(duration)}
      </span>
    </div>
  );
}
