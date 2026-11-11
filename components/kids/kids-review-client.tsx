"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { KidsWord } from "@/lib/kids/lesson-data";
import { C, type GameResult, ListenWordGame, MeaningGame, MemoryGame, SpeedGame } from "@/components/kids/kids-games";
import { addKidStars, getKidLessonStars, markKidLessonDone, syncKidStars } from "@/lib/kids/stars";
import { speakWithSavedSettings, stopPronunciation } from "@/lib/tts/play-pronunciation";

type Props = { courseId: string; title: string; words: KidsWord[]; backHref: string };

const STAGES = [
  { id: "listen", label: "Сонсоод ханз ол", emoji: "🎧" },
  { id: "meaning", label: "Утгыг ол", emoji: "💡" },
  { id: "memory", label: "Санах ой", emoji: "🧠" },
  { id: "speed", label: "Хурдан!", emoji: "⚡" },
] as const;

/** Номын том шалгалт: 4 тоглоом дараалан → нийт оноо → од + цом. */
export function KidsReviewClient({ courseId, title, words, backHref }: Props) {
  const reviewId = `${courseId}-review`;
  const [seed, setSeed] = useState<string | null>(null);
  const [stage, setStage] = useState(0);
  const [results, setResults] = useState<GameResult[]>([]);
  const [earned, setEarned] = useState<number | null>(null);
  const best = useRef(0);

  useEffect(() => {
    void syncKidStars().then(() => {
      best.current = getKidLessonStars(reviewId);
    });
    return () => stopPronunciation();
  }, [reviewId]);

  const finishStage = (r: GameResult) => {
    const all = [...results, r];
    setResults(all);
    if (stage + 1 < STAGES.length) {
      setStage(stage + 1);
      return;
    }
    // Тоглоом бүр 0–3 од → дээд тал нь 12. Өмнөх дээд амжилтаас илүүг л нэмнэ.
    const total = all.reduce((n, x) => n + (x.total ? Math.round((3 * x.correct) / x.total) : 0), 0);
    const gain = Math.max(0, total - best.current);
    if (gain > 0) addKidStars(reviewId, gain);
    best.current = Math.max(best.current, total);
    markKidLessonDone(reviewId);
    setEarned(total);
    void speakWithSavedSettings("太棒了！", "zh-CN");
  };

  const start = () => {
    stopPronunciation();
    setSeed(String(Date.now()));
    setStage(0);
    setResults([]);
    setEarned(null);
  };

  return (
    <div className={`${C.bg} min-h-screen pb-16`}>
      <style>{`@keyframes kids-in{0%{transform:translateY(10px);opacity:0}100%{transform:translateY(0);opacity:1}}`}</style>
      <div className="sticky top-0 z-20 border-b border-amber-100 bg-[#FFF7E6]/95 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-2 px-4 py-2">
          <Link href={backHref} className="rounded-full bg-white px-3 py-1.5 text-sm font-bold text-amber-900 ring-1 ring-amber-200">
            ← Гарах
          </Link>
          {seed && earned == null ? (
            <div className="flex gap-1.5">
              {STAGES.map((s, k) => (
                <span key={s.id} className={`flex h-9 w-9 items-center justify-center rounded-full text-lg ${k === stage ? "bg-orange-500" : k < stage ? "bg-emerald-200" : "bg-white ring-1 ring-amber-200"}`}>
                  {s.emoji}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-sm font-extrabold text-amber-900">🎯 Том шалгалт</span>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-xl px-4 pt-5">
        {!seed ? (
          <div className="flex flex-col items-center gap-5 text-center">
            <img src="/kids/temee.jpg" alt="" className="h-28 w-28 rounded-full object-cover shadow ring-4 ring-white" />
            <div className="text-2xl font-extrabold text-[#2b1a05]">{title}</div>
            <div className={`${C.card} w-full p-5 text-lg font-semibold leading-8 text-[#3b2410]`}>
              Энэ номоор <b>{words.length} үг</b> сурсан шүү! Одоо 4 тоглоомоор хэр сайн санаж байгаагаа шалгая. Бүгдийг давбал <b>🏆 цом</b> авна.
            </div>
            <div className="grid w-full grid-cols-4 gap-2">
              {STAGES.map((s) => (
                <div key={s.id} className={`${C.card} flex flex-col items-center gap-1 p-2`}>
                  <span className="text-3xl">{s.emoji}</span>
                  <span className="text-[11px] font-bold leading-tight text-[#6b3f1d]">{s.label}</span>
                </div>
              ))}
            </div>
            <button type="button" onClick={start} className={`${C.btn} ${C.primary} text-2xl`}>
              Эхэлье! 🚀
            </button>
          </div>
        ) : earned != null ? (
          <div className="flex flex-col items-center gap-5 text-center" style={{ animation: "kids-in .4s ease-out" }}>
            <div className="text-[110px] leading-none">🏆</div>
            <div className="text-3xl font-extrabold text-[#2b1a05]">Мундаг! 太棒了!</div>
            <div className="text-xl font-bold text-[#6b3f1d]">Том шалгалтаас {earned} / 12 ⭐</div>
            <div className={`${C.card} w-full p-4`}>
              {STAGES.map((s, k) => (
                <div key={s.id} className="flex items-center justify-between py-1.5 text-base font-bold text-[#3b2410]">
                  <span>
                    {s.emoji} {s.label}
                  </span>
                  <span className="text-emerald-600">
                    {results[k]?.correct ?? 0} / {results[k]?.total ?? 0}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <button type="button" onClick={start} className={`${C.btn} ${C.soft}`}>
                🔁 Дахин
              </button>
              <Link href={backHref} className={`${C.btn} ${C.primary}`}>
                Ном руу ➜
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <h1 className="text-center text-sm font-bold uppercase tracking-wide text-orange-500">
              {STAGES[stage].emoji} {STAGES[stage].label} · {stage + 1}/{STAGES.length}
            </h1>
            {stage === 0 ? <ListenWordGame key={`a${seed}`} words={words} seed={seed} rounds={8} onDone={finishStage} /> : null}
            {stage === 1 ? <MeaningGame key={`b${seed}`} words={words} seed={seed} rounds={10} onDone={finishStage} /> : null}
            {stage === 2 ? <MemoryGame key={`c${seed}`} words={words} seed={seed} onDone={finishStage} /> : null}
            {stage === 3 ? <SpeedGame key={`d${seed}`} words={words} seed={seed} onDone={finishStage} /> : null}
          </div>
        )}
      </div>
    </div>
  );
}
