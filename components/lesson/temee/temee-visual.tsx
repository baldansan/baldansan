"use client";

import { temeePoseSrc } from "@/lib/temee/poses";
import type { TemeeAudioRef, TemeeVisual } from "@/types/temee-lesson";

type PlayFn = (src: TemeeAudioRef[]) => void;

const TONE_PATH: Record<1 | 2 | 3 | 4, string> = {
  1: "M 20 22 L 180 22",
  2: "M 20 70 L 180 22",
  3: "M 20 94 C 60 122, 90 122, 110 112 S 160 70, 180 46",
  4: "M 20 22 L 180 118",
};
const TONE_MARK: Record<1 | 2 | 3 | 4, string> = { 1: "¯", 2: "´", 3: "ˇ", 4: "`" };

/** Хөгийн зураг: таван түвшний шугам дээр хоолойн өндрийн хөдөлгөөн. */
export function ToneContour({ tone, small = false }: { tone: 1 | 2 | 3 | 4; small?: boolean }) {
  return (
    <svg
      viewBox="0 0 200 140"
      className={small ? "tm-tone-svg tm-tone-svg--sm" : "tm-tone-svg"}
      role="img"
      aria-label={`${tone}-р хөгийн зураг`}
    >
      {[22, 46, 70, 94, 118].map((y) => (
        <line key={y} x1="12" x2="188" y1={y} y2={y} className="tm-tone-grid" />
      ))}
      <path d={TONE_PATH[tone]} className="tm-tone-line" fill="none" />
    </svg>
  );
}

export function TemeeVisualView({ visual, onPlay }: { visual: TemeeVisual; onPlay: PlayFn }) {
  switch (visual.kind) {
    case "hanzi":
      return (
        <div className="tm-v tm-v-hanzi" translate="no">
          {visual.py ? <p className="tm-v-py">{visual.py}</p> : null}
          <p className="tm-v-zh">{visual.zh}</p>
          {visual.mn ? <p className="tm-v-mn">{visual.mn}</p> : null}
          {visual.note ? <p className="tm-v-note">{visual.note}</p> : null}
        </div>
      );
    case "syllable":
      return (
        <div className="tm-v tm-v-syl" translate="no">
          <p className="tm-v-zh tm-v-zh--py">{visual.py}</p>
          <div className="tm-syl-parts">
            {visual.parts.map((p, i) => (
              <div key={`${p.t}-${i}`} className={`tm-syl-part tm-syl-part--${i % 3}`}>
                <b>{p.t}</b>
                <span>{p.label}</span>
              </div>
            ))}
          </div>
        </div>
      );
    case "tone":
      return (
        <div className="tm-v tm-v-tone">
          <div className="tm-tone-head" translate="no">
            <span className="tm-tone-num">{visual.tone}</span>
            <span className="tm-tone-mark">{TONE_MARK[visual.tone]}</span>
          </div>
          <ToneContour tone={visual.tone} />
          <p className="tm-tone-axis">
            <span>нам</span>
            <span>өндөр ↑</span>
          </p>
          <p className="tm-tone-cue">{visual.cue}</p>
        </div>
      );
    case "tones4":
      return (
        <div className="tm-v tm-grid tm-grid--2">
          {visual.items.map((it) => (
            <div key={it.py} className="tm-cell">
              <ToneContour tone={it.tone} small />
              <b translate="no">{it.py}</b>
              <span>{it.mn}</span>
            </div>
          ))}
        </div>
      );
    case "compose":
      return (
        <div className="tm-v tm-v-compose" translate="no">
          <div className="tm-compose-row">
            {visual.parts.map((p, i) => (
              <div key={`${p.zh}-${i}`} className="tm-compose-item">
                {i > 0 ? <span className="tm-compose-op">+</span> : null}
                <div className="tm-compose-part">
                  <b>{p.zh}</b>
                  <span>{p.mn}</span>
                </div>
              </div>
            ))}
          </div>
          <span className="tm-compose-eq">↓</span>
          <div className="tm-compose-result">
            {visual.result.py ? <p className="tm-v-py">{visual.result.py}</p> : null}
            <p className="tm-v-zh">{visual.result.zh}</p>
            <p className="tm-v-mn">{visual.result.mn}</p>
          </div>
        </div>
      );
    case "columns":
      return (
        <div className="tm-v tm-cols">
          {visual.cols.map((c) => (
            <div key={c.head} className="tm-col">
              <b translate="no" className={/[\u4e00-\u9fff]/.test(c.head) ? undefined : "tm-col-head--text"}>
                {c.head}
              </b>
              {c.sub ? <em translate="no">{c.sub}</em> : null}
              <ul>
                {c.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );
    case "dialog":
      return (
        <div className="tm-v tm-dialog">
          {visual.lines.map((l, i) => (
            <div key={`${l.who}-${i}`} className={`tm-bub ${i % 2 ? "tm-bub--r" : "tm-bub--l"}`}>
              <span className="tm-bub-who">{l.who}</span>
              <span className="tm-bub-py" translate="no">{l.py}</span>
              <span className="tm-bub-zh" translate="no">{l.zh}</span>
              <span className="tm-bub-mn">{l.mn}</span>
            </div>
          ))}
        </div>
      );
    case "image":
      return (
        <div className="tm-v tm-v-img">
          {/* eslint-disable-next-line @next/next/no-img-element -- repo доторх статик зураг */}
          <img src={visual.src} alt={visual.alt} loading="lazy" decoding="async" />
        </div>
      );
    case "pose":
      return (
        <div className="tm-v tm-v-pose">
          {/* eslint-disable-next-line @next/next/no-img-element -- жижиг статик зураг */}
          <img src={temeePoseSrc(visual.pose, "lg")} alt="" />
        </div>
      );
    case "grid":
      return (
        <div className={`tm-v tm-grid ${visual.items.length > 4 ? "tm-grid--3" : "tm-grid--2"}`}>
          {visual.items.map((it) =>
            it.src ? (
              <button
                key={it.label + (it.sub ?? "")}
                type="button"
                className="tm-cell tm-cell--btn"
                onClick={() => onPlay(it.src!)}
              >
                <b translate="no">{it.label}</b>
                {it.sub ? <span translate="no">{it.sub}</span> : null}
                <i aria-hidden>🔊</i>
              </button>
            ) : (
              <div key={it.label + (it.sub ?? "")} className="tm-cell">
                <b translate="no">{it.label}</b>
                {it.sub ? <span>{it.sub}</span> : null}
              </div>
            )
          )}
        </div>
      );
    case "pair":
      return (
        <div className="tm-v tm-pair">
          {[visual.a, visual.b].map((s) => (
            <button key={s.label} type="button" className="tm-cell tm-cell--btn" onClick={() => onPlay(s.src)}>
              <b translate="no">{s.label}</b>
              <span>{s.hint}</span>
              <i aria-hidden>🔊</i>
            </button>
          ))}
        </div>
      );
    case "blend":
      return (
        <div className="tm-v tm-blend" translate="no">
          {visual.items.map((it) => (
            <button key={it.result} type="button" className="tm-blend-row" onClick={() => onPlay(it.src)}>
              <span className="tm-blend-a">{it.a}</span>
              <span className="tm-blend-op">+</span>
              <span className="tm-blend-b">{it.b}</span>
              <span className="tm-blend-op">→</span>
              <b>{it.result}</b>
              <i aria-hidden>🔊</i>
            </button>
          ))}
        </div>
      );
    case "strokes":
      return (
        <div className="tm-v tm-grid tm-grid--2">
          {visual.items.map((it) => (
            <div key={it.name} className="tm-cell">
              <b className="tm-stroke-glyph" translate="no">{it.glyph}</b>
              <span className="tm-stroke-name">{it.name}</span>
              <small>{it.dir}</small>
            </div>
          ))}
        </div>
      );
    case "order":
      return (
        <div className="tm-v tm-order">
          {visual.items.map((it) => (
            <div key={it.zh} className="tm-order-row">
              <div className="tm-order-steps" translate="no">
                {it.steps.map((s, i) => (
                  <span key={`${s}-${i}`} className="tm-order-step">
                    <small>{i + 1}</small>
                    {s}
                  </span>
                ))}
                <span className="tm-order-arrow">→</span>
                <b>{it.zh}</b>
              </div>
              <p>{it.rule}</p>
            </div>
          ))}
        </div>
      );
    default:
      return null;
  }
}
