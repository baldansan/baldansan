"use client";
// components/lesson/modules/PronunciationModule.tsx
// "pronunciation" модуль — "намайг дагаж хэл" маягийн дуудлагын коучинг.
// Үг бүр: 汉字 + пиньинь + том ▶ товч (хятад TTS) + хурд + дуудлагын зөвлөгөө (tip_mn).
// Бүтцийг (teacher_mn, items[{zh,pinyin,tip_mn}]) ЭНД тодорхойлсон тул
// types/lesson.ts-г өөрчлөх ШААРДЛАГАГҮЙ. Модулийн гэрээ: { lesson, onDone }.

import { useCallback, useEffect, useState } from "react";
import type { Lesson } from "@/types/lesson";
import "./pronunciation-module.css";

type Speed = 0.5 | 0.75 | 1;
const SPEEDS: Speed[] = [0.5, 0.75, 1];

// pronunciation хэсгийн бүтэц (lesson.pronunciation = unknown тул энд тодорхойлов)
interface PronItem {
  zh: string;
  pinyin: string;
  tip_mn?: string;
}
interface PronData {
  teacher_mn?: string;
  items: PronItem[];
}

export default function PronunciationModule({
  lesson,
  onDone,
}: {
  lesson: Lesson;
  onDone: () => void;
}) {
  const data = lesson.pronunciation as PronData | undefined;
  const items: PronItem[] = data?.items ?? [];
  const teacher = data?.teacher_mn;

  const [pi, setPi] = useState(0); // аль үг
  const [speed, setSpeed] = useState<Speed>(1);
  const [playing, setPlaying] = useState(false);

  const item = items[pi];
  const total = items.length;

  // === Тоглуулагч (зөвхөн TTS) ===
  const stopAll = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setPlaying(false);
  }, []);

  const playTTS = useCallback(
    (str: string, rate: number) => {
      stopAll();
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      const u = new SpeechSynthesisUtterance(str);
      u.lang = "zh-CN";
      u.rate = rate;
      const zh = window.speechSynthesis
        .getVoices()
        .find((v) => v.lang?.toLowerCase().startsWith("zh"));
      if (zh) u.voice = zh;
      u.onend = () => setPlaying(false);
      u.onerror = () => setPlaying(false);
      setPlaying(true);
      window.speechSynthesis.speak(u);
    },
    [stopAll]
  );

  function play() {
    if (playing) return stopAll();
    if (item) playTTS(item.zh, speed);
  }

  // Хурд солих → тоглож байвал шинэ хурдаар ДАХИН тоглуулна (удаан сонсоход амар)
  function changeSpeed(s: Speed) {
    setSpeed(s);
    if (playing && item) playTTS(item.zh, s);
  }

  function goPrev() {
    if (pi > 0) {
      stopAll();
      setPi(pi - 1);
    }
  }
  function goNext() {
    stopAll();
    if (pi < total - 1) setPi(pi + 1);
    else onDone();
  }

  useEffect(() => () => stopAll(), [stopAll]); // unmount cleanup

  if (!item) {
    return (
      <div className="bs-card">
        <div className="bs-soon">
          <div className="bs-soon-ic">🗣️</div>
          <p>Энэ хичээлд дуудлагын дасгал алга.</p>
        </div>
        <button className="bs-cta" onClick={onDone} style={{ marginTop: 4 }}>
          Дараагийнх →
        </button>
      </div>
    );
  }

  return (
    <div className="bs-card bs-pr">
      {/* Толгой */}
      <div className="bs-vtop">
        <div className="bs-label" style={{ margin: 0 }}>
          <span className="bs-dot" />
          Дуудлага
        </div>
        <span className="bs-counter">
          {pi + 1} / {total}
        </span>
      </div>

      {/* Багшийн коучинг мөр */}
      {teacher && <div className="bs-pr-teacher">{teacher}</div>}

      {/* Үгийн карт */}
      <div className="bs-vcard">
        <div className="bs-hanzi">{item.zh}</div>
        <div className="bs-vpy">{item.pinyin}</div>

        <button
          type="button"
          className={`bs-speak bs-lg ${playing ? "bs-on" : ""}`}
          onClick={play}
          aria-label={playing ? "Зогсоох" : "Сонсох"}
        >
          <span aria-hidden>{playing ? "⏸" : "▶"}</span>
        </button>

        <div className="bs-speeds" role="group" aria-label="Сонсох хурд">
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
      </div>

      {/* Дуудлагын зөвлөгөө */}
      {item.tip_mn && (
        <div className="bs-pr-tip">
          <span className="bs-pr-tip-ic" aria-hidden>
            💡
          </span>
          <span>{item.tip_mn}</span>
        </div>
      )}

      {/* Өмнөх / Дараагийнх */}
      <div className="bs-navrow">
        <button className="bs-navbtn" onClick={goPrev} disabled={pi === 0}>
          ← Өмнөх
        </button>
        <button className="bs-navbtn" onClick={goNext}>
          {pi === total - 1 ? "Дуусгах →" : "Дараагийнх →"}
        </button>
      </div>
    </div>
  );
}
