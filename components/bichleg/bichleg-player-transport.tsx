"use client";

import { BichlegSkipIcon } from "@/components/bichleg/bichleg-skip-icon";

type Props = {
  isPlaying: boolean;
  onRewind: () => void;
  onTogglePlay: () => void;
  onForward: () => void;
};

export function BichlegPlayerTransport({
  isPlaying,
  onRewind,
  onTogglePlay,
  onForward,
}: Props) {
  return (
    <div className="bs-bichleg-transport" role="group" aria-label="Тоглуулагч">
      <button
        type="button"
        className="bs-bichleg-transport-btn"
        aria-label="3 секунд ухраах"
        onClick={onRewind}
      >
        <BichlegSkipIcon direction="back" className="bs-bichleg-skip-icon" />
      </button>
      <button
        type="button"
        className="bs-bichleg-transport-btn bs-bichleg-transport-btn--play"
        aria-label={isPlaying ? "Зогсоох" : "Тоглуулах"}
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
        aria-label="3 секунд урагшлуулах"
        onClick={onForward}
      >
        <BichlegSkipIcon direction="forward" className="bs-bichleg-skip-icon" />
      </button>
    </div>
  );
}
