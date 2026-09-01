"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  /** Absolute audio URL (quiz_questions.audio_url). */
  audioUrl: string;
  /** Compact inline variant next to the question text. */
  size?: "md" | "lg";
  className?: string;
};

/**
 * Listening-question play button. Plays the clip from the start on each tap;
 * tapping while playing stops it. Learners can replay as many times as needed.
 */
export function QuizAudioButton({ audioUrl, size = "lg", className }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlaying(false);
  }, []);

  // Unmount: pause without touching state. Render with key={audioUrl} so a
  // question change remounts the button and stops the previous clip.
  useEffect(
    () => () => {
      audioRef.current?.pause();
      audioRef.current = null;
    },
    []
  );

  const toggle = useCallback(() => {
    if (playing) {
      stop();
      return;
    }
    stop();
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    setPlaying(true);
    setFailed(false);
    audio.onended = () => {
      if (audioRef.current === audio) audioRef.current = null;
      setPlaying(false);
    };
    audio.onerror = () => {
      if (audioRef.current === audio) audioRef.current = null;
      setPlaying(false);
      setFailed(true);
    };
    void audio.play().catch(() => {
      if (audioRef.current === audio) audioRef.current = null;
      setPlaying(false);
      setFailed(true);
    });
  }, [audioUrl, playing, stop]);

  const sizeClass =
    size === "lg"
      ? "min-h-[48px] w-full justify-center gap-2 rounded-xl px-4 text-sm font-semibold"
      : "min-h-[36px] gap-1.5 rounded-full px-3 text-xs font-semibold";

  return (
    <div className={className}>
      <button
        type="button"
        onClick={toggle}
        className={`inline-flex items-center ${sizeClass} ${
          playing
            ? "bg-emerald-600 text-white ring-2 ring-emerald-300"
            : "bg-emerald-500 text-white hover:bg-emerald-600"
        }`}
        aria-label={playing ? "Аудио зогсоох" : "Аудио сонсох"}
        aria-pressed={playing}
      >
        <span aria-hidden>{playing ? "⏸" : "🔊"}</span>
        {playing ? "Зогсоох" : "Сонсох"}
      </button>
      {failed ? (
        <p className="mt-1 text-xs text-amber-700">
          Аудио ачаалж чадсангүй — дахин оролдоно уу.
        </p>
      ) : null}
    </div>
  );
}
