"use client";

/**
 * Хүүхдийн тоглоомууд — хичээлийн тоглуулагч болон номын «Том шалгалт» хоёуланд хэрэглэнэ.
 * Бүх тоглоом `seed` авна (товч дарах үед үүсгэнэ) — холилт render бүрт өөрчлөгдөхгүй.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import type { KidsWord } from "@/lib/kids/lesson-data";
import { playAudioUrl, speakWithSavedSettings, stopPronunciation } from "@/lib/tts/play-pronunciation";

export type GameResult = { correct: number; total: number };
export type KidsSentence = { zh: string; pinyin: string; mn: string };

export const C = {
  bg: "bg-[#FFF7E6]",
  card: "rounded-[28px] bg-white shadow-[0_10px_30px_rgba(120,80,0,0.10)] ring-1 ring-amber-100",
  btn: "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-lg font-extrabold shadow-md transition active:scale-95",
  primary: "bg-orange-500 text-white hover:bg-orange-600",
  soft: "bg-amber-100 text-amber-900 hover:bg-amber-200",
  ok: "bg-emerald-500 text-white",
  bad: "bg-rose-500 text-white",
};

export function hashShuffle<T>(items: T[], seed: string): T[] {
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

export async function say(word: { zh: string; audioUrl?: string | null }) {
  stopPronunciation();
  if (word.audioUrl) {
    const r = await playAudioUrl(word.audioUrl);
    if (r.ok) return;
  }
  await speakWithSavedSettings(word.zh, "zh-CN");
}

export function BigAudioButton({ label, onClick, playing }: { label: string; onClick: () => void; playing?: boolean }) {
  return (
    <button type="button" onClick={onClick} className={`${C.btn} ${C.primary}`}>
      <span className="text-2xl">{playing ? "⏸" : "🔊"}</span> {label}
    </button>
  );
}

function Progress({ i, total }: { i: number; total: number }) {
  return (
    <div className="flex w-full items-center gap-2">
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-amber-100">
        <div className="h-full rounded-full bg-orange-400 transition-all" style={{ width: `${(100 * i) / Math.max(1, total)}%` }} />
      </div>
      <span className="text-sm font-bold text-amber-800">
        {Math.min(i + 1, total)} / {total}
      </span>
    </div>
  );
}

function Verdict({ ok, answer }: { ok: boolean; answer: string }) {
  return <div className={`text-2xl font-extrabold ${ok ? "text-emerald-600" : "text-rose-600"}`}>{ok ? "Зөв! 🎉" : `Зөв нь: ${answer}`}</div>;
}

const optionRing = (isAnswer: boolean, isPicked: boolean, picked: boolean) =>
  !picked ? "" : isAnswer ? "bg-emerald-100 ring-4 ring-emerald-400" : isPicked ? "bg-rose-100 ring-4 ring-rose-400" : "opacity-50";

/** Сонсоод зураг сонгох — үгийн аудио → 3 зургаас зөвийг */
export function ListenPickGame({ words, seed, onDone }: { words: KidsWord[]; seed: string; onDone: (r: GameResult) => void }) {
  const pool = useMemo(() => words.filter((w) => w.imageUrl), [words]);
  const rounds = useMemo(() => hashShuffle(pool, `listen${seed}`).slice(0, 6), [pool, seed]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const cur = rounds[i];
  const options = useMemo(() => {
    if (!cur) return [];
    const others = hashShuffle(pool.filter((w) => w.zh !== cur.zh), `o${i}${seed}`).slice(0, 2);
    return hashShuffle([cur, ...others], `s${i}${cur.zh}${seed}`);
  }, [cur, i, pool, seed]);
  useEffect(() => {
    if (cur) void say(cur);
  }, [cur]);
  if (pool.length < 3) return <p className="text-center text-amber-800">Энэ тоглоомд зурагтай үг хүрэлцэхгүй байна.</p>;
  if (!cur) return null;
  const pick = (zh: string) => {
    if (picked) return;
    setPicked(zh);
    const ok = zh === cur.zh;
    if (ok) setCorrect((c) => c + 1);
    void speakWithSavedSettings(ok ? "对！" : cur.zh, "zh-CN");
    setTimeout(() => {
      if (i + 1 >= rounds.length) onDone({ correct: correct + (ok ? 1 : 0), total: rounds.length });
      else {
        setI(i + 1);
        setPicked(null);
      }
    }, 1100);
  };
  return (
    <div className="flex flex-col items-center gap-4">
      <Progress i={i} total={rounds.length} />
      <BigAudioButton label="Сонс" onClick={() => void say(cur)} />
      <div className="grid w-full grid-cols-3 gap-3">
        {options.map((o) => {
          const state = !picked ? "" : o.zh === cur.zh ? "ring-4 ring-emerald-400" : o.zh === picked ? "ring-4 ring-rose-400 opacity-70" : "opacity-50";
          return (
            <button key={o.zh} type="button" onClick={() => pick(o.zh)} className={`${C.card} flex aspect-square items-center justify-center p-2 ${state}`}>
              <img src={o.imageUrl ?? ""} alt="" className="max-h-full max-w-full object-contain" />
            </button>
          );
        })}
      </div>
      {picked ? <Verdict ok={picked === cur.zh} answer={`${cur.zh} (${cur.mn})`} /> : null}
    </div>
  );
}

/** Сонсоод ханз сонгох — аудио → 4 ханзаас зөвийг (зураг шаардахгүй) */
export function ListenWordGame({ words, seed, onDone, rounds: maxRounds = 6 }: { words: KidsWord[]; seed: string; onDone: (r: GameResult) => void; rounds?: number }) {
  const rounds = useMemo(() => hashShuffle(words, `lw${seed}`).slice(0, maxRounds), [words, seed, maxRounds]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const cur = rounds[i];
  const options = useMemo(() => {
    if (!cur) return [];
    const others = hashShuffle(words.filter((w) => w.zh !== cur.zh), `lwo${i}${seed}`).slice(0, 3);
    return hashShuffle([cur, ...others], `lws${i}${seed}`);
  }, [cur, i, words, seed]);
  useEffect(() => {
    if (cur) void say(cur);
  }, [cur]);
  if (words.length < 4 || !cur) return null;
  const pick = (zh: string) => {
    if (picked) return;
    setPicked(zh);
    const ok = zh === cur.zh;
    if (ok) setCorrect((c) => c + 1);
    setTimeout(() => {
      if (i + 1 >= rounds.length) onDone({ correct: correct + (ok ? 1 : 0), total: rounds.length });
      else {
        setI(i + 1);
        setPicked(null);
      }
    }, 1200);
  };
  return (
    <div className="flex flex-col items-center gap-4">
      <Progress i={i} total={rounds.length} />
      <div className="text-7xl">👂</div>
      <BigAudioButton label="Сонс" onClick={() => void say(cur)} />
      <p className="text-base font-bold text-[#6b3f1d]">Сонссон үгээ ол!</p>
      <div className="grid w-full grid-cols-2 gap-3">
        {options.map((o) => (
          <button
            key={o.zh}
            type="button"
            onClick={() => pick(o.zh)}
            className={`${C.card} flex flex-col items-center py-4 ${optionRing(o.zh === cur.zh, o.zh === picked, picked != null)}`}
          >
            <span className="text-3xl font-extrabold text-[#2b1a05]" lang="zh-CN">
              {o.zh}
            </span>
            {picked ? <span className="text-sm font-bold text-[#6b3f1d]">{o.mn}</span> : null}
          </button>
        ))}
      </div>
      {picked ? <Verdict ok={picked === cur.zh} answer={`${cur.zh} (${cur.mn})`} /> : null}
    </div>
  );
}

/** Утгыг ол — ханз → монгол утга, ээлжлэн монгол → ханз */
export function MeaningGame({ words, seed, onDone, rounds: maxRounds = 8 }: { words: KidsWord[]; seed: string; onDone: (r: GameResult) => void; rounds?: number }) {
  const rounds = useMemo(() => hashShuffle(words, `mg${seed}`).slice(0, maxRounds), [words, seed, maxRounds]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const cur = rounds[i];
  const zhToMn = i % 2 === 0;
  const options = useMemo(() => {
    if (!cur) return [];
    const others = hashShuffle(
      words.filter((w) => w.zh !== cur.zh && w.mn !== cur.mn),
      `mgo${i}${seed}`
    ).slice(0, 3);
    return hashShuffle([cur, ...others], `mgs${i}${seed}`);
  }, [cur, i, words, seed]);
  useEffect(() => {
    if (cur && zhToMn) void say(cur);
  }, [cur, zhToMn]);
  if (words.length < 4 || !cur) return null;
  const pick = (zh: string) => {
    if (picked) return;
    setPicked(zh);
    const ok = zh === cur.zh;
    if (ok) setCorrect((c) => c + 1);
    if (!zhToMn) void say(cur);
    setTimeout(() => {
      if (i + 1 >= rounds.length) onDone({ correct: correct + (ok ? 1 : 0), total: rounds.length });
      else {
        setI(i + 1);
        setPicked(null);
      }
    }, 1200);
  };
  return (
    <div className="flex flex-col items-center gap-4">
      <Progress i={i} total={rounds.length} />
      <button type="button" onClick={() => void say(cur)} className={`${C.card} flex min-h-40 w-full flex-col items-center justify-center gap-2 p-5`}>
        {zhToMn ? (
          <>
            {cur.imageUrl ? <img src={cur.imageUrl} alt="" className="h-24 object-contain" /> : null}
            <span className="text-sm font-semibold text-orange-500">{cur.pinyin}</span>
            <span className="text-6xl font-extrabold text-[#2b1a05]" lang="zh-CN">
              {cur.zh}
            </span>
          </>
        ) : (
          <span className="text-3xl font-extrabold text-[#6b3f1d]">{cur.mn}</span>
        )}
      </button>
      <p className="text-base font-bold text-[#6b3f1d]">{zhToMn ? "Монголоор юу гэсэн үг вэ?" : "Хятадаар аль нь вэ?"}</p>
      <div className="grid w-full grid-cols-2 gap-3">
        {options.map((o) => (
          <button
            key={o.zh}
            type="button"
            onClick={() => pick(o.zh)}
            className={`${C.card} px-2 py-4 font-extrabold ${zhToMn ? "text-lg text-[#6b3f1d]" : "text-3xl text-[#2b1a05]"} ${optionRing(o.zh === cur.zh, o.zh === picked, picked != null)}`}
            lang={zhToMn ? undefined : "zh-CN"}
          >
            {zhToMn ? o.mn : o.zh}
          </button>
        ))}
      </div>
      {picked ? <Verdict ok={picked === cur.zh} answer={zhToMn ? cur.mn : cur.zh} /> : null}
    </div>
  );
}

const PUNCT = /[，。！？、；：“”‘’《》（）…—·,.!?;:'"()\s]/g;

/** Өгүүлбэрийг үг үгээр хуваана (Intl.Segmenter; байхгүй бол ханз ханзаар). */
export function segmentSentence(zh: string): string[] {
  const clean = zh.replace(PUNCT, "");
  if (!clean) return [];
  try {
    if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
      const seg = new Intl.Segmenter("zh", { granularity: "word" });
      const parts = [...seg.segment(clean)].map((s) => s.segment).filter(Boolean);
      if (parts.length > 1) return parts;
    }
  } catch {
    /* ignore */
  }
  return [...clean];
}

/** Тоглоход тохирох өгүүлбэрүүд: 3–7 хэсэг, давхардаагүй. */
export function pickBuildableSentences(sentences: KidsSentence[]): KidsSentence[] {
  const seen = new Set<string>();
  const out: KidsSentence[] = [];
  for (const s of sentences) {
    const key = s.zh.replace(PUNCT, "");
    if (!key || !s.mn || seen.has(key)) continue;
    // Хоёр өгүүлбэр нийлсэн мөр (дунд нь 。！？) эвлүүлэхэд хоёрдмол утгатай — алгасна.
    if (/[。！？!?].*[^。！？!?…\s”’）)]/.test(s.zh.trim())) continue;
    const n = segmentSentence(s.zh).length;
    if (n < 3 || n > 7 || key.length > 16) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

/** Өгүүлбэр эвлүүлэх — холилдсон үгсийг зөв дараалалд оруулна */
export function SentenceGame({ sentences, seed, onDone }: { sentences: KidsSentence[]; seed: string; onDone: (r: GameResult) => void }) {
  const rounds = useMemo(() => hashShuffle(pickBuildableSentences(sentences), `sg${seed}`).slice(0, 4), [sentences, seed]);
  const [i, setI] = useState(0);
  const [chosen, setChosen] = useState<number[]>([]);
  const [state, setState] = useState<"play" | "ok" | "bad">("play");
  const [correct, setCorrect] = useState(0);
  const [tries, setTries] = useState(0);
  const cur = rounds[i];
  const tiles = useMemo(() => {
    if (!cur) return [];
    const parts = segmentSentence(cur.zh).map((t, k) => ({ t, k }));
    let mixed = hashShuffle(parts, `sgt${i}${seed}`);
    if (mixed.every((p, k) => p.k === k)) mixed = [...mixed.slice(1), mixed[0]];
    return mixed;
  }, [cur, i, seed]);
  if (!cur) return null;
  const target = segmentSentence(cur.zh).join("");
  const built = chosen.map((k) => tiles[k].t).join("");
  const advance = (ok: boolean) => {
    setTimeout(() => {
      if (i + 1 >= rounds.length) onDone({ correct: correct + (ok ? 1 : 0), total: rounds.length });
      else {
        setI(i + 1);
        setChosen([]);
        setState("play");
        setTries(0);
      }
    }, 1500);
  };
  const tap = (k: number) => {
    if (state !== "play" || chosen.includes(k)) return;
    const next = [...chosen, k];
    setChosen(next);
    void speakWithSavedSettings(tiles[k].t, "zh-CN");
    if (next.length === tiles.length) {
      const ok = next.map((x) => tiles[x].t).join("") === target;
      if (ok) {
        setState("ok");
        if (tries === 0) setCorrect((c) => c + 1);
        void speakWithSavedSettings(cur.zh, "zh-CN");
        advance(tries === 0);
      } else {
        const nextTries = tries + 1;
        setTries(nextTries);
        setState("bad");
        if (nextTries >= 2) {
          advance(false);
        } else {
          setTimeout(() => {
            setChosen([]);
            setState("play");
          }, 900);
        }
      }
    }
  };
  const undo = () => {
    if (state === "play") setChosen((c) => c.slice(0, -1));
  };
  return (
    <div className="flex flex-col items-center gap-4">
      <Progress i={i} total={rounds.length} />
      <div className={`${C.card} w-full p-4 text-center`}>
        <div className="text-sm font-bold text-amber-700">Энэ өгүүлбэрийг хятадаар эвлүүл:</div>
        <div className="mt-1 text-xl font-extrabold text-[#6b3f1d]">{cur.mn}</div>
      </div>
      <button
        type="button"
        onClick={undo}
        className={`flex min-h-20 w-full flex-wrap items-center justify-center gap-2 rounded-[24px] border-4 border-dashed p-3 ${
          state === "ok" ? "border-emerald-400 bg-emerald-50" : state === "bad" ? "border-rose-400 bg-rose-50" : "border-amber-200 bg-white"
        }`}
      >
        {chosen.length ? (
          chosen.map((k) => (
            <span key={k} className="rounded-2xl bg-orange-100 px-3 py-2 text-2xl font-extrabold text-[#2b1a05]" lang="zh-CN">
              {tiles[k].t}
            </span>
          ))
        ) : (
          <span className="text-sm font-bold text-amber-600">Доорх үгсийг дарааллаар нь дар</span>
        )}
      </button>
      <div className="flex flex-wrap justify-center gap-3">
        {tiles.map((tile, k) => (
          <button
            key={k}
            type="button"
            onClick={() => tap(k)}
            disabled={chosen.includes(k)}
            className={`${C.card} px-4 py-3 text-2xl font-extrabold text-[#2b1a05] disabled:opacity-25`}
            lang="zh-CN"
          >
            {tile.t}
          </button>
        ))}
      </div>
      {state === "ok" ? <div className="text-2xl font-extrabold text-emerald-600">Зөв! 🎉</div> : null}
      {state === "bad" ? (
        <div className="text-center text-lg font-extrabold text-rose-600">
          {tries >= 2 ? (
            <>
              Зөв нь: <span lang="zh-CN">{cur.zh}</span>
            </>
          ) : (
            "Дахиад оролдоорой 🙂"
          )}
        </div>
      ) : null}
      {built && state === "play" ? <div className="text-xs text-amber-700">Буруу дарсан бол дээрх хайрцгийг дарж буцаана</div> : null}
    </div>
  );
}

/** Хурдны тоглоом — 40 секундэд «ханз = утга» зөв үү, буруу юу */
export function SpeedGame({ words, seed, onDone, seconds = 40 }: { words: KidsWord[]; seed: string; onDone: (r: GameResult) => void; seconds?: number }) {
  const deck = useMemo(() => {
    const out: { w: KidsWord; shown: string; truth: boolean }[] = [];
    for (let round = 0; round < 4; round++) {
      const order = hashShuffle(words, `sp${seed}${round}`);
      order.forEach((w, k) => {
        const wrong = hashShuffle(
          words.filter((x) => x.mn !== w.mn),
          `spw${seed}${round}${k}`
        )[0];
        const truth = ((k + round) % 2 === 0) || !wrong;
        out.push({ w, shown: truth ? w.mn : wrong.mn, truth });
      });
    }
    return out;
  }, [words, seed]);
  const [i, setI] = useState(0);
  const [left, setLeft] = useState(seconds);
  const [flash, setFlash] = useState<"ok" | "bad" | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const finished = useRef(false);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });
  useEffect(() => {
    const t = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (left === 0 && !finished.current) {
      finished.current = true;
      onDoneRef.current({ correct: score.correct, total: Math.max(score.total, 1) });
    }
  }, [left, score]);
  const cur = deck[i % Math.max(1, deck.length)];
  if (words.length < 4 || !cur) return null;
  const answer = (v: boolean) => {
    if (left === 0) return;
    const ok = v === cur.truth;
    setScore((p) => ({ correct: p.correct + (ok ? 1 : 0), total: p.total + 1 }));
    setFlash(ok ? "ok" : "bad");
    setTimeout(() => setFlash(null), 250);
    setI((n) => n + 1);
  };
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full items-center gap-3">
        <span className="text-2xl">⏱</span>
        <div className="h-4 flex-1 overflow-hidden rounded-full bg-amber-100">
          <div className={`h-full rounded-full transition-all duration-1000 ease-linear ${left <= 10 ? "bg-rose-400" : "bg-emerald-400"}`} style={{ width: `${(100 * left) / seconds}%` }} />
        </div>
        <span className="w-8 text-right text-lg font-extrabold text-[#2b1a05]">{left}</span>
      </div>
      <div className="text-lg font-extrabold text-emerald-600">✅ {score.correct}</div>
      <div
        className={`${C.card} flex min-h-52 w-full flex-col items-center justify-center gap-2 p-5 transition ${
          flash === "ok" ? "ring-4 ring-emerald-400" : flash === "bad" ? "ring-4 ring-rose-400" : ""
        }`}
      >
        <span className="text-sm font-semibold text-orange-500">{cur.w.pinyin}</span>
        <span className="text-6xl font-extrabold text-[#2b1a05]" lang="zh-CN">
          {cur.w.zh}
        </span>
        <span className="text-2xl font-extrabold text-[#6b3f1d]">= {cur.shown} ?</span>
      </div>
      <div className="flex gap-4">
        <button type="button" onClick={() => answer(true)} className={`${C.btn} ${C.ok} px-10 text-3xl`}>
          ✓
        </button>
        <button type="button" onClick={() => answer(false)} className={`${C.btn} ${C.bad} px-10 text-3xl`}>
          ✗
        </button>
      </div>
      <p className="text-sm font-bold text-amber-800">Зөв бол ✓, буруу бол ✗ — аль болох хурдан!</p>
    </div>
  );
}

/** Санах ойн тоглоом — ханз ба утгын хос хөзрийг ол */
export function MemoryGame({ words, seed, onDone }: { words: KidsWord[]; seed: string; onDone: (r: GameResult) => void }) {
  const cards = useMemo(() => {
    const set = hashShuffle(words, `mm${seed}`).slice(0, 6);
    const all = set.flatMap((w) => [
      { id: `${w.zh}-zh`, key: w.zh, face: "zh" as const, w },
      { id: `${w.zh}-mn`, key: w.zh, face: "mn" as const, w },
    ]);
    return hashShuffle(all, `mmc${seed}`);
  }, [words, seed]);
  const [open, setOpen] = useState<number[]>([]);
  const [found, setFound] = useState<Set<string>>(new Set());
  const [flips, setFlips] = useState(0);
  const lock = useRef(false);
  const pairs = cards.length / 2;
  if (words.length < 4) return null;
  const tap = (k: number) => {
    if (lock.current || open.includes(k) || found.has(cards[k].key)) return;
    const next = [...open, k];
    setOpen(next);
    if (cards[k].face === "zh") void say(cards[k].w);
    if (next.length === 2) {
      setFlips((f) => f + 1);
      lock.current = true;
      const [a, b] = next;
      if (cards[a].key === cards[b].key) {
        setTimeout(() => {
          const f = new Set(found);
          f.add(cards[a].key);
          setFound(f);
          setOpen([]);
          lock.current = false;
          if (f.size === pairs) {
            const extra = Math.max(0, flips + 1 - pairs);
            setTimeout(() => onDone({ correct: Math.max(1, pairs - Math.floor(extra / 3)), total: pairs }), 500);
          }
        }, 500);
      } else {
        setTimeout(() => {
          setOpen([]);
          lock.current = false;
        }, 900);
      }
    }
  };
  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-base font-bold text-[#6b3f1d]">
        Ханз ба утгын хосыг ол! ({found.size}/{pairs})
      </p>
      <div className="grid w-full grid-cols-3 gap-3">
        {cards.map((c, k) => {
          const isFound = found.has(c.key);
          const isOpen = open.includes(k) || isFound;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => tap(k)}
              className={`flex aspect-[3/4] items-center justify-center rounded-[20px] p-1 text-center shadow-md transition ${
                isFound ? "bg-emerald-100 ring-2 ring-emerald-300" : isOpen ? "bg-white ring-2 ring-orange-300" : "bg-gradient-to-br from-orange-400 to-amber-400"
              }`}
            >
              {isOpen ? (
                c.face === "zh" ? (
                  <span className="text-3xl font-extrabold text-[#2b1a05]" lang="zh-CN">
                    {c.w.zh}
                  </span>
                ) : c.w.imageUrl ? (
                  <span className="flex flex-col items-center gap-1">
                    <img src={c.w.imageUrl} alt="" className="h-14 object-contain" />
                    <span className="text-xs font-bold leading-tight text-[#6b3f1d]">{c.w.mn}</span>
                  </span>
                ) : (
                  <span className="text-sm font-extrabold leading-tight text-[#6b3f1d]">{c.w.mn}</span>
                )
              ) : (
                <span className="text-4xl font-extrabold text-white/90">?</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Тооны тоглоом — тооны зураг → ханз сонгох / ханз → монгол */
export function NumberGame({ numbers, seed, onDone }: { numbers: KidsWord[]; seed: string; onDone: (r: GameResult) => void }) {
  const rounds = useMemo(() => hashShuffle(numbers, `num${seed}`).slice(0, 8), [numbers, seed]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const cur = rounds[i];
  const mode = i % 2 === 0 ? "pic→zh" : "zh→mn";
  const options = useMemo(() => {
    if (!cur) return [];
    const others = hashShuffle(numbers.filter((w) => w.zh !== cur.zh), `n${i}${seed}`).slice(0, 3);
    return hashShuffle([cur, ...others], `ns${i}${seed}`);
  }, [cur, i, numbers, seed]);
  if (numbers.length < 4) return null;
  if (!cur) return null;
  const pick = (zh: string) => {
    if (picked) return;
    setPicked(zh);
    const ok = zh === cur.zh;
    if (ok) setCorrect((c) => c + 1);
    void say(cur);
    setTimeout(() => {
      if (i + 1 >= rounds.length) onDone({ correct: correct + (ok ? 1 : 0), total: rounds.length });
      else {
        setI(i + 1);
        setPicked(null);
      }
    }, 1000);
  };
  return (
    <div className="flex flex-col items-center gap-4">
      <Progress i={i} total={rounds.length} />
      <div className={`${C.card} flex h-44 w-44 items-center justify-center p-3`}>
        {mode === "pic→zh" && cur.imageUrl ? (
          <img src={cur.imageUrl} alt="" className="max-h-full max-w-full object-contain" />
        ) : (
          <span className="text-7xl font-extrabold text-[#2b1a05]" lang="zh-CN">
            {cur.zh}
          </span>
        )}
      </div>
      <div className="text-lg font-bold text-[#6b3f1d]">{mode === "pic→zh" ? "Энэ хэд вэ? Ханзыг нь ол!" : "Монголоор хэд вэ?"}</div>
      <div className="grid w-full grid-cols-2 gap-3">
        {options.map((o) => (
          <button
            key={o.zh}
            type="button"
            onClick={() => pick(o.zh)}
            className={`${C.card} py-5 text-3xl font-extrabold text-[#2b1a05] ${optionRing(o.zh === cur.zh, o.zh === picked, picked != null)}`}
            lang={mode === "pic→zh" ? "zh-CN" : undefined}
          >
            {mode === "pic→zh" ? o.zh : o.mn}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Холбох — ханз ↔ монгол */
export function MatchGame({ words, seed, onDone }: { words: KidsWord[]; seed: string; onDone: (r: GameResult) => void }) {
  const set = useMemo(() => hashShuffle(words, `match${seed}`).slice(0, 5), [words, seed]);
  const right = useMemo(() => hashShuffle(set, `match-r${seed}`), [set, seed]);
  const [sel, setSel] = useState<string | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState(0);
  const [flash, setFlash] = useState<string | null>(null);
  const tap = (side: "l" | "r", zh: string) => {
    if (done.has(zh)) return;
    if (side === "l") {
      setSel(zh);
      void say(set.find((w) => w.zh === zh)!);
      return;
    }
    if (!sel) return;
    if (sel === zh) {
      const d = new Set(done);
      d.add(zh);
      setDone(d);
      setSel(null);
      if (d.size === set.length) setTimeout(() => onDone({ correct: set.length, total: set.length + wrong }), 600);
    } else {
      setWrong((w) => w + 1);
      setFlash(zh);
      setTimeout(() => setFlash(null), 500);
    }
  };
  return (
    <div className="flex flex-col gap-3">
      <p className="text-center text-base font-bold text-[#6b3f1d]">Зүүн талын ханзыг дараад, баруун талаас утгыг нь ол!</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-3">
          {set.map((w) => (
            <button
              key={w.zh}
              type="button"
              onClick={() => tap("l", w.zh)}
              className={`${C.card} py-4 text-3xl font-extrabold ${done.has(w.zh) ? "bg-emerald-100 opacity-60" : sel === w.zh ? "ring-4 ring-orange-400" : ""}`}
              lang="zh-CN"
            >
              {w.zh}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          {right.map((w) => (
            <button
              key={w.zh}
              type="button"
              onClick={() => tap("r", w.zh)}
              className={`${C.card} px-1 py-4 text-lg font-bold text-[#6b3f1d] ${done.has(w.zh) ? "bg-emerald-100 opacity-60" : flash === w.zh ? "bg-rose-100 ring-4 ring-rose-400" : ""}`}
            >
              {w.mn}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
