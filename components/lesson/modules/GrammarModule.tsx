"use client";
// components/lesson/modules/GrammarModule.tsx
// "grammar" модуль — нэг дүрэм, нэг дэлгэц.
// Дүрмийн загвар (point) + богино утга (gloss_mn) + багшийн тайлбар (teacher_mn)
// + жишээнүүд. Жишээ бүрийг хөтчийн хятад хоолойгоор (TTS) сонсоно, хурд тохируулна.
// Модулийн гэрээ бусадтай ижил: { lesson, onDone }.

import { useCallback, useEffect, useState } from "react";
import type { Lesson, GrammarPoint } from "@/types/lesson";
import "./grammar-module.css";

type Speed = 0.5 | 0.75 | 1;
const SPEEDS: Speed[] = [0.5, 0.75, 1];

export default function GrammarModule({
  lesson,
  onDone,
}: {
  lesson: Lesson;
  onDone: () => void;
}) {
  const points: GrammarPoint[] = lesson.grammar ?? [];

  const [gi, setGi] = useState(0); // аль дүрэм
  const [speed, setSpeed] = useState<Speed>(1);
  const [playing, setPlaying] = useState<string | null>(null);

  const point = points[gi];
  const total = points.length;

  // === Тоглуулагч (зөвхөн TTS — жишээнд аудио файл байхгүй) ===
  const stopAll = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setPlaying(null);
  }, []);

  const playTTS = useCallback(
    (key: string, str: string) => {
      stopAll();
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      const u = new SpeechSynthesisUtterance(str);
      u.lang = "zh-CN";
      u.rate = speed;
      const zh = window.speechSynthesis
        .getVoices()
        .find((v) => v.lang?.toLowerCase().startsWith("zh"));
      if (zh) u.voice = zh;
      const clear = () => setPlaying((p) => (p === key ? null : p));
      u.onend = clear;
      u.onerror = clear;
      setPlaying(key);
      window.speechSynthesis.speak(u);
    },
    [speed, stopAll]
  );

  function playEx(idx: number, zh: string) {
    const key = `${gi}:${idx}`;
    if (playing === key) return stopAll();
    playTTS(key, zh);
  }

  function goPrev() {
    if (gi > 0) {
      stopAll();
      setGi(gi - 1);
    }
  }
  function goNext() {
    stopAll();
    if (gi < total - 1) setGi(gi + 1);
    else onDone();
  }

  useEffect(() => () => stopAll(), [stopAll]); // unmount cleanup

  if (!point) {
    return (
      <div className="bs-card">
        <div className="bs-soon">
          <div className="bs-soon-ic">📐</div>
          <p>Энэ хичээлд дүрэм алга.</p>
        </div>
        <button className="bs-cta" onClick={onDone} style={{ marginTop: 4 }}>
          Дараагийнх →
        </button>
      </div>
    );
  }

  const examples = point.examples ?? [];

  return (
    <div className="bs-card bs-gr">
      {/* Толгой */}
      <div className="bs-vtop">
        <div className="bs-label" style={{ margin: 0 }}>
          <span className="bs-dot" />
          Дүрэм
        </div>
        <span className="bs-counter">
          {gi + 1} / {total}
        </span>
      </div>

      {/* Дүрмийн загвар + богино утга */}
      <div className="bs-gr-point">{point.point}</div>
      {point.gloss_mn && <div className="bs-gr-gloss">{point.gloss_mn}</div>}

      {/* Багшийн тайлбар */}
      {point.teacher_mn && <div className="bs-gr-teacher">{point.teacher_mn}</div>}

      {/* Жишээнүүд */}
      {examples.length > 0 && (
        <>
          <div className="bs-gr-exhead">
            <div className="bs-label" style={{ margin: 0 }}>
              <span className="bs-dot" />
              Жишээ
            </div>
            <div className="bs-speeds" role="group" aria-label="Сонсох хурд">
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`bs-speed ${speed === s ? "bs-on" : ""}`}
                  onClick={() => setSpeed(s)}
                  aria-pressed={speed === s}
                >
                  {s}×
                </button>
              ))}
            </div>
          </div>

          <div className="bs-gr-exs">
            {examples.map((ex, idx) => {
              const key = `${gi}:${idx}`;
              const isPlaying = playing === key;
              return (
                <div className="bs-gr-ex" key={idx}>
                  <div className="bs-gr-ex-tx">
                    <div className="bs-py">{ex.pinyin}</div>
                    <div className="bs-zh">{ex.zh}</div>
                    <div className="bs-mn">{ex.mn}</div>
                  </div>
                  <button
                    type="button"
                    className={`bs-speak ${isPlaying ? "bs-on" : ""}`}
                    onClick={() => playEx(idx, ex.zh)}
                    aria-label={isPlaying ? "Зогсоох" : "Сонсох"}
                  >
                    <span aria-hidden>{isPlaying ? "⏸" : "▶"}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Өмнөх / Дараагийнх */}
      <div className="bs-navrow">
        <button className="bs-navbtn" onClick={goPrev} disabled={gi === 0}>
          ← Өмнөх
        </button>
        <button className="bs-navbtn" onClick={goNext}>
          {gi === total - 1 ? "Дуусгах →" : "Дараагийнх →"}
        </button>
      </div>
    </div>
  );
}
