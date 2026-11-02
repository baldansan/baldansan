"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { KidsLessonData, KidsWord } from "@/lib/kids/lesson-data";
import { playAudioUrl, speakWithSavedSettings, stopPronunciation } from "@/lib/tts/play-pronunciation";
import { markLessonCompletedSmart, markLessonStartedSmart, saveQuizResultSmart } from "@/lib/progress";
import { addKidStars, getKidStars } from "@/lib/kids/stars";

/* ───────────────────────── helpers ───────────────────────── */

type StepId = "start" | "video" | "words" | "numbers" | "talk" | "sing" | "play" | "test" | "done";

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

async function say(word: { zh: string; audioUrl?: string | null }) {
  stopPronunciation();
  if (word.audioUrl) {
    const r = await playAudioUrl(word.audioUrl);
    if (r.ok) return;
  }
  await speakWithSavedSettings(word.zh, "zh-CN");
}

const C = {
  bg: "bg-[#FFF7E6]",
  card: "rounded-[28px] bg-white shadow-[0_10px_30px_rgba(120,80,0,0.10)] ring-1 ring-amber-100",
  btn: "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-lg font-extrabold shadow-md transition active:scale-95",
  primary: "bg-orange-500 text-white hover:bg-orange-600",
  soft: "bg-amber-100 text-amber-900 hover:bg-amber-200",
  ok: "bg-emerald-500 text-white",
  bad: "bg-rose-500 text-white",
};

function Stars({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-sm font-extrabold text-amber-900">
      ⭐ {n}
    </span>
  );
}

function BigAudioButton({ label, onClick, playing }: { label: string; onClick: () => void; playing?: boolean }) {
  return (
    <button type="button" onClick={onClick} className={`${C.btn} ${C.primary}`}>
      <span className="text-2xl">{playing ? "⏸" : "🔊"}</span> {label}
    </button>
  );
}

function Confetti() {
  const pieces = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((i) => (
        <span
          key={i}
          className="absolute text-3xl"
          style={{
            left: `${(i * 37) % 100}%`,
            top: "-10%",
            animation: `kids-fall ${2.2 + (i % 5) * 0.3}s linear ${(i % 7) * 0.15}s forwards`,
          }}
        >
          {["🎉", "⭐", "🎈", "🌟", "🎊"][i % 5]}
        </span>
      ))}
    </div>
  );
}

/* ───────────────────────── word card ───────────────────────── */

function WordCard({ w, big }: { w: KidsWord; big?: boolean }) {
  const [pop, setPop] = useState(false);
  const onSay = () => {
    setPop(true);
    void say(w);
    setTimeout(() => setPop(false), 400);
  };
  return (
    <button
      type="button"
      onClick={onSay}
      className={`${C.card} flex w-full flex-col items-center gap-3 p-5 text-center transition ${pop ? "scale-[1.03]" : ""}`}
    >
      {w.imageUrl ? (
        <img src={w.imageUrl} alt={w.zh} className={`${big ? "h-44" : "h-28"} w-auto max-w-full rounded-2xl object-contain`} />
      ) : (
        <div className={`${big ? "h-44" : "h-28"} flex w-full items-center justify-center rounded-2xl bg-amber-50 text-6xl`}>🀄</div>
      )}
      <div className="text-sm font-semibold text-orange-500">{w.pinyin}</div>
      <div className={`${big ? "text-6xl" : "text-4xl"} font-extrabold leading-none text-[#2b1a05]`} lang="zh-CN">
        {w.zh}
      </div>
      <div className="text-xl font-bold text-[#6b3f1d]">{w.mn}</div>
      <div className="mt-1 text-xs text-amber-700">🔊 дарж сонс</div>
    </button>
  );
}

/* ───────────────────────── games ───────────────────────── */

type GameResult = { correct: number; total: number };

/** Сонсоод зураг сонгох — үгийн аудио → 3 зургаас зөвийг */
function ListenPickGame({ words, onDone }: { words: KidsWord[]; onDone: (r: GameResult) => void }) {
  const pool = words.filter((w) => w.imageUrl);
  const rounds = useMemo(() => hashShuffle(pool, "listen").slice(0, 6), [pool]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const cur = rounds[i];
  const options = useMemo(() => {
    if (!cur) return [];
    const others = hashShuffle(pool.filter((w) => w.zh !== cur.zh), `o${i}`).slice(0, 2);
    return hashShuffle([cur, ...others], `s${i}${cur.zh}`);
  }, [cur, i, pool]);
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
      <div className="text-sm font-bold text-amber-800">
        {i + 1} / {rounds.length}
      </div>
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
      {picked ? (
        <div className={`text-2xl font-extrabold ${picked === cur.zh ? "text-emerald-600" : "text-rose-600"}`}>
          {picked === cur.zh ? "Зөв! 🎉" : `Зөв нь: ${cur.zh} (${cur.mn})`}
        </div>
      ) : null}
    </div>
  );
}

/** Тооны тоглоом — тооны зураг → ханз сонгох / ханз → монгол */
function NumberGame({ numbers, onDone }: { numbers: KidsWord[]; onDone: (r: GameResult) => void }) {
  const rounds = useMemo(() => hashShuffle(numbers, "num").slice(0, 8), [numbers]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const cur = rounds[i];
  const mode = i % 2 === 0 ? "pic→zh" : "zh→mn";
  const options = useMemo(() => {
    if (!cur) return [];
    const others = hashShuffle(numbers.filter((w) => w.zh !== cur.zh), `n${i}`).slice(0, 3);
    return hashShuffle([cur, ...others], `ns${i}`);
  }, [cur, i, numbers]);
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
      <div className="text-sm font-bold text-amber-800">
        {i + 1} / {rounds.length}
      </div>
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
        {options.map((o) => {
          const state = !picked ? "" : o.zh === cur.zh ? "bg-emerald-100 ring-4 ring-emerald-400" : o.zh === picked ? "bg-rose-100 ring-4 ring-rose-400" : "opacity-50";
          return (
            <button key={o.zh} type="button" onClick={() => pick(o.zh)} className={`${C.card} py-5 text-3xl font-extrabold text-[#2b1a05] ${state}`} lang={mode === "pic→zh" ? "zh-CN" : undefined}>
              {mode === "pic→zh" ? o.zh : o.mn}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Холбох — ханз ↔ монгол */
function MatchGame({ words, onDone }: { words: KidsWord[]; onDone: (r: GameResult) => void }) {
  const set = useMemo(() => hashShuffle(words, "match").slice(0, 5), [words]);
  const left = set;
  const right = useMemo(() => hashShuffle(set, "match-r"), [set]);
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
    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col gap-3">
        {left.map((w) => (
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
            className={`${C.card} py-4 text-lg font-bold text-[#6b3f1d] ${done.has(w.zh) ? "bg-emerald-100 opacity-60" : flash === w.zh ? "bg-rose-100 ring-4 ring-rose-400" : ""}`}
          >
            {w.mn}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────── main player ───────────────────────── */

export function KidsLessonPlayer({ data, backHref, adminPreview }: { data: KidsLessonData; backHref: string; adminPreview?: boolean }) {
  const steps = useMemo<{ id: StepId; label: string; emoji: string }[]>(() => {
    const s: { id: StepId; label: string; emoji: string }[] = [{ id: "start", label: "Эхлэл", emoji: "👋" }];
    if (data.videoUrl) s.push({ id: "video", label: "Видео", emoji: "📺" });
    if (data.words.length) s.push({ id: "words", label: "Үг", emoji: "🀄" });
    if (data.numbers.length) s.push({ id: "numbers", label: "Тоо", emoji: "🔢" });
    if (data.dialogues.length) s.push({ id: "talk", label: "Яриа", emoji: "💬" });
    if (data.song) s.push({ id: "sing", label: "Дуу", emoji: "🎵" });
    s.push({ id: "play", label: "Тоглоом", emoji: "🎮" });
    if (data.test.listening.length || data.test.judge.length) s.push({ id: "test", label: "Шалгалт", emoji: "🏁" });
    s.push({ id: "done", label: "Од", emoji: "⭐" });
    return s;
  }, [data]);

  const [idx, setIdx] = useState(0);
  const step = steps[idx].id;
  const [stars, setStars] = useState(0);
  const [totalStars, setTotalStars] = useState(0);
  const [confetti, setConfetti] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setTotalStars(getKidStars()));
    void markLessonStartedSmart(data.lessonId);
    return () => cancelAnimationFrame(raf);
  }, [data.lessonId]);

  const earn = useCallback(
    (n: number) => {
      if (n <= 0) return;
      setStars((s) => s + n);
      setTotalStars(addKidStars(data.lessonId, n));
    },
    [data.lessonId]
  );

  const go = (d: number) => {
    stopPronunciation();
    setIdx((i) => Math.min(steps.length - 1, Math.max(0, i + d)));
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const next = () => go(1);

  return (
    <div className={`${C.bg} min-h-screen pb-28`}>
      <style>{`@keyframes kids-fall{0%{transform:translateY(0) rotate(0)}100%{transform:translateY(120vh) rotate(540deg)}}`}</style>
      {confetti ? <Confetti /> : null}
      {/* top bar */}
      <div ref={topRef} className="sticky top-0 z-20 border-b border-amber-100 bg-[#FFF7E6]/95 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-2 px-4 py-2">
          <Link href={backHref} className="rounded-full bg-white px-3 py-1.5 text-sm font-bold text-amber-900 ring-1 ring-amber-200">
            ← Гарах
          </Link>
          <div className="flex items-center gap-1 overflow-x-auto">
            {steps.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  stopPronunciation();
                  setIdx(i);
                }}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg ${i === idx ? "bg-orange-500 shadow" : i < idx ? "bg-emerald-200" : "bg-white ring-1 ring-amber-200"}`}
                title={s.label}
              >
                {s.emoji}
              </button>
            ))}
          </div>
          <Stars n={totalStars} />
        </div>
      </div>
      {adminPreview ? <div className="bg-amber-200 px-4 py-1 text-center text-xs font-bold text-amber-900">Admin preview — ноорог хичээл</div> : null}

      <div className="mx-auto max-w-xl px-4 pt-5">
        <h1 className="mb-1 text-center text-sm font-bold uppercase tracking-wide text-orange-500">{steps[idx].emoji} {steps[idx].label}</h1>

        {/* ── START ── */}
        {step === "start" ? (
          <div className="flex flex-col items-center gap-5 text-center">
            {data.heroUrl ? <img src={data.heroUrl} alt="" className="w-full rounded-[28px] shadow-lg" /> : null}
            <div className="text-6xl font-extrabold text-[#2b1a05]" lang="zh-CN">
              {data.titleZh}
            </div>
            <div className="text-2xl font-bold text-[#6b3f1d]">{data.title.replace(/^.*—\s*/, "")}</div>
            {data.teacherIntro ? (
              <div className={`${C.card} p-5 text-left text-base leading-7 text-[#3b2410]`}>
                <div className="mb-2 text-2xl">🐫 Тэмээ багш:</div>
                {data.teacherIntro}
              </div>
            ) : null}
            <button type="button" onClick={next} className={`${C.btn} ${C.primary} text-2xl`}>
              Эхэлье! 🚀
            </button>
          </div>
        ) : null}

        {/* ── VIDEO ── */}
        {step === "video" && data.videoUrl ? (
          <div className="flex flex-col items-center gap-4">
            <video src={data.videoUrl} poster={data.videoPoster ?? undefined} controls playsInline className="w-full rounded-[28px] bg-black shadow-lg" />
            <p className="text-center text-base font-bold text-[#6b3f1d]">Хүүхэлдэйн киног үзээд, дуунуудыг чангаар давтаарай!</p>
            <button type="button" onClick={next} className={`${C.btn} ${C.primary}`}>
              Үзсэн, цааш ➜
            </button>
          </div>
        ) : null}

        {/* ── WORDS ── */}
        {step === "words" ? <WordsStep words={data.words} onNext={next} onEarn={earn} /> : null}
        {step === "numbers" ? <WordsStep words={data.numbers} onNext={next} onEarn={earn} grid /> : null}

        {/* ── TALK ── */}
        {step === "talk" ? (
          <div className="flex flex-col gap-5">
            {data.dialogues.map((d) => (
              <div key={d.id} className={`${C.card} overflow-hidden`}>
                {d.imageUrl ? <img src={d.imageUrl} alt="" className="w-full object-cover" /> : null}
                <div className="p-5">
                  <div className="mb-1 text-lg font-extrabold text-[#2b1a05]">{d.title}</div>
                  {d.scene ? <div className="mb-3 text-sm text-amber-800">{d.scene}</div> : null}
                  <div className="flex flex-col gap-2">
                    {d.lines.map((l, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => void speakWithSavedSettings(l.zh, "zh-CN")}
                        className={`flex items-start gap-3 rounded-2xl p-3 text-left ${i % 2 ? "bg-sky-50" : "bg-amber-50"}`}
                      >
                        <span className="text-2xl">{i % 2 ? "👧" : "👦"}</span>
                        <span>
                          <span className="block text-xs font-semibold text-orange-500">{l.pinyin}</span>
                          <span className="block text-3xl font-extrabold text-[#2b1a05]" lang="zh-CN">
                            {l.zh}
                          </span>
                          <span className="block text-base font-bold text-[#6b3f1d]">{l.mn}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                  {d.audioUrl ? (
                    <div className="mt-3">
                      <audio src={d.audioUrl} controls preload="none" className="w-full" />
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
            <p className="text-center text-sm text-amber-800">Мөр бүр дээр дарж сонсоод, чангаар давт!</p>
            <button type="button" onClick={() => { earn(1); next(); }} className={`${C.btn} ${C.primary} self-center`}>
              Давтлаа! ⭐ ➜
            </button>
          </div>
        ) : null}

        {/* ── SING ── */}
        {step === "sing" && data.song ? (
          <div className="flex flex-col items-center gap-4">
            {data.song.imageUrl ? <img src={data.song.imageUrl} alt="" className="h-40 rounded-2xl" /> : <div className="text-7xl">🎤</div>}
            <div className="text-2xl font-extrabold text-[#2b1a05]">{data.song.title}</div>
            {data.song.audioUrl ? <audio src={data.song.audioUrl} controls preload="none" className="w-full" /> : null}
            <div className={`${C.card} w-full p-5`}>
              {data.song.lines.map((l, i) => (
                <button key={i} type="button" onClick={() => void speakWithSavedSettings(l.zh, "zh-CN")} className="mb-3 block w-full rounded-2xl p-2 text-left hover:bg-amber-50">
                  <span className="block text-xs font-semibold text-orange-500">{l.pinyin}</span>
                  <span className="block text-2xl font-extrabold text-[#2b1a05]" lang="zh-CN">
                    {l.zh}
                  </span>
                  <span className="block text-sm font-bold text-[#6b3f1d]">{l.mn}</span>
                </button>
              ))}
            </div>
            <button type="button" onClick={() => { earn(1); next(); }} className={`${C.btn} ${C.primary}`}>
              Дуулсан! ⭐ ➜
            </button>
          </div>
        ) : null}

        {/* ── PLAY ── */}
        {step === "play" ? <PlayStep data={data} onEarn={earn} onNext={next} /> : null}

        {/* ── TEST ── */}
        {step === "test" ? (
          <TestStep
            data={data}
            onDone={(r) => {
              earn(r.correct);
              void saveQuizResultSmart(data.lessonId, r.correct, r.total, Math.round((100 * r.correct) / Math.max(1, r.total)));
              next();
            }}
          />
        ) : null}

        {/* ── DONE ── */}
        {step === "done" ? (
          <DoneStep
            stars={stars}
            lessonId={data.lessonId}
            backHref={backHref}
            onCelebrate={() => {
              setConfetti(true);
              setTimeout(() => setConfetti(false), 4000);
            }}
          />
        ) : null}
      </div>

      {/* bottom nav */}
      {step !== "start" && step !== "done" ? (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-amber-100 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-3">
            <button type="button" onClick={() => go(-1)} className={`${C.btn} ${C.soft} px-4 py-2 text-base`}>
              ◀ Буцах
            </button>
            <span className="text-sm font-bold text-amber-800">
              {idx + 1} / {steps.length}
            </span>
            <button type="button" onClick={next} className={`${C.btn} ${C.soft} px-4 py-2 text-base`}>
              Алгасах ▶
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function WordsStep({ words, onNext, onEarn, grid }: { words: KidsWord[]; onNext: () => void; onEarn: (n: number) => void; grid?: boolean }) {
  const [i, setI] = useState(0);
  const heard = useRef<Set<string>>(new Set());
  const w = words[i];
  useEffect(() => {
    if (!grid && w) {
      void say(w);
      heard.current.add(w.zh);
    }
  }, [w, grid]);
  if (grid) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-center text-base font-bold text-[#6b3f1d]">Тоо бүр дээр дарж сонс, дараа нь гараараа зааж хэл!</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {words.map((x) => (
            <WordCard key={x.zh} w={x} />
          ))}
        </div>
        <button type="button" onClick={() => { onEarn(1); onNext(); }} className={`${C.btn} ${C.primary} self-center`}>
          Тоолж чадна! ⭐ ➜
        </button>
      </div>
    );
  }
  if (!w) return null;
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-sm font-bold text-amber-800">
        {i + 1} / {words.length}
      </div>
      <WordCard w={w} big />
      {w.exampleZh ? (
        <button type="button" onClick={() => void speakWithSavedSettings(w.exampleZh!, "zh-CN")} className={`${C.card} w-full p-3 text-center`}>
          <span className="block text-xl font-extrabold text-[#2b1a05]" lang="zh-CN">
            {w.exampleZh}
          </span>
          <span className="block text-sm font-bold text-[#6b3f1d]">{w.exampleMn}</span>
        </button>
      ) : null}
      <div className="flex gap-3">
        <button type="button" disabled={i === 0} onClick={() => setI(i - 1)} className={`${C.btn} ${C.soft} disabled:opacity-40`}>
          ◀
        </button>
        <BigAudioButton label="Дахин сонс" onClick={() => void say(w)} />
        {i + 1 < words.length ? (
          <button type="button" onClick={() => setI(i + 1)} className={`${C.btn} ${C.soft}`}>
            ▶
          </button>
        ) : (
          <button type="button" onClick={() => { onEarn(heard.current.size >= words.length ? 2 : 1); onNext(); }} className={`${C.btn} ${C.ok}`}>
            ⭐ ➜
          </button>
        )}
      </div>
    </div>
  );
}

function PlayStep({ data, onEarn, onNext }: { data: KidsLessonData; onEarn: (n: number) => void; onNext: () => void }) {
  const games = useMemo(() => {
    const g: { id: string; label: string; emoji: string; ok: boolean }[] = [
      { id: "listen", label: "Сонсоод зураг ол", emoji: "👂", ok: [...data.words, ...data.numbers].filter((w) => w.imageUrl).length >= 3 },
      { id: "numbers", label: "Тооны тоглоом", emoji: "🖐", ok: data.numbers.length >= 4 },
      { id: "match", label: "Холбох", emoji: "🔗", ok: [...data.words, ...data.numbers].length >= 4 },
    ];
    return g.filter((x) => x.ok);
  }, [data]);
  const [active, setActive] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, GameResult>>({});
  const finish = (id: string, r: GameResult) => {
    setResults((p) => ({ ...p, [id]: r }));
    const s = r.total ? Math.max(1, Math.round((3 * r.correct) / r.total)) : 1;
    onEarn(s);
    setActive(null);
  };
  if (active === "listen") return <ListenPickGame words={[...data.words, ...data.numbers]} onDone={(r) => finish("listen", r)} />;
  if (active === "numbers") return <NumberGame numbers={data.numbers} onDone={(r) => finish("numbers", r)} />;
  if (active === "match") return <MatchGame words={[...data.words, ...data.numbers]} onDone={(r) => finish("match", r)} />;
  return (
    <div className="flex flex-col gap-4">
      <p className="text-center text-base font-bold text-[#6b3f1d]">Тоглоом бүр ⭐ өгнө!</p>
      {games.map((g) => (
        <button key={g.id} type="button" onClick={() => setActive(g.id)} className={`${C.card} flex items-center gap-4 p-5 text-left`}>
          <span className="text-5xl">{g.emoji}</span>
          <span className="flex-1">
            <span className="block text-xl font-extrabold text-[#2b1a05]">{g.label}</span>
            {results[g.id] ? (
              <span className="block text-sm font-bold text-emerald-600">
                ✅ {results[g.id].correct}/{results[g.id].total} — дахин тоглох
              </span>
            ) : (
              <span className="block text-sm text-amber-800">Дарж тогло</span>
            )}
          </span>
        </button>
      ))}
      {data.culture?.imageUrl ? (
        <div className={`${C.card} p-4`}>
          <div className="mb-2 text-lg font-extrabold text-[#2b1a05]">🖐 {data.culture.title}</div>
          <img src={data.culture.imageUrl} alt="" className="w-full rounded-xl" />
          <p className="mt-2 text-sm leading-6 text-[#3b2410]">{data.culture.text}</p>
        </div>
      ) : null}
      <button type="button" onClick={onNext} className={`${C.btn} ${C.primary} self-center`}>
        Цааш ➜
      </button>
    </div>
  );
}

function TestStep({ data, onDone }: { data: KidsLessonData; onDone: (r: GameResult) => void }) {
  const items = useMemo(
    () => [
      ...data.test.listening.map((it) => ({ kind: "listen" as const, it })),
      ...data.test.judge.map((it) => ({ kind: "judge" as const, it })),
    ],
    [data]
  );
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const cur = items[i];
  useEffect(() => {
    if (cur?.kind === "listen") void speakWithSavedSettings(cur.it.scriptZh, "zh-CN");
  }, [cur]);
  if (!cur) return null;
  const answer = (v: string) => {
    if (picked) return;
    setPicked(v);
    const ok = cur.kind === "listen" ? v === cur.it.answer : (v === "✓") === cur.it.answer;
    if (ok) setCorrect((c) => c + 1);
    setTimeout(() => {
      if (i + 1 >= items.length) onDone({ correct: correct + (ok ? 1 : 0), total: items.length });
      else {
        setI(i + 1);
        setPicked(null);
      }
    }, 1800);
  };
  const isOk = picked != null && (cur.kind === "listen" ? picked === cur.it.answer : (picked === "✓") === cur.it.answer);
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-sm font-bold text-amber-800">
        Асуулт {i + 1} / {items.length}
      </div>
      {cur.kind === "listen" ? (
        <>
          <BigAudioButton label="Сонс" onClick={() => void speakWithSavedSettings(cur.it.scriptZh, "zh-CN")} />
          <p className="text-base font-bold text-[#6b3f1d]">Сонсоод зөв зургийг сонго</p>
          <div className="grid w-full grid-cols-3 gap-3">
            {cur.it.options.map((o, k) => {
              const state = !picked ? "" : o === cur.it.answer ? "ring-4 ring-emerald-400" : o === picked ? "ring-4 ring-rose-400 opacity-70" : "opacity-50";
              return (
                <button key={o} type="button" onClick={() => answer(o)} className={`${C.card} flex flex-col items-center gap-1 p-2 ${state}`}>
                  {cur.it.optionImages[k] ? <img src={cur.it.optionImages[k]!} alt="" className="aspect-square w-full object-contain" /> : null}
                  <span className="text-lg font-extrabold text-[#2b1a05]">{o}</span>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <p className="text-base font-bold text-[#6b3f1d]">Зураг, үг хоёр таарч байна уу?</p>
          <div className={`${C.card} flex w-full items-center justify-center gap-6 p-5`}>
            {cur.it.imageUrl ? <img src={cur.it.imageUrl} alt="" className="h-36 object-contain" /> : null}
            <button type="button" onClick={() => void speakWithSavedSettings(cur.it.zh, "zh-CN")} className="text-5xl font-extrabold text-[#2b1a05]" lang="zh-CN">
              {cur.it.zh}
            </button>
          </div>
          <div className="flex gap-4">
            <button type="button" onClick={() => answer("✓")} className={`${C.btn} ${picked === "✓" ? (isOk ? C.ok : C.bad) : C.ok} px-10 text-3xl`}>
              ✓
            </button>
            <button type="button" onClick={() => answer("✗")} className={`${C.btn} ${picked === "✗" ? (isOk ? C.ok : C.bad) : C.bad} px-10 text-3xl`}>
              ✗
            </button>
          </div>
        </>
      )}
      {picked ? (
        <div className={`${C.card} w-full p-4 text-center`}>
          <div className={`text-2xl font-extrabold ${isOk ? "text-emerald-600" : "text-rose-600"}`}>{isOk ? "Зөв! 🎉" : "Дахиад бодоорой 🙂"}</div>
          <p className="mt-1 text-sm text-[#3b2410]">{cur.it.explanation}</p>
        </div>
      ) : null}
    </div>
  );
}

function DoneStep({ stars, lessonId, backHref, onCelebrate }: { stars: number; lessonId: string; backHref: string; onCelebrate: () => void }) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    onCelebrate();
    void markLessonCompletedSmart(lessonId);
    void speakWithSavedSettings("太棒了！", "zh-CN");
  }, [lessonId, onCelebrate]);
  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <div className="text-8xl">🏆</div>
      <div className="text-3xl font-extrabold text-[#2b1a05]">Маш сайн! 太棒了!</div>
      <div className="text-xl font-bold text-[#6b3f1d]">Энэ хичээлээс {stars} ⭐ цуглууллаа</div>
      <div className="flex flex-wrap justify-center gap-1 text-3xl">{Array.from({ length: Math.min(stars, 20) }, (_, i) => <span key={i}>⭐</span>)}</div>
      <Link href={backHref} className={`${C.btn} ${C.primary}`}>
        Дараагийн хичээл ➜
      </Link>
    </div>
  );
}
