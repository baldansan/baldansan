"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { KidsDialogue, KidsLessonData, KidsWord } from "@/lib/kids/lesson-data";
import { playAudioUrl, speakWithSavedSettings, stopPronunciation } from "@/lib/tts/play-pronunciation";
import { markLessonCompletedSmart, markLessonStartedSmart, saveQuizResultSmart } from "@/lib/progress";
import { addKidStars, getKidStars, markKidLessonDone, stickerForLesson, syncKidStars } from "@/lib/kids/stars";
import {
  BigAudioButton,
  C,
  type GameResult,
  type KidsSentence,
  ListenPickGame,
  ListenWordGame,
  MatchGame,
  MeaningGame,
  MemoryGame,
  NumberGame,
  SentenceGame,
  SpeedGame,
  pickBuildableSentences,
  say,
} from "@/components/kids/kids-games";
import { WritingPad } from "@/components/writing/writing-pad";
import "@/components/writing/writing.css";

/* ───────────────────────── helpers ───────────────────────── */

type StepId = "start" | "video" | "words" | "numbers" | "talk" | "sing" | "write" | "play" | "test" | "done";

function Stars({ n }: { n: number }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-sm font-extrabold text-amber-900">
      ⭐ {n}
    </span>
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

/* ───────────────────────── дүрүүд ───────────────────────── */

const BOYS = new Set(["小明", "大卫", "男孩", "哥哥", "弟弟", "明明", "小力", "A", "儿子"]);
const GIRLS = new Set(["小红", "玛丽", "月月", "女孩", "姐姐", "妹妹", "小丽", "B", "女儿"]);
const SPEAKER_EMOJI: Record<string, string> = {
  妈妈: "👩",
  爸爸: "👨",
  奶奶: "👵",
  爷爷: "👴",
  医生: "🧑‍⚕️",
  护士: "👩‍⚕️",
  服务员: "🧑‍🍳",
  店员: "🧑‍💼",
  客人: "🧑",
  阿姨: "👩",
  白阿姨: "👩",
  叔叔: "👨",
  熊猫: "🐼",
  兔子: "🐰",
  乌龟: "🐢",
  狮子: "🦁",
  猴子: "🐵",
  小猫: "🐱",
  小鸭: "🦆",
  鸭妈妈: "🦆",
  蝌蚪们: "🐸",
  机器人: "🤖",
  白雪公主: "👸",
  星星: "⭐",
};
const FALLBACK_AVATARS = ["/kids/botgo-huu.jpg", "/kids/botgo-ohin.jpg", "/kids/botgo-bor.jpg"];

type Avatar = { img?: string; emoji?: string };

function avatarsFor(d: KidsDialogue): Avatar[] {
  const used = new Set<string>();
  const bySpeaker = new Map<string, Avatar>();
  // Нэг ярианд хоёр дүр ижил зурагтай болохоос сэргийлж, давхцвал дараагийн сул ботгыг өгнө.
  const free = (preferred?: string): string => {
    if (preferred && !used.has(preferred)) return preferred;
    return FALLBACK_AVATARS.find((a) => !used.has(a)) ?? preferred ?? FALLBACK_AVATARS[0];
  };
  return d.lines.map((l, i) => {
    const key = l.speaker || `#${i % 2}`;
    const hit = bySpeaker.get(key);
    if (hit) return hit;
    let av: Avatar;
    if (/老师/.test(key)) av = { img: "/kids/temee.jpg" };
    else if (SPEAKER_EMOJI[key]) av = { emoji: SPEAKER_EMOJI[key] };
    else av = { img: free(BOYS.has(key) ? "/kids/botgo-huu.jpg" : GIRLS.has(key) ? "/kids/botgo-ohin.jpg" : undefined) };
    if (av.img) used.add(av.img);
    bySpeaker.set(key, av);
    return av;
  });
}

function AvatarBubble({ av, size = "h-12 w-12" }: { av: Avatar; size?: string }) {
  if (av.img) return <img src={av.img} alt="" className={`${size} shrink-0 rounded-full object-cover ring-2 ring-white`} />;
  return <span className={`${size} flex shrink-0 items-center justify-center rounded-full bg-white text-2xl ring-2 ring-amber-100`}>{av.emoji}</span>;
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
        <div className={`${big ? "h-32" : "h-24"} flex w-full items-center justify-center rounded-2xl bg-amber-50 text-6xl`}>🀄</div>
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

/* ───────────────────────── main player ───────────────────────── */

const READ_LABEL: Record<NonNullable<KidsLessonData["song"]>["kind"], { label: string; emoji: string; done: string; hint: string; title: string }> = {
  song: { label: "Дуу", emoji: "🎵", done: "Дууллаа! ⭐ ➜", hint: "Бичлэгийг асаагаад хамт дуулаарай!", title: "Хамтдаа дуулъя" },
  chant: { label: "Шүлэг", emoji: "🥁", done: "Хэллээ! ⭐ ➜", hint: "Хэмнэлээр нь алга ташиж хамт хэлээрэй!", title: "Хэмнэлтэй шүлэг" },
  story: { label: "Үлгэр", emoji: "📖", done: "Уншлаа! ⭐ ➜", hint: "Мөр бүр дээр дарж сонсоод, дагаж унш!", title: "Жижиг үлгэр" },
  read: { label: "Унших", emoji: "📖", done: "Уншлаа! ⭐ ➜", hint: "Мөр бүр дээр дарж сонсоод, дагаж унш!", title: "Богино уншлага" },
};

export function KidsLessonPlayer({ data, backHref, adminPreview }: { data: KidsLessonData; backHref: string; adminPreview?: boolean }) {
  const read = data.song ? READ_LABEL[data.song.kind] : null;
  const steps = useMemo<{ id: StepId; label: string; emoji: string }[]>(() => {
    const s: { id: StepId; label: string; emoji: string }[] = [{ id: "start", label: "Эхлэл", emoji: "👋" }];
    if (data.videoUrl) s.push({ id: "video", label: "Видео", emoji: "📺" });
    if (data.words.length) s.push({ id: "words", label: "Үг", emoji: "🀄" });
    if (data.numbers.length) s.push({ id: "numbers", label: "Тоо", emoji: "🔢" });
    if (data.dialogues.length) s.push({ id: "talk", label: "Яриа", emoji: "💬" });
    if (data.song && read) s.push({ id: "sing", label: read.label, emoji: read.emoji });
    if (data.writeChars.length) s.push({ id: "write", label: "Бичих", emoji: "✍️" });
    s.push({ id: "play", label: "Тоглоом", emoji: "🎮" });
    if (data.test.listening.length || data.test.judge.length || data.test.choice.length) s.push({ id: "test", label: "Шалгалт", emoji: "🏁" });
    s.push({ id: "done", label: "Од", emoji: "⭐" });
    return s;
  }, [data, read]);

  const [idx, setIdx] = useState(0);
  const step = steps[idx].id;
  const [stars, setStars] = useState(0);
  const [totalStars, setTotalStars] = useState(0);
  const [confetti, setConfetti] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);
  const stepBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    const raf = requestAnimationFrame(() => setTotalStars(getKidStars()));
    void markLessonStartedSmart(data.lessonId);
    void syncKidStars().then((n) => {
      if (alive) setTotalStars(n);
    });
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, [data.lessonId]);

  useEffect(() => {
    const el = stepBarRef.current?.querySelector<HTMLElement>(`[data-step="${idx}"]`);
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [idx]);

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
      <style>{`@keyframes kids-fall{0%{transform:translateY(0) rotate(0)}100%{transform:translateY(120vh) rotate(540deg)}}@keyframes kids-pop{0%{transform:scale(.3) rotate(-20deg);opacity:0}70%{transform:scale(1.15) rotate(6deg);opacity:1}100%{transform:scale(1) rotate(0)}}@keyframes kids-in{0%{transform:translateY(10px);opacity:0}100%{transform:translateY(0);opacity:1}}`}</style>
      {confetti ? <Confetti /> : null}
      {/* top bar */}
      <div ref={topRef} className="sticky top-0 z-20 border-b border-amber-100 bg-[#FFF7E6]/95 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-2 px-4 pt-2">
          <Link href={backHref} className="rounded-full bg-white px-3 py-1.5 text-sm font-bold text-amber-900 ring-1 ring-amber-200">
            ← Гарах
          </Link>
          <Stars n={totalStars} />
        </div>
        <div ref={stepBarRef} className="mx-auto flex max-w-xl items-center gap-1.5 overflow-x-auto px-4 py-2">
          {steps.map((s, i) => (
            <button
              key={s.id}
              type="button"
              data-step={i}
              onClick={() => {
                stopPronunciation();
                setIdx(i);
              }}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl ${i === idx ? "bg-orange-500 shadow" : i < idx ? "bg-emerald-200" : "bg-white ring-1 ring-amber-200"}`}
              title={s.label}
              aria-label={s.label}
            >
              {s.emoji}
            </button>
          ))}
        </div>
      </div>
      {adminPreview ? <div className="bg-amber-200 px-4 py-1 text-center text-xs font-bold text-amber-900">Admin preview — ноорог хичээл</div> : null}

      <div className="mx-auto max-w-xl px-4 pt-5">
        <h1 className="mb-3 text-center text-sm font-bold uppercase tracking-wide text-orange-500">
          {steps[idx].emoji} {steps[idx].label}
        </h1>

        {step === "start" ? <StartStep data={data} onNext={next} /> : null}

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

        {step === "words" ? <WordsStep words={data.words} onNext={next} onEarn={earn} /> : null}
        {step === "numbers" ? <WordsStep words={data.numbers} onNext={next} onEarn={earn} grid /> : null}

        {step === "talk" ? <TalkStep dialogues={data.dialogues} onDone={() => { earn(1); next(); }} /> : null}

        {/* ── SING / READ ── */}
        {step === "sing" && data.song && read ? (
          <div className="flex flex-col items-center gap-4">
            {data.song.imageUrl ? <img src={data.song.imageUrl} alt="" className="h-40 rounded-2xl" /> : <div className="text-7xl">{data.song.kind === "song" ? "🎤" : read.emoji}</div>}
            <div className="text-center text-2xl font-extrabold text-[#2b1a05]">{read.title}</div>
            <p className="text-center text-sm font-bold text-amber-800">{read.hint}</p>
            {data.song.audioUrl ? <audio src={data.song.audioUrl} controls preload="none" className="w-full" /> : null}
            <div className={`${C.card} w-full p-4`}>
              {data.song.lines.map((l, i) => (
                <button key={i} type="button" onClick={() => void speakWithSavedSettings(l.zh, "zh-CN")} className="mb-2 block w-full rounded-2xl p-2 text-left active:bg-amber-50">
                  <span className="block text-xs font-semibold text-orange-500">{l.pinyin}</span>
                  <span className="block text-2xl font-extrabold text-[#2b1a05]" lang="zh-CN">
                    {l.zh}
                  </span>
                  <span className="block text-sm font-bold text-[#6b3f1d]">{l.mn}</span>
                </button>
              ))}
            </div>
            <button type="button" onClick={() => { earn(1); next(); }} className={`${C.btn} ${C.primary}`}>
              {read.done}
            </button>
          </div>
        ) : null}

        {step === "write" ? <WriteStep chars={data.writeChars} onEarn={earn} onNext={next} /> : null}

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

/* ───────────────────────── START ───────────────────────── */

/** Урт танилцуулгыг богино өгүүлбэрүүдэд хуваана. */
function splitIntro(text: string): string[] {
  const parts = text
    .split(/(?<=[.!?…])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  // Маш богино хэсгийг («Бэлэн үү?») өмнөхтэй нь нийлүүлнэ.
  const out: string[] = [];
  for (const p of parts) {
    if (out.length && (p.length < 18 || out[out.length - 1].length < 18)) out[out.length - 1] += " " + p;
    else out.push(p);
  }
  return out;
}

function StartStep({ data, onNext }: { data: KidsLessonData; onNext: () => void }) {
  const bubbles = useMemo(() => splitIntro(data.teacherIntro), [data.teacherIntro]);
  const [shown, setShown] = useState(2);
  const visible = bubbles.slice(0, shown);
  const more = shown < bubbles.length;
  return (
    <div className="flex flex-col items-center gap-5 text-center">
      {data.heroUrl ? <img src={data.heroUrl} alt="" className="w-full rounded-[28px] shadow-lg" /> : null}
      <div className="text-5xl font-extrabold text-[#2b1a05]" lang="zh-CN">
        {data.titleZh}
      </div>
      <div className="text-2xl font-bold text-[#6b3f1d]">{data.title.replace(/^.*—\s*/, "")}</div>
      {visible.length ? (
        <div className="flex w-full items-start gap-3 text-left">
          <img src="/kids/temee.jpg" alt="Тэмээ багш" className="h-16 w-16 shrink-0 rounded-full object-cover ring-4 ring-white shadow" />
          <div className="flex flex-1 flex-col gap-2">
            {visible.map((b, i) => (
              <div key={i} className="rounded-[22px] rounded-tl-md bg-white px-4 py-3 text-lg font-semibold leading-7 text-[#3b2410] shadow-sm ring-1 ring-amber-100" style={{ animation: "kids-in .35s ease-out" }}>
                {b}
              </div>
            ))}
            {more ? (
              <button type="button" onClick={() => setShown((n) => n + 1)} className="self-start rounded-full bg-amber-100 px-4 py-2 text-base font-extrabold text-amber-900 active:scale-95">
                Цааш сонсъё ▸
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
      <button type="button" onClick={onNext} className={`${C.btn} ${C.primary} text-2xl`}>
        Эхэлье! 🚀
      </button>
      <Link href="/kids/pinyin" className={`${C.card} flex w-full items-center gap-3 p-4 text-left`}>
        <span className="text-4xl">🔤</span>
        <span>
          <span className="block text-lg font-extrabold text-[#2b1a05]">Дуудлагын суурь</span>
          <span className="block text-sm text-[#6b3f1d]">a o e · bo po mo fo · 4 аялгуу — сонсоод дагаж хэл</span>
        </span>
      </Link>
    </div>
  );
}

/* ───────────────────────── WORDS ───────────────────────── */

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
      <div className="flex w-full items-center gap-2">
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-amber-100">
          <div className="h-full rounded-full bg-orange-400 transition-all" style={{ width: `${(100 * (i + 1)) / words.length}%` }} />
        </div>
        <span className="text-sm font-bold text-amber-800">
          {i + 1} / {words.length}
        </span>
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

/* ───────────────────────── TALK (зурагт ном) ───────────────────────── */

function TalkStep({ dialogues, onDone }: { dialogues: KidsDialogue[]; onDone: () => void }) {
  const [di, setDi] = useState(0);
  const [shown, setShown] = useState(1);
  const [playing, setPlaying] = useState(false);
  const d = dialogues[di];
  const avatars = useMemo(() => (d ? avatarsFor(d) : []), [d]);
  const lastRef = useRef<HTMLButtonElement>(null);
  const line = d?.lines[shown - 1];
  useEffect(() => {
    if (line) void speakWithSavedSettings(line.zh, "zh-CN");
    lastRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [line]);
  if (!d) return null;
  const allShown = shown >= d.lines.length;
  const lastDialogue = di + 1 >= dialogues.length;
  const playWhole = async () => {
    if (!d.audioUrl) return;
    stopPronunciation();
    setPlaying(true);
    await playAudioUrl(d.audioUrl);
    setPlaying(false);
  };
  const nextDialogue = () => {
    stopPronunciation();
    setDi(di + 1);
    setShown(1);
  };
  return (
    <div className="flex flex-col gap-4">
      {dialogues.length > 1 ? (
        <div className="flex justify-center gap-2">
          {dialogues.map((x, k) => (
            <span key={x.id} className={`h-2.5 rounded-full transition-all ${k === di ? "w-8 bg-orange-500" : k < di ? "w-2.5 bg-emerald-300" : "w-2.5 bg-amber-200"}`} />
          ))}
        </div>
      ) : null}
      <div className={`${C.card} overflow-hidden`}>
        {d.imageUrl ? <img src={d.imageUrl} alt="" className="w-full object-cover" /> : null}
        <div className="p-4">
          <div className="text-lg font-extrabold text-[#2b1a05]">{d.title}</div>
          {d.scene ? <div className="mt-1 text-sm leading-6 text-amber-800">{d.scene}</div> : null}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {d.lines.slice(0, shown).map((l, i) => {
          const right = i % 2 === 1;
          return (
            <button
              key={i}
              ref={i === shown - 1 ? lastRef : undefined}
              type="button"
              onClick={() => void speakWithSavedSettings(l.zh, "zh-CN")}
              className={`flex items-end gap-2 text-left ${right ? "flex-row-reverse" : ""}`}
              style={{ animation: "kids-in .35s ease-out" }}
            >
              <span className="flex flex-col items-center gap-0.5">
                <AvatarBubble av={avatars[i]} />
                {l.speaker ? (
                  <span className="text-[10px] font-bold text-amber-700" lang="zh-CN">
                    {l.speaker}
                  </span>
                ) : null}
              </span>
              <span className={`max-w-[80%] rounded-[22px] px-4 py-3 shadow-sm ring-1 ${right ? "rounded-br-md bg-sky-50 ring-sky-100" : "rounded-bl-md bg-white ring-amber-100"}`}>
                <span className="block text-xs font-semibold text-orange-500">{l.pinyin}</span>
                <span className="block text-2xl font-extrabold leading-snug text-[#2b1a05]" lang="zh-CN">
                  {l.zh}
                </span>
                <span className="block text-base font-bold text-[#6b3f1d]">{l.mn}</span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex flex-col items-center gap-3 pt-1">
        {!allShown ? (
          <button type="button" onClick={() => setShown(shown + 1)} className={`${C.btn} ${C.primary}`}>
            Дараагийнх ▸
          </button>
        ) : (
          <>
            <p className="text-center text-sm font-bold text-amber-800">Мөр бүр дээр дарж сонсоод, чангаар давт!</p>
            {d.audioUrl ? (
              <button type="button" onClick={() => void playWhole()} className={`${C.btn} ${C.soft}`}>
                <span className="text-2xl">{playing ? "🎧" : "▶️"}</span> Бүтнээр нь сонсъё
              </button>
            ) : null}
            {lastDialogue ? (
              <button type="button" onClick={onDone} className={`${C.btn} ${C.primary}`}>
                Давтлаа! ⭐ ➜
              </button>
            ) : (
              <button type="button" onClick={nextDialogue} className={`${C.btn} ${C.primary}`}>
                Дараагийн яриа ➜
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────── WRITE ───────────────────────── */

function WriteStep({ chars, onEarn, onNext }: { chars: KidsLessonData["writeChars"]; onEarn: (n: number) => void; onNext: () => void }) {
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState<"watch" | "trace">("watch");
  const [finished, setFinished] = useState(false);
  const cur = chars[i];
  if (!cur) return null;
  const onPadDone = () => {
    if (phase === "watch") {
      setTimeout(() => setPhase("trace"), 500);
      return;
    }
    setFinished(true);
    onEarn(1);
    void speakWithSavedSettings(cur.char, "zh-CN");
  };
  const advance = () => {
    if (i + 1 >= chars.length) {
      onNext();
      return;
    }
    setI(i + 1);
    setPhase("watch");
    setFinished(false);
  };
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-2">
        {chars.map((c, k) => (
          <span
            key={c.char}
            className={`flex h-11 w-11 items-center justify-center rounded-2xl text-2xl font-extrabold ${k === i ? "bg-orange-500 text-white" : k < i ? "bg-emerald-200 text-emerald-900" : "bg-white text-amber-300 ring-1 ring-amber-200"}`}
            lang="zh-CN"
          >
            {c.char}
          </span>
        ))}
      </div>
      <button type="button" onClick={() => void speakWithSavedSettings(cur.char, "zh-CN")} className="text-center">
        {cur.pinyin ? <span className="block text-sm font-semibold text-orange-500">{cur.pinyin}</span> : null}
        <span className="block text-lg font-extrabold text-[#6b3f1d]">{cur.mn}</span>
      </button>
      <p className="text-center text-base font-bold text-[#6b3f1d]">
        {finished ? "Гоё бичлээ! 🎉" : phase === "watch" ? "👀 Эхлээд хэрхэн бичихийг хар" : "✍️ Одоо хуруугаараа дагаж бич"}
      </p>
      <div className="flex w-full justify-center">
        <div className="w-full max-w-[300px]">
          <WritingPad key={`${cur.char}-${phase}`} char={cur.char} phase={phase} onDone={onPadDone} maxSize={300} />
        </div>
      </div>
      {finished ? (
        <button type="button" onClick={advance} className={`${C.btn} ${C.primary}`}>
          {i + 1 >= chars.length ? "Бичиж чадлаа! ➜" : "Дараагийн ханз ➜"}
        </button>
      ) : phase === "watch" ? (
        <button type="button" onClick={() => setPhase("trace")} className={`${C.btn} ${C.soft}`}>
          Би бичье ✍️
        </button>
      ) : null}
    </div>
  );
}

/* ───────────────────────── PLAY ───────────────────────── */

type GameId = "listen" | "listenWord" | "meaning" | "match" | "memory" | "sentence" | "speed" | "numbers";

function PlayStep({ data, onEarn, onNext }: { data: KidsLessonData; onEarn: (n: number) => void; onNext: () => void }) {
  const all = useMemo(() => [...data.words, ...data.numbers], [data]);
  const sentences = useMemo<KidsSentence[]>(
    () => [
      ...data.dialogues.flatMap((d) => d.lines.map((l) => ({ zh: l.zh, pinyin: l.pinyin, mn: l.mn }))),
      ...(data.song?.lines ?? []),
      ...data.words.filter((w) => w.exampleZh && w.exampleMn).map((w) => ({ zh: w.exampleZh!, pinyin: "", mn: w.exampleMn! })),
    ],
    [data]
  );
  const games = useMemo(() => {
    const g: { id: GameId; label: string; hint: string; emoji: string; ok: boolean }[] = [
      { id: "listen", label: "Сонсоод зураг ол", hint: "Үгийг сонсоод зөв зургийг дар", emoji: "👂", ok: all.filter((w) => w.imageUrl).length >= 3 },
      { id: "listenWord", label: "Сонсоод ханз ол", hint: "Үгийг сонсоод зөв ханзыг дар", emoji: "🎧", ok: all.length >= 4 },
      { id: "meaning", label: "Утгыг ол", hint: "Ханз юу гэсэн үг вэ?", emoji: "💡", ok: all.length >= 4 },
      { id: "numbers", label: "Тооны тоглоом", hint: "Тоог ханзаар нь ол", emoji: "🖐", ok: data.numbers.length >= 4 },
      { id: "match", label: "Холбох", hint: "Ханзыг утгатай нь холбо", emoji: "🔗", ok: all.length >= 4 },
      { id: "memory", label: "Санах ой", hint: "Хөзөр эргүүлж хосыг ол", emoji: "🧠", ok: all.length >= 4 },
      { id: "sentence", label: "Өгүүлбэр эвлүүл", hint: "Үгсийг зөв дараалалд оруул", emoji: "🧩", ok: pickBuildableSentences(sentences).length >= 2 },
      { id: "speed", label: "Хурдан!", hint: "40 секундэд хэдийг чадах вэ?", emoji: "⚡", ok: all.length >= 4 },
    ];
    return g.filter((x) => x.ok);
  }, [all, data.numbers.length, sentences]);
  const [active, setActive] = useState<{ id: GameId; seed: string } | null>(null);
  const [results, setResults] = useState<Record<string, GameResult>>({});
  const [lastStars, setLastStars] = useState<number | null>(null);
  const finish = (id: GameId, r: GameResult) => {
    const firstTime = !results[id];
    setResults((p) => ({ ...p, [id]: r }));
    const s = r.total ? Math.max(1, Math.round((3 * r.correct) / r.total)) : 1;
    // Дахин тоглоход од давхар өгөхгүй (эхний удаа л).
    if (firstTime) onEarn(s);
    setLastStars(firstTime ? s : 0);
    setActive(null);
  };
  if (active) {
    const done = (r: GameResult) => finish(active.id, r);
    const seed = active.seed;
    return (
      <div className="flex flex-col gap-4">
        <button type="button" onClick={() => setActive(null)} className="self-start rounded-full bg-white px-3 py-1.5 text-sm font-bold text-amber-900 ring-1 ring-amber-200">
          ← Тоглоомууд
        </button>
        {active.id === "listen" ? <ListenPickGame words={all} seed={seed} onDone={done} /> : null}
        {active.id === "listenWord" ? <ListenWordGame words={all} seed={seed} onDone={done} /> : null}
        {active.id === "meaning" ? <MeaningGame words={all} seed={seed} onDone={done} /> : null}
        {active.id === "numbers" ? <NumberGame numbers={data.numbers} seed={seed} onDone={done} /> : null}
        {active.id === "match" ? <MatchGame words={all} seed={seed} onDone={done} /> : null}
        {active.id === "memory" ? <MemoryGame words={all} seed={seed} onDone={done} /> : null}
        {active.id === "sentence" ? <SentenceGame sentences={sentences} seed={seed} onDone={done} /> : null}
        {active.id === "speed" ? <SpeedGame words={all} seed={seed} onDone={done} /> : null}
      </div>
    );
  }
  const played = Object.keys(results).length;
  return (
    <div className="flex flex-col gap-4">
      <p className="text-center text-base font-bold text-[#6b3f1d]">
        Тоглоом бүр ⭐ өгнө! ({played}/{games.length})
      </p>
      {lastStars != null ? (
        <div className="rounded-2xl bg-emerald-50 py-2 text-center text-lg font-extrabold text-emerald-700" style={{ animation: "kids-in .35s ease-out" }}>
          {lastStars > 0 ? `Сайн байна! +${lastStars} ⭐` : "Сайн байна! Дахиад тоглосон чинь мундаг 💪"}
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-3">
        {games.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => {
              stopPronunciation();
              setLastStars(null);
              setActive({ id: g.id, seed: String(Date.now()) });
            }}
            className={`${C.card} relative flex flex-col items-center gap-1 p-4 text-center active:scale-95 ${results[g.id] ? "ring-2 ring-emerald-300" : ""}`}
          >
            <span className="text-5xl">{g.emoji}</span>
            <span className="text-base font-extrabold leading-tight text-[#2b1a05]">{g.label}</span>
            {results[g.id] ? (
              <span className="text-xs font-bold text-emerald-600">
                ✅ {results[g.id].correct}/{results[g.id].total}
              </span>
            ) : (
              <span className="text-xs leading-tight text-amber-800">{g.hint}</span>
            )}
          </button>
        ))}
      </div>
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

/* ───────────────────────── TEST ───────────────────────── */

type TestItem =
  | { kind: "listen"; it: KidsLessonData["test"]["listening"][number] }
  | { kind: "judge"; it: KidsLessonData["test"]["judge"][number] }
  | { kind: "choice"; it: KidsLessonData["test"]["choice"][number] };

/** Сонголт хариултай таарах уу: "C" ↔ "C" / "C 哪" / "哪". */
function choiceMatches(option: string, answer: string): boolean {
  const o = option.trim();
  const a = answer.trim();
  if (!a) return false;
  return o === a || o.startsWith(a + " ") || o.startsWith(a + "．") || o.startsWith(a + ".") || o.replace(/^[A-D]\s*[.．]?\s*/, "") === a;
}
const optionLabel = (o: string) => o.replace(/^[A-D]\s*[.．]?\s*/, "").trim() || o;

function TestStep({ data, onDone }: { data: KidsLessonData; onDone: (r: GameResult) => void }) {
  const items = useMemo<TestItem[]>(
    () => [
      ...data.test.listening.map((it) => ({ kind: "listen" as const, it })),
      ...data.test.judge.map((it) => ({ kind: "judge" as const, it })),
      ...data.test.choice.map((it) => ({ kind: "choice" as const, it })),
    ],
    [data]
  );
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const cur = items[i];
  const speakCur = useCallback(() => {
    if (!cur) return;
    if (cur.kind === "listen") void speakWithSavedSettings(cur.it.scriptZh, "zh-CN");
    else if (cur.kind === "judge" && cur.it.scriptZh) void speakWithSavedSettings(cur.it.scriptZh, "zh-CN");
    else if (cur.kind === "choice" && cur.it.questionZh) void speakWithSavedSettings(cur.it.questionZh.replace(/（\s*）/g, "……"), "zh-CN");
  }, [cur]);
  useEffect(() => {
    if (cur?.kind === "listen" || (cur?.kind === "judge" && cur.it.scriptZh)) speakCur();
  }, [cur, speakCur]);
  if (!cur) return null;
  const check = (v: string): boolean => {
    if (cur.kind === "listen") return v === cur.it.answer;
    if (cur.kind === "judge") return (v === "✓") === cur.it.answer;
    return choiceMatches(v, cur.it.answer);
  };
  const answer = (v: string) => {
    if (picked) return;
    setPicked(v);
    const ok = check(v);
    if (ok) setCorrect((c) => c + 1);
  };
  const advance = () => {
    if (i + 1 >= items.length) onDone({ correct, total: items.length });
    else {
      setI(i + 1);
      setPicked(null);
    }
  };
  const isOk = picked != null && check(picked);
  const optionState = (o: string) => (!picked ? "" : check(o) ? "ring-4 ring-emerald-400" : o === picked ? "ring-4 ring-rose-400 opacity-70" : "opacity-50");
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full items-center gap-2">
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-amber-100">
          <div className="h-full rounded-full bg-orange-400 transition-all" style={{ width: `${(100 * i) / items.length}%` }} />
        </div>
        <span className="text-sm font-bold text-amber-800">
          {i + 1} / {items.length}
        </span>
      </div>
      {cur.kind === "listen" ? (
        <>
          <BigAudioButton label="Сонс" onClick={speakCur} />
          {cur.it.imageUrl ? <img src={cur.it.imageUrl} alt="" className="h-36 object-contain" /> : null}
          <p className="text-base font-bold text-[#6b3f1d]">{cur.it.optionImages.some(Boolean) ? "Сонсоод зөв зургийг сонго" : "Сонсоод зөв хариуг сонго"}</p>
          <div className={`grid w-full gap-3 ${cur.it.options.length <= 2 ? "grid-cols-2" : cur.it.options.length === 4 ? "grid-cols-2" : "grid-cols-3"}`}>
            {cur.it.options.map((o, k) => (
              <button key={o} type="button" onClick={() => answer(o)} className={`${C.card} flex flex-col items-center gap-1 p-2 ${optionState(o)}`}>
                {cur.it.optionImages[k] ? <img src={cur.it.optionImages[k]!} alt="" className="aspect-square w-full object-contain" /> : null}
                <span className="text-lg font-extrabold text-[#2b1a05]" lang="zh-CN">
                  {optionLabel(o)}
                </span>
              </button>
            ))}
          </div>
        </>
      ) : cur.kind === "judge" ? (
        <>
          {cur.it.scriptZh ? (
            <>
              <BigAudioButton label="Сонс" onClick={speakCur} />
              <p className="text-base font-bold text-[#6b3f1d]">Сонсоод зурагтай таарч байна уу?</p>
              <div className={`${C.card} flex w-full items-center justify-center p-5`}>
                {cur.it.imageUrl ? <img src={cur.it.imageUrl} alt="" className="h-44 object-contain" /> : <span className="text-6xl">🎧</span>}
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
            </>
          )}
          <div className="flex gap-4">
            <button type="button" onClick={() => answer("✓")} className={`${C.btn} ${picked === "✓" ? (isOk ? C.ok : C.bad) : C.ok} px-10 text-3xl`}>
              ✓
            </button>
            <button type="button" onClick={() => answer("✗")} className={`${C.btn} ${picked === "✗" ? (isOk ? C.ok : C.bad) : C.bad} px-10 text-3xl`}>
              ✗
            </button>
          </div>
          {picked && cur.it.scriptZh ? (
            <div className="text-center text-2xl font-extrabold text-[#2b1a05]" lang="zh-CN">
              {cur.it.scriptZh}
            </div>
          ) : null}
        </>
      ) : (
        <>
          <p className="text-base font-bold text-[#6b3f1d]">{cur.it.optionImages.some(Boolean) ? "Уншаад зөв зургийг сонго" : "Зөв хариуг сонго"}</p>
          <div className={`${C.card} flex w-full flex-col items-center gap-3 p-4`}>
            {cur.it.imageUrl ? <img src={cur.it.imageUrl} alt="" className="h-32 object-contain" /> : null}
            <button type="button" onClick={speakCur} className="text-center text-3xl font-extrabold leading-snug text-[#2b1a05]" lang="zh-CN">
              {cur.it.questionZh}
            </button>
            {cur.it.questionMn ? <p className="text-sm text-[#6b3f1d]">{cur.it.questionMn}</p> : null}
          </div>
          <div className={`grid w-full gap-3 ${cur.it.options.length === 4 ? "grid-cols-2" : cur.it.options.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
            {cur.it.options.map((o, k) => (
              <button key={o} type="button" onClick={() => answer(o)} className={`${C.card} flex flex-col items-center gap-1 p-2 ${optionState(o)}`}>
                {cur.it.optionImages[k] ? <img src={cur.it.optionImages[k]!} alt="" className="aspect-square w-full object-contain" /> : null}
                <span className="text-xl font-extrabold text-[#2b1a05]" lang="zh-CN">
                  {optionLabel(o)}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
      {picked ? (
        <div className={`${C.card} flex w-full flex-col items-center gap-2 p-4 text-center`} style={{ animation: "kids-in .3s ease-out" }}>
          <div className={`text-2xl font-extrabold ${isOk ? "text-emerald-600" : "text-rose-600"}`}>{isOk ? "Зөв! 🎉" : "Зүгээр ээ, дараа чадна 🙂"}</div>
          {cur.it.explanation ? <p className="text-sm leading-6 text-[#3b2410]">{cur.it.explanation}</p> : null}
          <button type="button" onClick={advance} className={`${C.btn} ${C.primary} mt-1`}>
            {i + 1 >= items.length ? "Дуусгах ➜" : "Дараагийнх ➜"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

/* ───────────────────────── DONE ───────────────────────── */

function DoneStep({ stars, lessonId, backHref, onCelebrate }: { stars: number; lessonId: string; backHref: string; onCelebrate: () => void }) {
  const fired = useRef(false);
  const sticker = stickerForLesson(lessonId);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    onCelebrate();
    markKidLessonDone(lessonId);
    void markLessonCompletedSmart(lessonId);
    void speakWithSavedSettings("太棒了！", "zh-CN");
  }, [lessonId, onCelebrate]);
  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <div className="text-3xl font-extrabold text-[#2b1a05]">Маш сайн! 太棒了!</div>
      <div className={`${C.card} flex w-full flex-col items-center gap-2 p-6`}>
        <div className="text-sm font-extrabold uppercase tracking-wide text-orange-500">Шинэ наалт!</div>
        <div className="text-[110px] leading-none" style={{ animation: "kids-pop .7s ease-out" }}>
          {sticker}
        </div>
        <div className="text-sm font-bold text-[#6b3f1d]">Наалтын цомогт чинь нэмэгдлээ</div>
      </div>
      <div className="text-xl font-bold text-[#6b3f1d]">Энэ хичээлээс {stars} ⭐ цуглууллаа</div>
      <div className="flex flex-wrap justify-center gap-1 text-3xl">
        {Array.from({ length: Math.min(stars, 20) }, (_, i) => (
          <span key={i}>⭐</span>
        ))}
      </div>
      <Link href={backHref} className={`${C.btn} ${C.primary}`}>
        Дараагийн хичээл ➜
      </Link>
    </div>
  );
}
