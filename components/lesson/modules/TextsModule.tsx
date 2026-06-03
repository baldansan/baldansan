"use client";
// components/lesson/modules/TextsModule.tsx  (v2 — унших уншигч)
// Богино эх: анхдагчаар ЗӨВХӨН ХЯТАД ХАНЗ. Шинэ үгс (хичээлийн vocab) ӨӨР ӨНГӨӨР
// тодорсон — дээр нь дарвал тэр үгийн пиньинь+орчуулга попап болж гарна.
// "Пиньинь" ба "Орчуулга" товчоор бүх эхийн пиньинь/орчуулгыг ТУС ТУСАД нь нээнэ.
// Шинэ үгийг ажил дээрээ vocab жагсаалттай тааруулж тодруулна (өгөгдөл өөрчлөхгүй).
// Гэрээ: { lesson, onDone }.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Lesson } from "@/types/lesson";
import "./texts-module.css";

type Speed = 0.5 | 0.75 | 1;
const SPEEDS: Speed[] = [0.5, 0.75, 1];

// Импортын болон player-ийн аль ч талбарын нэрийг дэмжинэ
function f(o: any, ...keys: string[]) {
  for (const k of keys) if (o && o[k] != null && o[k] !== "") return o[k];
  return "";
}
function audioUrl(base: string | undefined, path?: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const b = (base ?? "").replace(/\/+$/, "");
  const p = String(path).replace(/^\/+/, "");
  return b ? `${b}/${p}` : p;
}

type Vocab = { zh: string; pinyin: string; mn: string };
type Tok = { t: "plain"; s: string } | { t: "word"; s: string; v: Vocab };

export default function TextsModule({
  lesson,
  onDone,
}: {
  lesson: Lesson;
  onDone: () => void;
}) {
  const texts: any[] = (lesson as any).texts ?? [];
  const base = (lesson as any).audio_base_path;

  // Хичээлийн шинэ үгс (урт эхэнд — давхцлыг зөв таслахын тулд)
  const vocab: Vocab[] = useMemo(() => {
    const raw: any[] = (lesson as any).vocabulary ?? [];
    return raw
      .map((v) => ({ zh: f(v, "zh", "chinese"), pinyin: f(v, "pinyin"), mn: f(v, "mn", "mongolian") }))
      .filter((v) => v.zh)
      .sort((a, b) => b.zh.length - a.zh.length);
  }, [lesson]);

  const [ti, setTi] = useState(0);
  const [speed, setSpeed] = useState<Speed>(1);
  const [playing, setPlaying] = useState(false);
  const [showPinyin, setShowPinyin] = useState(false); // анхдагч: зөвхөн ханз
  const [showMn, setShowMn] = useState(false);
  const [tapped, setTapped] = useState<{ v: Vocab; x: number; y: number } | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);

  const text = texts[ti];
  const total = texts.length;
  const zh = f(text, "zh", "chinese");
  const py = f(text, "pinyin");
  const mn = f(text, "mn", "mongolian");

  // Эхийг шинэ үгээр нь хэсэглэх (longest-match)
  const tokens: Tok[] = useMemo(() => {
    if (!zh) return [];
    const out: Tok[] = [];
    let i = 0;
    while (i < zh.length) {
      let hit: Vocab | null = null;
      for (const v of vocab) {
        if (v.zh && zh.startsWith(v.zh, i)) { hit = v; break; }
      }
      if (hit) {
        out.push({ t: "word", s: hit.zh, v: hit });
        i += hit.zh.length;
      } else {
        let j = i + 1;
        while (j < zh.length && !vocab.some((v) => v.zh && zh.startsWith(v.zh, j))) j++;
        out.push({ t: "plain", s: zh.slice(i, j) });
        i = j;
      }
    }
    return out;
  }, [zh, vocab]);

  // === аудио ===
  const stopAudio = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setPlaying(false);
  }, []);
  function playAudio() {
    const src = audioUrl(base, f(text, "audio", "audioFile") || null);
    if (!src) return;
    if (playing) return stopAudio();
    stopAudio();
    const a = new Audio(src);
    a.playbackRate = speed;
    audioRef.current = a;
    setPlaying(true);
    const clear = () => setPlaying(false);
    a.onended = () => { if (audioRef.current === a) audioRef.current = null; clear(); };
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
    const cr = cont.getBoundingClientRect();
    const br = btn.getBoundingClientRect();
    setTapped({ v, x: br.left - cr.left + br.width / 2, y: br.top - cr.top });
  }

  function reset() { setTapped(null); }
  function goPrev() { if (ti > 0) { stopAudio(); reset(); setTi(ti - 1); } }
  function goNext() { stopAudio(); reset(); if (ti < total - 1) setTi(ti + 1); else onDone(); }

  useEffect(() => () => stopAudio(), [stopAudio]);

  if (!text) {
    return (
      <div className="bs-card">
        <div className="bs-soon"><div className="bs-soon-ic">📖</div><p>Энэ хичээлд богино эх алга.</p></div>
        <button className="bs-cta" onClick={onDone} style={{ marginTop: 4 }}>Дараагийнх →</button>
      </div>
    );
  }

  return (
    <div className="bs-card bs-txt">
      <div className="bs-vtop">
        <div className="bs-label" style={{ margin: 0 }}><span className="bs-dot" />Богино эх</div>
        <span className="bs-counter">{ti + 1} / {total}</span>
      </div>

      <div className="bs-txt-bar">
        <div className="bs-speeds" role="group" aria-label="Тоглуулах хурд">
          {SPEEDS.map((s) => (
            <button key={s} type="button" className={`bs-speed ${speed === s ? "bs-on" : ""}`}
              onClick={() => changeSpeed(s)} aria-pressed={speed === s}>{s}×</button>
          ))}
        </div>
        <button type="button" className={`bs-txt-play ${playing ? "bs-on" : ""}`} onClick={playAudio}
          aria-label={playing ? "Зогсоох" : "Сонсох"}>
          <span aria-hidden>{playing ? "⏸" : "▶"}</span> {playing ? "Зогсоож байна" : "Сонсох"}
        </button>
      </div>

      <div className="bs-txt-hint">Тодорсон шинэ үг дээр дарж орчуулгыг нь хараарай.</div>

      <div className="bs-txt-body" ref={bodyRef} onClick={(e) => { if (e.target === e.currentTarget) reset(); }}>
        <div className="bs-txt-zh">
          {tokens.map((tk, i) =>
            tk.t === "word" ? (
              <button key={i} type="button" className="bs-newword" onClick={(e) => tapWord(e, tk.v)}>{tk.s}</button>
            ) : (
              <span key={i}>{tk.s}</span>
            )
          )}
        </div>

        {showPinyin && py && <div className="bs-txt-py">{py}</div>}
        {showMn && mn && <div className="bs-txt-mn">{mn}</div>}

        {tapped && (
          <>
            <div className="bs-pop-back" onClick={reset} />
            <div className="bs-pop" style={{ left: tapped.x, top: tapped.y }}>
              <div className="bs-pop-zh">{tapped.v.zh}</div>
              {tapped.v.pinyin && <div className="bs-pop-py">{tapped.v.pinyin}</div>}
              <div className="bs-pop-mn">{tapped.v.mn}</div>
            </div>
          </>
        )}
      </div>

      <div className="bs-txt-toggles">
        <button type="button" className={`bs-tg ${showPinyin ? "bs-on" : ""}`}
          onClick={() => setShowPinyin((v) => !v)} aria-pressed={showPinyin}>
          Пиньинь {showPinyin ? "нуух" : "харах"}
        </button>
        <button type="button" className={`bs-tg ${showMn ? "bs-on" : ""}`}
          onClick={() => setShowMn((v) => !v)} aria-pressed={showMn}>
          Орчуулга {showMn ? "нуух" : "харах"}
        </button>
      </div>

      <div className="bs-navrow">
        <button className="bs-navbtn" onClick={goPrev} disabled={ti === 0}>← Өмнөх</button>
        <button className="bs-navbtn" onClick={goNext}>{ti === total - 1 ? "Дуусгах →" : "Дараагийнх →"}</button>
      </div>
    </div>
  );
}
