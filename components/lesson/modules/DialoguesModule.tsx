"use client";
// components/lesson/modules/DialoguesModule.tsx  (B хувилбар + шинэ үг тодруулга)
// Чат хэлбэрийн яриа. Мөр бүр: speaker + пиньинь + 汉字 + монгол (товчгүй).
// Дээд талд нэг "Бүгдийг сонсох" товч — номын ЖИНХЭНЭ бүтэн дуу. TTS ОГТ хэрэглэхгүй.
// Мөрийн ханзан доторх ШИНЭ ҮГС (хичээлийн vocab) ногоон тодорно — дарвал пиньинь+
// монгол попап (богино эх уншигчтай ижил зарчим).
// Гэрээ: { lesson, onDone }.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Lesson } from "@/types/lesson";
import "./dialogues-module.css";
import "./texts-module.css"; // bs-newword, bs-pop загваруудыг дахин ашиглана

type Speed = 0.5 | 0.75 | 1;
const SPEEDS: Speed[] = [0.5, 0.75, 1];

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

export default function DialoguesModule({
  lesson,
  onDone,
}: {
  lesson: Lesson;
  onDone: () => void;
}) {
  const dialogues: any[] = (lesson as any).dialogues ?? [];
  const base = (lesson as any).audio_base_path;

  const vocab: Vocab[] = useMemo(() => {
    const raw: any[] = (lesson as any).vocabulary ?? [];
    return raw
      .map((v) => ({ zh: f(v, "zh", "chinese"), pinyin: f(v, "pinyin"), mn: f(v, "mn", "mongolian") }))
      .filter((v) => v.zh)
      .sort((a, b) => b.zh.length - a.zh.length);
  }, [lesson]);

  const tokenize = useCallback((zh: string): Tok[] => {
    if (!zh) return [];
    const out: Tok[] = [];
    let i = 0;
    while (i < zh.length) {
      let hit: Vocab | null = null;
      for (const v of vocab) { if (v.zh && zh.startsWith(v.zh, i)) { hit = v; break; } }
      if (hit) { out.push({ t: "word", s: hit.zh, v: hit }); i += hit.zh.length; }
      else {
        let j = i + 1;
        while (j < zh.length && !vocab.some((v) => v.zh && zh.startsWith(v.zh, j))) j++;
        out.push({ t: "plain", s: zh.slice(i, j) }); i = j;
      }
    }
    return out;
  }, [vocab]);

  const [di, setDi] = useState(0);
  const [speed, setSpeed] = useState<Speed>(1);
  const [playing, setPlaying] = useState(false);
  const [tapped, setTapped] = useState<{ v: Vocab; x: number; y: number } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chatRef = useRef<HTMLDivElement | null>(null);

  const dialogue = dialogues[di];
  const total = dialogues.length;
  const fullSrc = audioUrl(base, f(dialogue, "audio", "audioFile") || null);

  const sides = useMemo(() => {
    const map: Record<string, "l" | "r"> = {};
    let order = 0;
    for (const ln of dialogue?.lines ?? []) {
      const sp = f(ln, "speaker");
      if (!(sp in map)) { map[sp] = order % 2 === 0 ? "l" : "r"; order++; }
    }
    return map;
  }, [dialogue]);

  const stopAll = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setPlaying(false);
  }, []);

  function playFull() {
    if (!fullSrc) return;
    if (playing) return stopAll();
    stopAll();
    const a = new Audio(fullSrc);
    a.playbackRate = speed;
    audioRef.current = a;
    setPlaying(true);
    const clear = () => setPlaying(false);
    a.onended = () => { if (audioRef.current === a) audioRef.current = null; clear(); };
    a.onerror = clear;
    void a.play().catch(clear);
  }
  function changeSpeed(s: Speed) { setSpeed(s); if (audioRef.current) audioRef.current.playbackRate = s; }

  function tapWord(e: React.MouseEvent, v: Vocab) {
    const cont = chatRef.current; const btn = e.currentTarget as HTMLElement;
    if (!cont) return;
    const cr = cont.getBoundingClientRect(); const br = btn.getBoundingClientRect();
    setTapped({ v, x: br.left - cr.left + br.width / 2, y: br.top - cr.top });
  }
  const clearPop = () => setTapped(null);

  function goPrev() { if (di > 0) { stopAll(); clearPop(); setDi(di - 1); } }
  function goNext() { stopAll(); clearPop(); if (di < total - 1) setDi(di + 1); else onDone(); }

  useEffect(() => () => stopAll(), [stopAll]);
  useEffect(() => { stopAll(); clearPop(); }, [di, stopAll]);

  if (!dialogue) {
    return (
      <div className="bs-card">
        <div className="bs-soon"><div className="bs-soon-ic">💬</div><p>Энэ хичээлд яриа алга.</p></div>
        <button className="bs-cta" onClick={onDone} style={{ marginTop: 4 }}>Дараагийнх →</button>
      </div>
    );
  }

  return (
    <div className="bs-card bs-dlg">
      <div className="bs-vtop">
        <div className="bs-label" style={{ margin: 0 }}><span className="bs-dot" />Яриа</div>
        <span className="bs-counter">{di + 1} / {total}</span>
      </div>

      {f(dialogue, "title_mn", "title") && <div className="bs-dlg-title">{f(dialogue, "title_mn", "title")}</div>}
      {f(dialogue, "scene_mn") && <div className="bs-dlg-scene">{f(dialogue, "scene_mn")}</div>}

      <div className="bs-dlg-bar">
        <div className="bs-speeds" role="group" aria-label="Тоглуулах хурд">
          {SPEEDS.map((s) => (
            <button key={s} type="button" className={`bs-speed ${speed === s ? "bs-on" : ""}`}
              onClick={() => changeSpeed(s)} aria-pressed={speed === s}>{s}×</button>
          ))}
        </div>
        {fullSrc && (
          <button type="button" className={`bs-dlg-full ${playing ? "bs-on" : ""}`} onClick={playFull}
            aria-label={playing ? "Зогсоох" : "Бүгдийг сонсох"}>
            <span aria-hidden>{playing ? "⏸" : "▶"}</span> {playing ? "Зогсоож байна" : "Бүгдийг сонсох"}
          </button>
        )}
      </div>

      <div className="bs-txt-hint">Тодорсон шинэ үг дээр дарж орчуулгыг нь хараарай.</div>

      <div className="bs-chat" ref={chatRef} style={{ position: "relative" }}
        onClick={(e) => { if (e.target === e.currentTarget) clearPop(); }}>
        {dialogue.lines.map((line: any, idx: number) => {
          const sp = f(line, "speaker");
          const side = sides[sp] ?? "l";
          const prev = dialogue.lines[idx - 1];
          const showName = !prev || f(prev, "speaker") !== sp;
          const toks = tokenize(f(line, "zh", "chinese"));
          return (
            <div key={idx} className={`bs-row bs-${side}`}>
              <div className="bs-bubble">
                {showName && <div className="bs-spk">{sp}</div>}
                <div className="bs-line">
                  <div className="bs-line-tx">
                    <div className="bs-py">{f(line, "pinyin")}</div>
                    <div className="bs-zh">
                      {toks.map((tk, k) =>
                        tk.t === "word" ? (
                          <button key={k} type="button" className="bs-newword" onClick={(e) => tapWord(e, tk.v)}>{tk.s}</button>
                        ) : (
                          <span key={k}>{tk.s}</span>
                        )
                      )}
                    </div>
                    <div className="bs-mn">{f(line, "mn", "mongolian")}</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {tapped && (
          <>
            <div className="bs-pop-back" onClick={clearPop} />
            <div className="bs-pop" style={{ left: tapped.x, top: tapped.y }}>
              <div className="bs-pop-zh">{tapped.v.zh}</div>
              {tapped.v.pinyin && <div className="bs-pop-py">{tapped.v.pinyin}</div>}
              <div className="bs-pop-mn">{tapped.v.mn}</div>
            </div>
          </>
        )}
      </div>

      <div className="bs-navrow">
        <button className="bs-navbtn" onClick={goPrev} disabled={di === 0}>← Өмнөх</button>
        <button className="bs-navbtn" onClick={goNext}>{di === total - 1 ? "Дуусгах →" : "Дараагийнх →"}</button>
      </div>
    </div>
  );
}
