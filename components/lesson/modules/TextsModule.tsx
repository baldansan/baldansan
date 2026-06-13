"use client";
// components/lesson/modules/TextsModule.tsx
// Богино эх / mainText — LiveTextReader (үг дарах + toggle).

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LiveTextReader } from "@/components/lesson/live-text-reader";
import { WritingSampleCard } from "@/components/lesson/modules/WritingSampleCard";
import { resolveLessonPackagePlayableUrl } from "@/lib/lesson/package-audio-resolve";
import type {
  HskLessonPackage,
  HskPackageShortText,
  HskPackageTextSentence,
} from "@/types/hsk-lesson-package";
import "./texts-module.css";
import "./teacher-overlay.css";

type Speed = 0.5 | 0.75 | 1;
const SPEEDS: Speed[] = [0.5, 0.75, 1];

export default function TextsModule({
  lesson,
  onDone,
}: {
  lesson: HskLessonPackage;
  onDone: () => void;
}) {
  const texts: HskPackageShortText[] = lesson.texts ?? [];
  const base = lesson.audio_base_path;

  const [ti, setTi] = useState(0);
  const [speed, setSpeed] = useState<Speed>(1);
  const [playing, setPlaying] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const text = texts[ti];
  const total = texts.length;
  const sentences: HskPackageTextSentence[] = text?.sentences ?? [];

  const fullZh = useMemo(
    () => sentences.map((s) => s.zh).join(""),
    [sentences]
  );

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlaying(false);
  }, []);

  function playAudio() {
    const src = resolveLessonPackagePlayableUrl(text?.audio, { packageAudioBase: base });
    if (!src) return;
    if (playing) return stopAudio();
    stopAudio();
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
  }

  function changeSpeed(s: Speed) {
    setSpeed(s);
    if (audioRef.current) audioRef.current.playbackRate = s;
  }

  function goPrev() {
    if (ti > 0) {
      stopAudio();
      setTi(ti - 1);
    }
  }

  function goNext() {
    stopAudio();
    if (ti < total - 1) setTi(ti + 1);
    else onDone();
  }

  useEffect(() => () => stopAudio(), [stopAudio]);

  if (!text || (sentences.length === 0 && !text.writingSample)) {
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
      <div className="bs-vtop">
        <div className="bs-label" style={{ margin: 0 }}>
          <span className="bs-dot" />
          {text.title_mn?.trim() || "Богино эх"}
        </div>
        <span className="bs-counter">
          {ti + 1} / {total}
        </span>
      </div>

      {sentences.length > 0 ? (
        <>
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
              onClick={playAudio}
              disabled={!text.audio && !fullZh}
              aria-label={playing ? "Зогсоох" : "Сонсох"}
            >
              <span aria-hidden>{playing ? "⏸" : "▶"}</span>{" "}
              {playing ? "Зогсоож байна" : "Сонсох"}
            </button>
          </div>

          <LiveTextReader text={text} vocabulary={lesson.vocabulary} />
        </>
      ) : null}

      {text.writingSample ? (
        <WritingSampleCard
          sample={text.writingSample}
          sectionTitle={text.title_mn}
        />
      ) : null}

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
