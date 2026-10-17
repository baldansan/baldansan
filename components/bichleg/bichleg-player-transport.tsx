"use client";

import { BichlegSkipIcon } from "@/components/bichleg/bichleg-skip-icon";
import { BICHLEG_SKIP_SECONDS } from "@/lib/bichleg/player-seek";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { tr } from "@/lib/i18n/translate";

type Props = {
  isPlaying: boolean;
  onRewind: () => void;
  onTogglePlay: () => void;
  onForward: () => void;
  /** «◀ өгүүлбэр» / «▶ өгүүлбэр» — хадмал ачаалагдсан үед л харагдана. */
  onPrevSentence?: () => void;
  onNextSentence?: () => void;
};

function SentenceIcon({ dir }: { dir: "prev" | "next" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="bs-bichleg-sent-icon">
      {dir === "prev" ? (
        <path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z" />
      ) : (
        <path d="M16 6h2v12h-2V6zM6 18l8.5-6L6 6v12z" />
      )}
    </svg>
  );
}

export function BichlegPlayerTransport({
  isPlaying,
  onRewind,
  onTogglePlay,
  onForward,
  onPrevSentence,
  onNextSentence,
}: Props) {
  const locale = useUiLocale();
  const skipLabel = (dir: "back" | "fwd") =>
    `${BICHLEG_SKIP_SECONDS} ${tr(locale, dir === "back" ? "секунд ухраах" : "секунд урагшлуулах")}`;
  return (
    <div
      className="bs-bichleg-transport"
      role="group"
      aria-label={tr(locale, "Тоглуулагч")}
    >
      {onPrevSentence ? (
        <button
          type="button"
          className="bs-bichleg-transport-btn bs-bichleg-transport-btn--sent"
          aria-label={tr(locale, "Өмнөх өгүүлбэр")}
          title={tr(locale, "Өмнөх өгүүлбэр")}
          onClick={onPrevSentence}
        >
          <SentenceIcon dir="prev" />
        </button>
      ) : null}
      <button
        type="button"
        className="bs-bichleg-transport-btn"
        aria-label={skipLabel("back")}
        onClick={onRewind}
      >
        <BichlegSkipIcon direction="back" className="bs-bichleg-skip-icon" />
      </button>
      <button
        type="button"
        className="bs-bichleg-transport-btn bs-bichleg-transport-btn--play"
        aria-label={tr(locale, isPlaying ? "Зогсоох" : "Тоглуулах")}
        onClick={onTogglePlay}
      >
        {isPlaying ? (
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M7 6h4v12H7V6zm6 0h4v12h-4V6z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M8 5v14l11-7L8 5z" />
          </svg>
        )}
      </button>
      <button
        type="button"
        className="bs-bichleg-transport-btn"
        aria-label={skipLabel("fwd")}
        onClick={onForward}
      >
        <BichlegSkipIcon direction="forward" className="bs-bichleg-skip-icon" />
      </button>
      {onNextSentence ? (
        <button
          type="button"
          className="bs-bichleg-transport-btn bs-bichleg-transport-btn--sent"
          aria-label={tr(locale, "Дараагийн өгүүлбэр")}
          title={tr(locale, "Дараагийн өгүүлбэр")}
          onClick={onNextSentence}
        >
          <SentenceIcon dir="next" />
        </button>
      ) : null}
    </div>
  );
}
