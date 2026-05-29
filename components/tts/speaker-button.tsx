"use client";

import { useCallback, useEffect, useId, useState } from "react";
import {
  playAudioUrl,
  speakWithSavedSettings,
  stopPronunciation,
} from "@/lib/tts/play-pronunciation";
import { isSpeechSupported, TTS_UNAVAILABLE_MESSAGE } from "@/lib/tts/speech";
import { resolveTtsLang } from "@/lib/tts/infer-lang";

type SpeakerSize = "sm" | "md" | "lg";

type Props = {
  text: string;
  lang?: string;
  courseId?: string;
  hskLevel?: string;
  audioUrl?: string;
  size?: SpeakerSize;
  label?: string;
  className?: string;
};

const sizeClasses: Record<SpeakerSize, string> = {
  sm: "h-9 w-9",
  md: "h-10 w-10",
  lg: "h-11 w-11",
};

const iconSizes: Record<SpeakerSize, string> = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-5 w-5",
};

function SpeakerIcon({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18 6a8.5 8.5 0 0 1 0 12" />
    </svg>
  );
}

export function SpeakerButton({
  text,
  lang,
  courseId,
  hskLevel,
  audioUrl,
  size = "sm",
  label,
  className = "",
}: Props) {
  const buttonId = useId();
  const resolvedLang = resolveTtsLang({ lang, courseId, hskLevel });
  const [state, setState] = useState<"idle" | "loading" | "speaking" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      stopPronunciation();
    };
  }, []);

  const handleClick = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setState("loading");
    setErrorMessage(null);
    stopPronunciation();

    const audio = audioUrl?.trim();
    if (audio) {
      const audioResult = await playAudioUrl(audio);
      if (audioResult.ok) {
        setState("idle");
        return;
      }
    }

    if (!isSpeechSupported()) {
      setState("error");
      setErrorMessage(TTS_UNAVAILABLE_MESSAGE);
      return;
    }

    setState("speaking");
    const result = await speakWithSavedSettings(trimmed, resolvedLang);
    if (result.ok) {
      setState("idle");
      return;
    }

    setState("error");
    setErrorMessage(result.error ?? TTS_UNAVAILABLE_MESSAGE);
  }, [audioUrl, resolvedLang, text]);

  const ariaLabel = label ?? `Уншуулах: ${text}`;

  return (
    <span className="inline-flex flex-col items-center">
      <button
        id={buttonId}
        type="button"
        onClick={() => {
          void handleClick();
        }}
        aria-label={ariaLabel}
        title={ariaLabel}
        className={`inline-flex shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:opacity-60 ${sizeClasses[size]} ${
          state === "speaking"
            ? "bg-blue-600 text-white ring-2 ring-blue-300"
            : state === "error"
              ? "bg-red-50 text-red-700 ring-1 ring-red-200"
              : "bg-blue-50 text-blue-700 ring-1 ring-blue-200 hover:bg-blue-100 active:bg-blue-200"
        } ${className}`}
        disabled={state === "loading"}
      >
        {state === "loading" ? (
          <span className="h-4 w-4 animate-pulse rounded-full bg-current opacity-60" />
        ) : (
          <SpeakerIcon className={iconSizes[size]} />
        )}
      </button>
      {errorMessage ? (
        <span className="mt-1 max-w-[9rem] text-center text-[10px] leading-tight text-red-600">
          {errorMessage}
        </span>
      ) : null}
    </span>
  );
}
