"use client";
// components/lesson/modules/DialoguesModule.tsx
// "dialogues" модуль — чат хэлбэрийн яриа.
// Мөр бүр: пиньинь + 汉字 + монгол + тоглуулах товч.
// Хурд: 0.5× / 0.75× / 1× — аудио файл БА хөтчийн дуудлага (TTS) хоёуланд үйлчилнэ.
// Мөрд аудио файл байвал ТҮҮНИЙГ, байхгүй бол хөтчийн хятад хоолойг (TTS) ашиглана —
// яг VocabularyCard-тай ижил зарчим, тул аудио файлгүйгээр ч шууд ажиллана.
//
// Модулийн гэрээ бусадтай ижил: { lesson, onDone }. Сүүлийн яриа дуусахад onDone().

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Lesson, Dialogue, DialogueLine } from "@/types/lesson";
import "./dialogues-module.css";

type Speed = 0.5 | 0.75 | 1;
const SPEEDS: Speed[] = [0.5, 0.75, 1];

// audio_base_path + замыг нийлүүлж бүтэн зам/URL гаргана.
// Зам аль хэдийн http(s) бол тэр чигээр нь буцаана. Base хоосон бол замыг шууд буцаана.
function audioUrl(base: string | undefined, path?: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const b = (base ?? "").replace(/\/+$/, "");
  const p = path.replace(/^\/+/, "");
  return b ? `${b}/${p}` : p;
}

// Нэг зэрэг зөвхөн НЭГ л зүйл тоглоно — одоо тоглож буй зүйлийн түлхүүр.
type PlayKey = string | null;

export default function DialoguesModule({
  lesson,
  onDone,
}: {
  lesson: Lesson;
  onDone: () => void; // сүүлийн яриа дуусахад дараагийн модуль руу
}) {
  const dialogues: Dialogue[] = lesson.dialogues ?? [];
  const base = lesson.audio_base_path;

  const [di, setDi] = useState(0); // аль яриаг үзэж байна
  const [speed, setSpeed] = useState<Speed>(1);
  const [playing, setPlaying] = useState<PlayKey>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const dialogue = dialogues[di];
  const total = dialogues.length;

  // Хэлэгчдийг ГАРЧ ИРЭХ дарааллаар нь зүүн/баруун талд хуваарилна (чат шиг).
  const sides = useMemo(() => {
    const map: Record<string, "l" | "r"> = {};
    let order = 0;
    for (const ln of dialogue?.lines ?? []) {
      if (!(ln.speaker in map)) {
        map[ln.speaker] = order % 2 === 0 ? "l" : "r";
        order++;
      }
    }
    return map;
  }, [dialogue]);

  // === Тоглуулагчийн удирдлага ===
  const stopAll = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setPlaying(null);
  }, []);

  // Аудио ФАЙЛ тоглуулах (хурд тохируулна)
  const playFile = useCallback(
    (key: string, src: string) => {
      stopAll();
      const a = new Audio(src);
      a.playbackRate = speed;
      audioRef.current = a;
      setPlaying(key);
      const clear = () =>
        setPlaying((p) => (p === key ? null : p));
      a.onended = () => {
        if (audioRef.current === a) audioRef.current = null;
        clear();
      };
      a.onerror = clear; // файл олдоогүй бол чимээгүй унтраана
      void a.play().catch(clear);
    },
    [speed, stopAll]
  );

  // Хөтчийн хятад хоолой (TTS) — мөрд аудио файл байхгүй үед
  const playTTS = useCallback(
    (key: string, text: string) => {
      stopAll();
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "zh-CN";
      u.rate = speed; // 0.5 = удаан, 1 = хэвийн
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

  // Мөр тоглуулах: файл байвал файл, үгүй бол TTS. Дахин дарвал зогсоох.
  function playLine(idx: number, line: DialogueLine) {
    const key = `${di}:${idx}`;
    if (playing === key) return stopAll();
    const src = audioUrl(base, line.audio);
    if (src) playFile(key, src);
    else playTTS(key, line.zh);
  }

  // Бүх ярианы аудио (dialogue.audio байвал)
  const fullKey = `full:${di}`;
  const hasFull = Boolean(audioUrl(base, dialogue?.audio));
  function playFull() {
    const src = audioUrl(base, dialogue?.audio);
    if (!src) return;
    if (playing === fullKey) return stopAll();
    playFile(fullKey, src);
  }

  // Хурд солих → одоо тоглож буй ФАЙЛД шууд тусгана.
  // (TTS-ийг дунд нь өөрчлөх боломжгүй — дараагийн тоглуулалтаас үйлчилнэ.)
  function changeSpeed(s: Speed) {
    setSpeed(s);
    if (audioRef.current) audioRef.current.playbackRate = s;
  }

  function goPrev() {
    if (di > 0) {
      stopAll();
      setDi(di - 1);
    }
  }
  function goNext() {
    stopAll();
    if (di < total - 1) setDi(di + 1);
    else onDone();
  }

  // Модулиас гарах/unmount үед бүх дууг зогсооно
  useEffect(() => () => stopAll(), [stopAll]);

  // Яриа алга бол player эвдрэхгүй — шууд алгасна
  if (!dialogue) {
    return (
      <div className="bs-card">
        <div className="bs-soon">
          <div className="bs-soon-ic">💬</div>
          <p>Энэ хичээлд яриа алга.</p>
        </div>
        <button className="bs-cta" onClick={onDone} style={{ marginTop: 4 }}>
          Дараагийнх →
        </button>
      </div>
    );
  }

  return (
    <div className="bs-card bs-dlg">
      {/* Толгой: гарчиг + тоологч */}
      <div className="bs-vtop">
        <div className="bs-label" style={{ margin: 0 }}>
          <span className="bs-dot" />
          Яриа
        </div>
        <span className="bs-counter">
          {di + 1} / {total}
        </span>
      </div>

      {dialogue.title_mn && <div className="bs-dlg-title">{dialogue.title_mn}</div>}
      {dialogue.scene_mn && <div className="bs-dlg-scene">{dialogue.scene_mn}</div>}

      {/* Хяналт: хурд сонгогч + бүх яриаг тоглуулах */}
      <div className="bs-dlg-bar">
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

        {hasFull && (
          <button
            type="button"
            className={`bs-dlg-full ${playing === fullKey ? "bs-on" : ""}`}
            onClick={playFull}
            aria-label={playing === fullKey ? "Зогсоох" : "Бүх яриаг сонсох"}
          >
            <span aria-hidden>{playing === fullKey ? "⏸" : "▶"}</span> Бүгд
          </button>
        )}
      </div>

      {/* Чат хэлбэрийн мөрүүд */}
      <div className="bs-chat">
        {dialogue.lines.map((line, idx) => {
          const side = sides[line.speaker] ?? "l";
          const key = `${di}:${idx}`;
          const isPlaying = playing === key;
          const prev = dialogue.lines[idx - 1];
          const showName = !prev || prev.speaker !== line.speaker;
          return (
            <div key={idx} className={`bs-row bs-${side}`}>
              <div className="bs-bubble">
                {showName && <div className="bs-spk">{line.speaker}</div>}
                <div className="bs-line">
                  <div className="bs-line-tx">
                    <div className="bs-py">{line.pinyin}</div>
                    <div className="bs-zh">{line.zh}</div>
                    <div className="bs-mn">{line.mn}</div>
                  </div>
                  <button
                    type="button"
                    className={`bs-speak ${isPlaying ? "bs-on" : ""}`}
                    onClick={() => playLine(idx, line)}
                    aria-label={isPlaying ? "Зогсоох" : "Сонсох"}
                  >
                    <span aria-hidden>{isPlaying ? "⏸" : "▶"}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Өмнөх / Дараагийнх */}
      <div className="bs-navrow">
        <button className="bs-navbtn" onClick={goPrev} disabled={di === 0}>
          ← Өмнөх
        </button>
        <button className="bs-navbtn" onClick={goNext}>
          {di === total - 1 ? "Дуусгах →" : "Дараагийнх →"}
        </button>
      </div>
    </div>
  );
}
