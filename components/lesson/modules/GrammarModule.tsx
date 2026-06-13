"use client";
// components/lesson/modules/GrammarModule.tsx
// Дүрэм бүрээр сүлжсэн урсгал: тайлбар → жишээ → дасгал → дараагийн дүрэм.

import { useCallback, useEffect, useState } from "react";
import type {
  HskLessonPackage,
  HskPackageGrammarPoint,
} from "@/types/hsk-lesson-package";
import {
  TeacherOverlayFields,
  TeacherStructureBlock,
} from "./teacher-overlay-fields";
import { CollocationsSection } from "./CollocationsSection";
import { GrammarPointExercises } from "./GrammarPointExercises";
import { MnGrammarTermText } from "@/components/lesson/mn-grammar-term-text";
import "./grammar-module.css";
import "./teacher-overlay.css";
import "./exercises-module.css";

type Speed = 0.5 | 0.75 | 1;
const SPEEDS: Speed[] = [0.5, 0.75, 1];

type PointPhase = "intro" | "examples" | "exercises";

function phaseLabel(phase: PointPhase): string {
  if (phase === "intro") return "Тайлбар";
  if (phase === "examples") return "Жишээ";
  return "Дасгал";
}

function lastPhaseForPoint(point: HskPackageGrammarPoint): PointPhase {
  if (point.exercises?.length) return "exercises";
  if (point.examples?.length) return "examples";
  return "intro";
}

export default function GrammarModule({
  lessonId,
  lesson,
  onDone,
}: {
  lessonId: string;
  lesson: HskLessonPackage;
  onDone: () => void;
}) {
  const points: HskPackageGrammarPoint[] = [
    ...(lesson.grammar ?? []),
    ...(lesson.word_explanation ?? []),
  ];

  const [gi, setGi] = useState(0);
  const [phase, setPhase] = useState<PointPhase>("intro");
  const [speed, setSpeed] = useState<Speed>(1);
  const [playing, setPlaying] = useState<string | null>(null);

  const point = points[gi];
  const total = points.length;

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

  function goNextPoint() {
    stopAll();
    if (gi < total - 1) {
      setGi(gi + 1);
      setPhase("intro");
    } else {
      onDone();
    }
  }

  function advancePhase() {
    if (!point) return;
    if (phase === "intro") {
      if (point.examples?.length) setPhase("examples");
      else if (point.exercises?.length) setPhase("exercises");
      else goNextPoint();
      return;
    }
    if (phase === "examples") {
      if (point.exercises?.length) setPhase("exercises");
      else goNextPoint();
    }
  }

  function goPrev() {
    stopAll();
    if (!point) return;

    if (phase === "exercises") {
      if (point.examples?.length) setPhase("examples");
      else setPhase("intro");
      return;
    }
    if (phase === "examples") {
      setPhase("intro");
      return;
    }
    if (gi > 0) {
      const prev = points[gi - 1];
      setGi(gi - 1);
      setPhase(lastPhaseForPoint(prev));
    }
  }

  const canGoPrev = gi > 0 || phase !== "intro";

  useEffect(() => () => stopAll(), [stopAll]);

  if (!point) {
    return (
      <div className="bs-card">
        <div className="bs-soon">
          <div className="bs-soon-ic">📐</div>
          <p>Энэ хичээлд дүрэм алга.</p>
        </div>
        <button
          className="bs-cta bs-path-visible-cta"
          onClick={onDone}
          style={{ marginTop: 4 }}
        >
          Дараагийнх →
        </button>
      </div>
    );
  }

  const examples = point.examples ?? [];
  const exercises = point.exercises ?? [];
  const showCollocations =
    gi === 0 &&
    phase === "intro" &&
    lesson.collocations &&
    lesson.collocations.length > 0;

  const forwardLabel =
    phase === "intro"
      ? examples.length
        ? "Жишээ рүү →"
        : exercises.length
          ? "Дасгал руу →"
          : gi === total - 1
            ? "Дуусгах →"
            : "Дараагийн дүрэм →"
      : phase === "examples"
        ? exercises.length
          ? "Дасгал руу →"
          : gi === total - 1
            ? "Дуусгах →"
            : "Дараагийн дүрэм →"
        : "";

  return (
    <div className="bs-card bs-gr">
      <div className="bs-vtop">
        <div className="bs-label" style={{ margin: 0 }}>
          <span className="bs-dot" />
          Дүрэм
        </div>
        <span className="bs-counter">
          {gi + 1} / {total} · {phaseLabel(phase)}
        </span>
      </div>

      {phase === "intro" && (
        <>
          <div className="bs-gr-point">{point.point}</div>
          {point.structure ? <TeacherStructureBlock structure={point.structure} /> : null}
          {point.gloss_mn && (
            <div className="bs-gr-gloss">
              <MnGrammarTermText text={point.gloss_mn} />
            </div>
          )}
          {point.teacher_mn && (
            <div className="bs-gr-teacher">
              <MnGrammarTermText text={point.teacher_mn} />
            </div>
          )}

          <TeacherOverlayFields
            teacher_notes={point.teacher_notes}
            common_mistakes={point.common_mistakes}
            check={point.check}
          />

          {showCollocations ? (
            <CollocationsSection collocations={lesson.collocations!} />
          ) : null}
        </>
      )}

      {phase === "examples" && examples.length > 0 && (
        <>
          <div className="bs-gr-point bs-gr-point--compact">{point.point}</div>
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
                    <div className="bs-mn">
                      <MnGrammarTermText text={ex.mn} />
                    </div>
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

      {phase === "exercises" && exercises.length > 0 && (
        <>
          <div className="bs-gr-point bs-gr-point--compact">{point.point}</div>
          <GrammarPointExercises
            lessonId={lessonId}
            grammarPointIndex={gi}
            exercises={exercises}
            isLastPoint={gi === total - 1}
            onComplete={goNextPoint}
          />
        </>
      )}

      {phase !== "exercises" && (
        <div className="bs-navrow">
          <button className="bs-navbtn" onClick={goPrev} disabled={!canGoPrev}>
            ← Өмнөх
          </button>
          <button className="bs-navbtn" onClick={advancePhase}>
            {forwardLabel}
          </button>
        </div>
      )}
    </div>
  );
}
