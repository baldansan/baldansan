"use client";
// components/lesson/SpeakButton.tsx
// Хятад текстийг дуудна. Хэрэв аудио файл (src) өгсөн бол түүнийг тоглуулна;
// үгүй бол хөтчийн өөрийн хятад дуу (Web Speech API) ашиглана.
// → Ингэснээр үгийн карт аудио файлгүйгээр ч шууд дуудлагатай болно.

import { useCallback, useRef } from "react";

interface SpeakButtonProps {
  text: string;           // дуудах хятад текст (汉字)
  src?: string | null;    // (заавал биш) бодит аудио файлын бүтэн зам/URL
  large?: boolean;
  title?: string;
}

export default function SpeakButton({ text, src, large, title }: SpeakButtonProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback(() => {
    // 1) Бодит аудио файл байвал түүнийг тоглуул
    if (src) {
      try {
        if (!audioRef.current) audioRef.current = new Audio(src);
        else audioRef.current.src = src;
        audioRef.current.currentTime = 0;
        void audioRef.current.play();
        return;
      } catch {
        /* доош TTS рүү шилжинэ */
      }
    }
    // 2) Үгүй бол хөтчийн хятад TTS
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "zh-CN";
      u.rate = 0.9;
      const zh = window.speechSynthesis
        .getVoices()
        .find((v) => v.lang.toLowerCase().startsWith("zh"));
      if (zh) u.voice = zh;
      window.speechSynthesis.speak(u);
    }
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
