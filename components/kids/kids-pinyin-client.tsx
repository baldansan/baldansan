"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { PINYIN_STAGES, type PinyinAudioMap, type PinyinDrillItem, type PinyinStage } from "@/lib/kids/pinyin-path";
import { playAudioUrl, stopPronunciation } from "@/lib/tts/play-pronunciation";
import { addKidStars, getKidStars } from "@/lib/kids/stars";
import { PronunciationCheck } from "@/components/pronunciation/pronunciation-check";
import { MouthShape } from "@/components/pronunciation/mouth-shape";
import { ToneContourSvg } from "@/components/pronunciation/tone-contour-svg";
import { mouthShapeFor } from "@/lib/pronunciation/pinyin-course";
import "@/components/pronunciation/pronunciation-check.css";

const C = {
  card: "rounded-[28px] bg-white shadow-[0_10px_30px_rgba(120,80,0,0.10)] ring-1 ring-amber-100",
  btn: "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-lg font-extrabold shadow-md transition active:scale-95",
  primary: "bg-orange-500 text-white hover:bg-orange-600",
  soft: "bg-amber-100 text-amber-900 hover:bg-amber-200",
  ok: "bg-emerald-500 text-white",
};

const TONE_HAND = ["", "➡️ тэгш", "↗️ дээш", "↘️↗️ доош-дээш", "↘️ доош"];

function audioFor(map: PinyinAudioMap, it: PinyinDrillItem): string | null {
  return map[it.cell]?.[String(it.tone) as "1" | "2" | "3" | "4"] ?? null;
}

async function playSeq(urls: (string | null)[], gapMs = 250) {
  stopPronunciation();
  for (const u of urls) {
    if (!u) continue;
    await playAudioUrl(u);
    await new Promise((r) => setTimeout(r, gapMs));
  }
}

function hashShuffle<T>(items: T[], seed: string): T[] {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    h = (Math.imul(h, 1103515245) + 12345) >>> 0;
    const j = h % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/* ───────────── drill card ───────────── */

function DrillCard({ it, url, kind, onStar }: { it: PinyinDrillItem; url: string | null; kind: PinyinStage["kind"]; onStar: (n: number) => void }) {
  const [playKey, setPlayKey] = useState(0);
  const [done, setDone] = useState(false);
  const play = () => {
    setPlayKey((k) => k + 1);
    if (url) void playAudioUrl(url);
  };
  return (
    <div className={`${C.card} flex flex-col items-center gap-3 p-5 text-center ${done ? "ring-2 ring-emerald-300" : ""}`}>
      <div className="flex items-center gap-4">
        {kind === "vowels" ? <MouthShape shape={mouthShapeFor(it.py.replace(/[āáǎàōóǒòēéěèīíǐìūúǔùǖǘǚǜ]/g, (m) => "aoeiuü"["āáǎàōóǒòēéěèīíǐìūúǔùǖǘǚǜ".indexOf(m) >> 2] ?? m))} size={84} /> : null}
        {kind === "tones" ? <ToneContourSvg tone={it.tone} playKey={playKey} width={120} height={64} /> : null}
        <button type="button" onClick={play} className="text-6xl font-extrabold leading-none text-[#2b1a05]">
          {it.py}
        </button>
      </div>
      <div className="text-sm font-bold text-[#6b3f1d]">
        <span lang="zh-CN" className="mr-2 text-xl text-orange-500">{it.zh}</span>
        {it.mn ? <span>— {it.mn}</span> : null}
      </div>
      {kind === "tones" ? <div className="text-base font-extrabold text-amber-800">{TONE_HAND[it.tone]}</div> : null}
      {it.tip ? <div className="text-sm text-amber-800">💡 {it.tip}</div> : null}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button type="button" onClick={play} className={`${C.btn} ${C.primary} px-4 py-2 text-base`}>
          🔊 Сонс
        </button>
        <PronunciationCheck
          text={it.zh}
          pinyin={it.py}
          noPoints
          label="🎤 Чи хэл"
          onResult={(s) => {
            if (s.percent >= 70 && !done) {
              setDone(true);
              onStar(1);
            }
          }}
        />
      </div>
    </div>
  );
}

/* ───────────── chant ───────────── */

function ChantStage({ stage, map, onStar }: { stage: PinyinStage; map: PinyinAudioMap; onStar: (n: number) => void }) {
  const [playing, setPlaying] = useState<number | null>(null);
  const [doneLines, setDoneLines] = useState<Set<number>>(new Set());
  const playLine = async (i: number) => {
    setPlaying(i);
    await playSeq(stage.groups[i].items.map((it) => audioFor(map, it)), 200);
    setPlaying(null);
  };
  const playAll = async () => {
    for (let i = 0; i < stage.groups.length; i++) {
      setPlaying(i);
      await playSeq(stage.groups[i].items.map((it) => audioFor(map, it)), 200);
      await new Promise((r) => setTimeout(r, 400));
    }
    setPlaying(null);
  };
  return (
    <div className="flex flex-col gap-3">
      <button type="button" onClick={() => void playAll()} className={`${C.btn} ${C.primary} self-center`}>
        ▶ Бүгдийг сонс
      </button>
      {stage.groups.map((g, i) => (
        <div key={g.label} className={`${C.card} p-4 ${playing === i ? "ring-4 ring-orange-300" : ""} ${doneLines.has(i) ? "bg-emerald-50" : ""}`}>
          <button type="button" onClick={() => void playLine(i)} className="flex w-full flex-wrap items-baseline justify-center gap-x-4 gap-y-1">
            {g.items.map((it) => (
              <span key={it.py} className="text-center">
                <span className="block text-4xl font-extrabold text-[#2b1a05]">{it.py}</span>
                <span className="block text-base text-orange-500" lang="zh-CN">
                  {it.zh}
                </span>
              </span>
            ))}
          </button>
          <div className="mt-2 flex justify-center">
            <PronunciationCheck
              text={g.items.map((it) => it.zh).join("")}
              pinyin={g.items.map((it) => it.py).join(" ")}
              noPoints
              label="🎤 Энэ мөрийг чи хэл"
              onResult={(s) => {
                if (s.percent >= 60 && !doneLines.has(i)) {
                  setDoneLines((d) => new Set(d).add(i));
                  onStar(2);
                }
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ───────────── quiz ───────────── */

function QuizStage({ stage, map, onStar }: { stage: PinyinStage; map: PinyinAudioMap; onStar: (n: number) => void }) {
  const [mode, setMode] = useState<0 | 1>(0);
  const pool = stage.groups[mode].items;
  const rounds = useMemo(() => hashShuffle(pool, `q${mode}`).slice(0, 8), [pool, mode]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [finished, setFinished] = useState(false);
  const cur = rounds[i];
  const options = useMemo(() => {
    if (!cur) return [];
    const others = mode === 0 ? pool.filter((x) => x.cell === cur.cell && x.py !== cur.py) : hashShuffle(pool.filter((x) => x.py !== cur.py), `o${i}`).slice(0, 2);
    return hashShuffle([cur, ...others.slice(0, 3)], `s${i}${cur.py}`);
  }, [cur, i, mode, pool]);
  const url = cur ? audioFor(map, cur) : null;
  useEffect(() => {
    if (url) void playAudioUrl(url);
  }, [url]);
  const reset = (m: 0 | 1) => {
    setMode(m);
    setI(0);
    setPicked(null);
    setCorrect(0);
    setFinished(false);
  };
  const pick = (py: string) => {
    if (picked || !cur) return;
    setPicked(py);
    const ok = py === cur.py;
    if (ok) setCorrect((c) => c + 1);
    setTimeout(() => {
      if (i + 1 >= rounds.length) {
        setFinished(true);
        onStar(Math.max(1, Math.round((3 * (correct + (ok ? 1 : 0))) / rounds.length)));
      } else {
        setI(i + 1);
        setPicked(null);
      }
    }, 900);
  };
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-2">
        <button type="button" onClick={() => reset(0)} className={`${C.btn} ${mode === 0 ? C.primary : C.soft} px-4 py-2 text-base`}>
          🎵 Аялгуу
        </button>
        <button type="button" onClick={() => reset(1)} className={`${C.btn} ${mode === 1 ? C.primary : C.soft} px-4 py-2 text-base`}>
          🅱️ Гийгүүлэгч
        </button>
      </div>
      {finished ? (
        <div className={`${C.card} p-6 text-center`}>
          <div className="text-5xl">🏆</div>
          <div className="mt-2 text-2xl font-extrabold text-[#2b1a05]">
            {correct} / {rounds.length} зөв!
          </div>
          <button type="button" onClick={() => reset(mode)} className={`${C.btn} ${C.primary} mt-3`}>
            Дахин тоглох
          </button>
        </div>
      ) : cur ? (
        <>
          <div className="text-sm font-bold text-amber-800">
            {i + 1} / {rounds.length}
          </div>
          <button type="button" onClick={() => url && void playAudioUrl(url)} className={`${C.btn} ${C.primary}`}>
            🔊 Сонс
          </button>
          <div className="grid w-full grid-cols-2 gap-3">
            {options.map((o) => {
              const state = !picked ? "" : o.py === cur.py ? "bg-emerald-100 ring-4 ring-emerald-400" : o.py === picked ? "bg-rose-100 ring-4 ring-rose-400" : "opacity-50";
              return (
                <button key={o.py} type="button" onClick={() => pick(o.py)} className={`${C.card} py-5 text-4xl font-extrabold text-[#2b1a05] ${state}`}>
                  {o.py}
                </button>
              );
            })}
          </div>
          {picked ? <div className={`text-2xl font-extrabold ${picked === cur.py ? "text-emerald-600" : "text-rose-600"}`}>{picked === cur.py ? "Зөв! 🎉" : `Зөв нь: ${cur.py}`}</div> : null}
        </>
      ) : null}
    </div>
  );
}

/* ───────────── main ───────────── */

export function KidsPinyinClient({ audio }: { audio: PinyinAudioMap }) {
  const [idx, setIdx] = useState(0);
  const [stars, setStars] = useState(0);
  const stage = PINYIN_STAGES[idx];
  const topRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setStars(getKidStars()));
    return () => cancelAnimationFrame(raf);
  }, []);
  const earn = useCallback((n: number) => setStars(addKidStars("pinyin-path", n)), []);
  const go = (i: number) => {
    stopPronunciation();
    setIdx(i);
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#FFF7E6] pb-24">
      <div ref={topRef} className="sticky top-0 z-20 border-b border-amber-100 bg-[#FFF7E6]/95 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-2 px-4 py-2">
          <Link href="/courses/yct-1" className="rounded-full bg-white px-3 py-1.5 text-sm font-bold text-amber-900 ring-1 ring-amber-200">
            ← Гарах
          </Link>
          <div className="flex items-center gap-1">
            {PINYIN_STAGES.map((s, i) => (
              <button key={s.id} type="button" onClick={() => go(i)} title={s.title} className={`flex h-9 w-9 items-center justify-center rounded-full text-lg ${i === idx ? "bg-orange-500 shadow" : "bg-white ring-1 ring-amber-200"}`}>
                {s.emoji}
              </button>
            ))}
          </div>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-extrabold text-amber-900">⭐ {stars}</span>
        </div>
      </div>

      <div className="mx-auto max-w-xl px-4 pt-5">
        <h1 className="text-center text-2xl font-extrabold text-[#2b1a05]">
          {stage.emoji} {stage.title}
        </h1>
        <p className="mb-4 mt-1 text-center text-base font-semibold text-[#6b3f1d]">{stage.intro}</p>

        {stage.kind === "chant" ? (
          <ChantStage stage={stage} map={audio} onStar={earn} />
        ) : stage.kind === "quiz" ? (
          <QuizStage stage={stage} map={audio} onStar={earn} />
        ) : (
          <div className="flex flex-col gap-5">
            {stage.groups.map((g) => (
              <div key={g.label}>
                <div className="mb-2 text-center text-lg font-extrabold text-orange-600">{g.label}</div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {g.items.map((it) => (
                    <DrillCard key={it.py + it.zh} it={it} url={audioFor(audio, it)} kind={stage.kind} onStar={earn} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-between">
          <button type="button" disabled={idx === 0} onClick={() => go(idx - 1)} className={`${C.btn} ${C.soft} disabled:opacity-40`}>
            ◀ Өмнөх
          </button>
          {idx + 1 < PINYIN_STAGES.length ? (
            <button type="button" onClick={() => go(idx + 1)} className={`${C.btn} ${C.primary}`}>
              Дараах ▶
            </button>
          ) : (
            <Link href="/kids/lesson/yct-1-l01" className={`${C.btn} ${C.ok}`}>
              YCT 1-р хичээл рүү ➜
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
