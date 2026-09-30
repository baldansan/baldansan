"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { GameCard } from "@/components/games/game-card";
import { fireConfetti, playSfx, recordDailyMissionProgress, type DailyMission } from "@/lib/games/game-fx";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { tr } from "@/lib/i18n/translate";
import "./game-juice.css";

type Props = {
  score: number;
  correct: number;
  total: number;
  accuracy: number;
  xpGained?: number;
  lessonId: string;
  onPlayAgain: () => void;
  /** Энэ тоглоомын өмнөх дээд оноо (0 = анх удаа). */
  previousBest?: number;
  bestCombo?: number;
  /** Дараагийн тоглоомын холбоос (сонголттой). */
  nextHref?: string;
  nextLabel?: string;
};

function useCountUp(target: number, ms = 900): number {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

export function GameResultCard({
  score,
  correct,
  total,
  accuracy,
  xpGained,
  lessonId,
  onPlayAgain,
  previousBest = 0,
  bestCombo = 0,
  nextHref,
  nextLabel,
}: Props) {
  const locale = useUiLocale();
  const shown = useCountUp(score);
  const [ringOn, setRingOn] = useState(false);
  const [newMissions, setNewMissions] = useState<DailyMission[]>([]);
  const recordedRef = useRef(false);
  const isNewBest = score > 0 && score > previousBest;
  const great = accuracy >= 80;

  useEffect(() => {
    const t = setTimeout(() => setRingOn(true), 60);
    playSfx("finish");
    if (great || isNewBest) fireConfetti();
    if (!recordedRef.current) {
      recordedRef.current = true;
      setNewMissions(recordDailyMissionProgress({ correct, bestCombo }));
    }
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const R = 56;
  const C = 2 * Math.PI * R;
  const dash = C * (1 - (ringOn ? Math.min(100, accuracy) : 0) / 100);
  const temee = great ? "/temee/temee-thumbsup.png" : accuracy >= 50 ? "/temee/temee-point.png" : "/temee/temee-think.png";
  const headline = isNewBest
    ? tr(locale, "Шинэ дээд оноо!")
    : great
      ? tr(locale, "Гайхалтай!")
      : accuracy >= 50
        ? tr(locale, "Сайн байна!")
        : tr(locale, "Дахиад нэг оролдоё!");

  return (
    <GameCard className="text-center">
      <Image src={temee} alt="" width={80} height={80} className="mx-auto mb-1 h-20 w-20 object-contain" />
      <p className="text-base font-extrabold text-[var(--app-text)]">{headline}</p>
      {isNewBest ? (
        <p className="mt-2">
          <span className="bs-gj-newbest">🏆 {tr(locale, "Дээд оноо")} {previousBest} → {score}</span>
        </p>
      ) : null}

      <div className="bs-gj-ring mt-4" role="img" aria-label={`${accuracy}%`}>
        <svg viewBox="0 0 132 132">
          <circle className="bs-gj-ring-bg" cx="66" cy="66" r={R} />
          <circle
            className="bs-gj-ring-fg"
            cx="66"
            cy="66"
            r={R}
            strokeDasharray={C}
            strokeDashoffset={dash}
            style={{ stroke: great ? "#1fb85a" : accuracy >= 50 ? "#f2a93b" : "#ef4444" }}
          />
        </svg>
        <div className="bs-gj-ring-txt">
          <b>{shown}</b>
          <small>{tr(locale, "оноо")}</small>
        </div>
      </div>

      <div className="bs-gj-stats">
        <div className="bs-gj-stat">
          <b>{correct}/{total}</b>
          <span>{tr(locale, "зөв")}</span>
        </div>
        <div className="bs-gj-stat">
          <b>{accuracy}%</b>
          <span>{tr(locale, "нарийвчлал")}</span>
        </div>
        <div className="bs-gj-stat">
          <b>{bestCombo > 1 ? `🔥${bestCombo}` : "—"}</b>
          <span>{tr(locale, "дээд combo")}</span>
        </div>
      </div>

      {xpGained != null ? (
        <p className="mt-2 text-xs font-bold text-[var(--app-purple)]">+{xpGained} XP</p>
      ) : null}

      {newMissions.map((m) => (
        <p key={m.id} className="bs-gj-mission">
          ✅ {tr(locale, "Өдрийн даалгавар биелэв")}: {tr(locale, m.label)}
        </p>
      ))}

      <div className="mt-5 flex flex-col gap-2">
        <button type="button" onClick={onPlayAgain} className="app-btn-game w-full">
          {tr(locale, "Дахин тоглох")}
        </button>
        {nextHref ? (
          <Link href={nextHref} className="app-btn-primary w-full">
            {nextLabel ?? tr(locale, "Дараагийн тоглоом")} →
          </Link>
        ) : null}
        <Link href="/games" className="app-btn-outline-green w-full !border-purple-200 !bg-[var(--app-purple-light)] !text-[var(--app-purple-dark)]">
          {tr(locale, "Тоглоом руу буцах")}
        </Link>
        <Link
          href={`/lessons/${lessonId}`}
          className="min-h-[44px] rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700"
        >
          {tr(locale, "Хичээл рүү буцах")}
        </Link>
      </div>
    </GameCard>
  );
}
