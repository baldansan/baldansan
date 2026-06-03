"use client";
// components/lesson/modules/TextsModule.tsx
// "texts" модуль — богино эх (унших эх).
// Эх бүр: 汉字 эх + пиньинь (асаах/унтраах) + орчуулга (нуух/харах) + аудио + хурд.
// Аудио файл (text.audio) байвал ТҮҮНИЙГ, байхгүй бол хөтчийн хятад хоолойг (TTS).
// Модулийн гэрээ бусадтай ижил: { lesson, onDone }.

import { useCallback, useEffect, useRef, useState } from "react";
import type { Lesson, ShortText } from "@/types/lesson";
import "./texts-module.css";

type Speed = 0.5 | 0.75 | 1;
const SPEEDS: Speed[] = [0.5, 0.75, 1];

// audio_base_path + замыг нийлүүлж бүтэн зам/URL гаргана.
function audioUrl(base: string | undefined, path?: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const b = (base ?? "").replace(/\/+$/, "");
  const p = path.replace(/^\/+/, "");
  return b ? `${b}/${p}` : p;
}

export default function TextsModule({
  lesson,
  onDone,
}: {
  lesson: Lesson;
  onDone: () => void;
}) {
  const texts: ShortText[] = lesson.texts ?? [];
  const base = lesson.audio_base_path;

  const [ti, setTi] = useState(0); // аль эх
  const [speed, setSpeed] = useState<Speed>(1);
  const [playing, setPlaying] = useState(false);
  const [showPinyin, setShowPinyin] = useState(true);
  const [showMn, setShowMn] = useState(false); // орчуулга эхэндээ нуугдсан

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const text = texts[ti];
  const total = texts.length;

  // === Тоглуулагчийн удирдлага ===
  const stopAll = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setPlaying(false);
  }, []);

  const playFile = useCallback(
    (src: string) => {
      stopAll();
      const a = new Audio(src);
      a.playbackRate = speed;
      audioRef.current = a;
      setPlaying(true);
      const clear = () => setPlaying(false);
      a.onended = () => {
        if (audioRef.current === a) audioRef.current = null;
        clear();
      };
      a.onerror = clear;
      void a.play().catch(clear);
    },
    [speed, stopAll]
  );

  const playTTS = useCallback(
    (str: string) => {
      stopAll();
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      const u = new SpeechSynthesisUtterance(str);
      u.lang = "zh-CN";
      u.rate = speed;
      const zh = window.speechSynthesis
        .getVoices()
        .find((v) => v.lang?.toLowerCase().startsWith("zh"));
      if (zh) u.voice = zh;
      u.onend = () => setPlaying(false);
      u.onerror = () => setPlaying(false);
      setPlaying(true);
      window.speechSynthesis.speak(u);
    },
    [speed, stopAll]
  );

  function play() {
    if (playing) return stopAll();
    const src = audioUrl(base, text?.audio);
    if (src) playFile(src);
    else if (text) playTTS(text.zh);
  }

  function changeSpeed(s: Speed) {
    setSpeed(s);
    if (audioRef.current) audioRef.current.playbackRate = s;
  }

  function goPrev() {
    if (ti > 0) {
      stopAll();
      setShowMn(false);
      setTi(ti - 1);
    }
  }
  function goNext() {
    stopAll();
    setShowMn(false);
    if (ti < total - 1) setTi(ti + 1);
    else onDone();
  }

  useEffect(() => () => stopAll(), [stopAll]); // unmount cleanup

  if (!text) {
    return (
      <div className="bs-card">
        <div className="bs-soon">
          <div className="bs-soon-ic">📖</div>
          <p>Энэ хичээлд богино эх алга.</p>
        </div>
        <button className="bs-cta" onClick={onDone} style={{ marginTop: 4 }}>
          Дараагийнх →
        </button>
      </div>
    );
  }

  return (
    <div className="bs-card bs-txt">
      {/* Толгой */}
      <div className="bs-vtop">
        <div className="bs-label" style={{ margin: 0 }}>
          <span className="bs-dot" />
          Богино эх
        </div>
        <span className="bs-counter">
          {ti + 1} / {total}
        </span>
      </div>

      {/* Хяналт: хурд + сонсох */}
      <div className="bs-txt-bar">
        <div className="bs-speeds" role="group" aria-label="Тоглуулах хурд">
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              className={`bs-speed ${speed === s ? "bs-on" : ""}`}
              onClick={() => changeSpeed(s)}
              aria-pressed={speed === s}
            >
              {s}×
            </button>
          ))}
        </div>
        <button
          type="button"
          className={`bs-txt-play ${playing ? "bs-on" : ""}`}
          onClick={play}
          aria-label={playing ? "Зогсоох" : "Сонсох"}
        >
          <span aria-hidden>{playing ? "⏸" : "▶"}</span> {playing ? "Зогсоож байна" : "Сонсох"}
        </button>
      </div>

      {/* Эх */}
      <div className="bs-txt-body">
        <div className="bs-txt-zh">{text.zh}</div>
        {showPinyin && <div className="bs-txt-py">{text.pinyin}</div>}
        {showMn ? (
          <div className="bs-txt-mn">{text.mn}</div>
        ) : (
          <button type="button" className="bs-reveal" onClick={() => setShowMn(true)}>
            🇲🇳 Орчуулга харах
          </button>
        )}
      </div>

      {/* Тохиргоо */}
      <div className="bs-txt-toggles">
        <button
          type="button"
          className={`bs-tg ${showPinyin ? "bs-on" : ""}`}
          onClick={() => setShowPinyin((v) => !v)}
          aria-pressed={showPinyin}
        >
          Пиньинь {showPinyin ? "нуух" : "харах"}
        </button>
        {showMn && (
          <button
            type="button"
            className="bs-tg"
            onClick={() => setShowMn(false)}
          >
            Орчуулга нуух
          </button>
        )}
      </div>

      {/* Өмнөх / Дараагийнх */}
      <div className="bs-navrow">
        <button className="bs-navbtn" onClick={goPrev} disabled={ti === 0}>
          ← Өмнөх
        </button>
        <button className="bs-navbtn" onClick={goNext}>
          {ti === total - 1 ? "Дуусгах →" : "Дараагийнх →"}
        </button>
      </div>
    </div>
  );
}
