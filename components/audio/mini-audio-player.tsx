"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useGlobalAudio } from "@/components/providers/global-audio-provider";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import "./mini-audio-player.css";

function fmt(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const RATES = [0.75, 1, 1.25] as const;

/**
 * Доод талын жижиг тоглуулагч — хичээлийн аудио тоглож байхад л харагдана.
 * Хуудас солиход аудио тасрахгүй (төлөв нь lib/audio/global-audio-store-д).
 */
export function MiniAudioPlayer() {
  const locale = useUiLocale();
  const pathname = usePathname();
  const { state, resume, pause, stop, seek, setRate } = useGlobalAudio();
  const { track, status, currentTime, duration, rate } = state;

  // Админ/байгууллага/багшийн хэсэгт харуулахгүй — суралцагчийн тоглуулагч.
  if (!track || status === "idle") return null;
  if (
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/organization") ||
    pathname?.startsWith("/teacher")
  ) {
    return null;
  }

  const playing = status === "playing" || status === "loading";
  const pct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  const onSeek = (event: React.MouseEvent<HTMLDivElement>) => {
    if (duration <= 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    seek(ratio * duration);
  };

  const title = (
    <>
      <span className="bs-mini-title" translate="no">
        {track.title}
      </span>
      {track.subtitle ? (
        <span className="bs-mini-sub" translate="no">
          {track.subtitle}
        </span>
      ) : null}
    </>
  );

  return (
    <div
      className="bs-mini-player"
      role="region"
      aria-label={tr(locale, "Аудио тоглуулагч")}
      data-status={status}
    >
      <div className="bs-mini-bar" onClick={onSeek} aria-hidden>
        <i style={{ width: `${pct}%` }} />
      </div>
      <div className="bs-mini-row">
        <button
          type="button"
          className="bs-mini-btn bs-mini-btn--play"
          onClick={() => (playing ? pause() : void resume())}
          aria-label={playing ? tr(locale, "Зогсоох") : tr(locale, "Үргэлжлүүлэх")}
        >
          {status === "loading" ? (
            <span className="bs-mini-spin" aria-hidden />
          ) : playing ? (
            <svg viewBox="0 0 24 24" aria-hidden>
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M8 5.5v13l11-6.5z" />
            </svg>
          )}
        </button>

        {track.href && track.href !== pathname ? (
          <Link href={track.href} className="bs-mini-body">
            {title}
          </Link>
        ) : (
          <div className="bs-mini-body">{title}</div>
        )}

        <span className="bs-mini-time" aria-hidden>
          {fmt(currentTime)}
          {duration > 0 ? ` / ${fmt(duration)}` : ""}
        </span>

        <button
          type="button"
          className="bs-mini-rate"
          onClick={() => {
            const idx = RATES.indexOf(rate as (typeof RATES)[number]);
            const next = RATES[(idx + 1) % RATES.length] ?? 1;
            setRate(next);
          }}
          aria-label={tr(locale, "Тоглуулах хурд")}
        >
          {rate}×
        </button>

        <button
          type="button"
          className="bs-mini-btn bs-mini-btn--close"
          onClick={stop}
          aria-label={tr(locale, "Хаах")}
        >
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
