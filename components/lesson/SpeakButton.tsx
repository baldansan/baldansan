"use client";
// components/lesson/SpeakButton.tsx
// Хятад текстийг дуудна: audio-cmn бичлэг → алдаа бол zh-CN TTS (удаан).

import { useCallback, useRef } from "react";
import { playChineseWordAudio } from "@/lib/tts/play-chinese-word-audio";

interface SpeakButtonProps {
  text: string;
  src?: string | null;
  large?: boolean;
  title?: string;
}

export default function SpeakButton({ text, src, large, title }: SpeakButtonProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback(() => {
    if (src) {
      try {
        if (!audioRef.current) audioRef.current = new Audio(src);
        else audioRef.current.src = src;
        audioRef.current.currentTime = 0;
        void audioRef.current.play().catch(() => {
          void playChineseWordAudio(text);
        });
        return;
      } catch {
        /* доош audio-cmn / TTS */
      }
    }
    void playChineseWordAudio(text);
  }, [text, src]);

  return (
    <button
      type="button"
      className={`bs-speak${large ? " bs-lg" : ""}`}
      onClick={speak}
      aria-label={title ?? "Дуудлага сонсох"}
    >
      🔊
    </button>
  );
}
