"use client";
// components/lesson/modules/TextsModule.tsx
// Богино эх: sentences[] + tokens[{zh, py}] — ханз default, пиньинь дээр, орчуулга өгүүлбэр бүрт.

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { resolveLessonPackagePlayableUrl } from "@/lib/lesson/package-audio-resolve";
import type {
  HskLessonPackage,
  HskPackageShortText,
  HskPackageTextSentence,
  HskPackageVocabItem,
} from "@/types/hsk-lesson-package";
import "./texts-module.css";

type Speed = 0.5 | 0.75 | 1;
const SPEEDS: Speed[] = [0.5, 0.75, 1];

const POP_PAD = 10;
const POP_EST_HEIGHT = 96;

type Vocab = { zh: string; pinyin: string; mn: string };
type VocabPop = {
  v: Vocab;
  x: number;
  yTop: number;
  yBottom: number;
  place: "above" | "below";
};

function anchorVocabPop(container: HTMLElement, button: HTMLElement): Omit<VocabPop, "v"> {
  const cr = container.getBoundingClientRect();
  const br = button.getBoundingClientRect();
  const yTop = br.top - cr.top;
  const yBottom = br.bottom - cr.top;
  const xCenter = br.left - cr.left + br.width / 2;
  const place = yTop < POP_EST_HEIGHT + POP_PAD ? "below" : "above";
  const half = 120;
  const x = Math.min(
    Math.max(xCenter, half + POP_PAD),
    Math.max(half + POP_PAD, cr.width - half - POP_PAD)
  );
  return { x, yTop, yBottom, place };
}

function refineVocabPop(container: HTMLElement, pop: HTMLElement, anchor: VocabPop): VocabPop {
  const pw = pop.offsetWidth;
  const ph = pop.offsetHeight;
  const half = pw / 2;
  const cw = container.clientWidth;
  const ch = container.clientHeight;
  const x = Math.min(
    Math.max(anchor.x, half + POP_PAD),
    Math.max(half + POP_PAD, cw - half - POP_PAD)
  );
  let place = anchor.place;
  if (place === "above" && anchor.yTop < ph + POP_PAD) place = "below";
  else if (place === "below" && anchor.yBottom + ph + POP_PAD > ch) place = "above";
  if (x === anchor.x && place === anchor.place) return anchor;
  return { ...anchor, x, place };
}

function buildVocabMap(words: HskPackageVocabItem[]): Map<string, Vocab> {
  const map = new Map<string, Vocab>();
  for (const w of words) {
    const zh = String(w.zh ?? "").trim();
    if (!zh) continue;
    map.set(zh, { zh, pinyin: String(w.pinyin ?? "").trim(), mn: String(w.mn ?? "").trim() });
  }
  return map;
}

export default function TextsModule({
  lesson,
  onDone,
}: {
  lesson: HskLessonPackage;
  onDone: () => void;
}) {
  const texts: HskPackageShortText[] = lesson.texts ?? [];
  const base = lesson.audio_base_path;

  const vocabByZh = useMemo(() => buildVocabMap(lesson.vocabulary ?? []), [lesson.vocabulary]);

  const [ti, setTi] = useState(0);
  const [speed, setSpeed] = useState<Speed>(1);
  const [playing, setPlaying] = useState(false);
  const [showPinyin, setShowPinyin] = useState(false);
  const [showMn, setShowMn] = useState(false);
  const [tapped, setTapped] = useState<VocabPop | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);

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

  function tapWord(e: React.MouseEvent, v: Vocab) {
    const cont = bodyRef.current;
    const btn = e.currentTarget as HTMLElement;
    if (!cont) return;
    setTapped({ v, ...anchorVocabPop(cont, btn) });
  }

  function resetPop() {
    setTapped(null);
  }

  function goPrev() {
    if (ti > 0) {
      stopAudio();
      resetPop();
      setShowMn(false);
      setTi(ti - 1);
    }
  }

  function goNext() {
    stopAudio();
    resetPop();
    setShowMn(false);
    if (ti < total - 1) setTi(ti + 1);
    else onDone();
  }

  useEffect(() => () => stopAudio(), [stopAudio]);

  useLayoutEffect(() => {
    if (!tapped || !popRef.current || !bodyRef.current) return;
    const next = refineVocabPop(bodyRef.current, popRef.current, tapped);
    if (next.x !== tapped.x || next.place !== tapped.place) setTapped(next);
  }, [tapped]);

  if (!text || sentences.length === 0) {
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
          Богино эх
        </div>
        <span className="bs-counter">
          {ti + 1} / {total}
        </span>
      </div>

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
          <span aria-hidden>{playing ? "⏸" : "▶"}</span> {playing ? "Зогсоож байна" : "Сонсох"}
        </button>
      </div>

      <div className="bs-txt-hint">Тодорсон шинэ үг дээр дарж орчуулгыг нь хараарай.</div>

      <div
        className="bs-txt-body"
        ref={bodyRef}
        onClick={(e) => {
          if (e.target === e.currentTarget) resetPop();
        }}
      >
        <div className="bs-txt-sentences">
          {sentences.map((sentence, si) => (
            <div key={si} className="bs-txt-sentence">
              <div className="bs-txt-ruby-line">
                {sentence.tokens.map((tok, ti2) => {
                  const vocab = vocabByZh.get(tok.zh);
                  const isWord = Boolean(vocab);
                  const py = tok.py || (isWord ? vocab!.pinyin : "");
                  return (
                    <span key={ti2} className="bs-txt-unit">
                      {showPinyin && py ? (
                        <span className="bs-txt-py-above">{py}</span>
                      ) : showPinyin ? (
                        <span className="bs-txt-py-above bs-txt-py-empty" aria-hidden>
                          &nbsp;
                        </span>
                      ) : null}
                      {isWord ? (
                        <button
                          type="button"
                          className="bs-newword"
                          onClick={(e) => tapWord(e, vocab!)}
                        >
                          {tok.zh}
                        </button>
                      ) : (
                        <span className="bs-txt-zh-char">{tok.zh}</span>
                      )}
                    </span>
                  );
                })}
              </div>
              {showMn && sentence.mn ? (
                <div className="bs-txt-mn-line">{sentence.mn}</div>
              ) : null}
            </div>
          ))}
        </div>

        {tapped && (
          <>
            <div className="bs-pop-back" onClick={resetPop} />
            <div
              ref={popRef}
              className={`bs-pop bs-pop--${tapped.place}`}
              style={{
                left: tapped.x,
                top: tapped.place === "above" ? tapped.yTop : tapped.yBottom,
              }}
            >
              <div className="bs-pop-zh">{tapped.v.zh}</div>
              {tapped.v.pinyin ? <div className="bs-pop-py">{tapped.v.pinyin}</div> : null}
              <div className="bs-pop-mn">{tapped.v.mn}</div>
            </div>
          </>
        )}
      </div>

      <div className="bs-txt-toggles">
        <button
          type="button"
          className={`bs-tg ${showPinyin ? "bs-on" : ""}`}
          onClick={() => setShowPinyin((v) => !v)}
          aria-pressed={showPinyin}
        >
          Пиньинь {showPinyin ? "нуух" : "харах"}
        </button>
        <button
          type="button"
          className={`bs-tg ${showMn ? "bs-on" : ""}`}
          onClick={() => setShowMn((v) => !v)}
          aria-pressed={showMn}
        >
          Орчуулга {showMn ? "нуух" : "харах"}
        </button>
      </div>

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
