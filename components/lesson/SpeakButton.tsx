"use client";
// components/lesson/SpeakButton.tsx
// Хятад текстийг дуудна: audio-cmn бичлэг → алдаа бол zh-CN TTS (удаан).
// Аль нь ч болохгүй бол 🔇 + тайлбар харуулна (чимээгүй унтрахгүй).

import { useCallback, useRef, useState } from "react";
import { playChineseWordAudio } from "@/lib/tts/play-chinese-word-audio";

interface SpeakButtonProps {
  text: string;
  src?: string | null;
  large?: boolean;
  title?: string;
}

const FAIL_MESSAGE =
  "Дуу гаргаж чадсангүй — Safari/Chrome хөтчөөр нээгээд үзээрэй (WeChat доторх хөтөч дуу дэмждэггүй). 无法播放 — 请用 Safari/Chrome 打开（微信内置浏览器不支持发音）。";

export default function SpeakButton({ text, src, large, title }: SpeakButtonProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [failed, setFailed] = useState(false);

  const handleFail = useCallback(() => {
    setFailed(true);
    window.setTimeout(() => setFailed(false), 4000);
  }, []);

  const speakViaChain = useCallback(async () => {
    const result = await playChineseWordAudio(text);
    if (!result.ok) handleFail();
  }, [text, handleFail]);

  const speak = useCallback(() => {
    setFailed(false);
    if (src) {
      try {
        if (!audioRef.current) audioRef.current = new Audio(src);
        else audioRef.current.src = src;
        audioRef.current.currentTime = 0;
        void audioRef.current.play().catch(() => {
          void speakViaChain();
        });
        return;
      } catch {
        /* доош audio-cmn / TTS */
      }
    }
    void speakViaChain();
  }, [src, speakViaChain]);

  return (
    <button
      type="button"
      className={`bs-speak${large ? " bs-lg" : ""}`}
      onClick={speak}
      aria-label={failed ? FAIL_MESSAGE : (title ?? "Дуудлага сонсох")}
      title={failed ? FAIL_MESSAGE : title}
    >
      {failed ? "🔇" : "🔊"}
    </button>
  );
}
