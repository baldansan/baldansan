"use client";

import Link from "next/link";
import { GameCard } from "@/components/games/game-card";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { tr } from "@/lib/i18n/translate";

type Props = {
  score: number;
  correct: number;
  total: number;
  accuracy: number;
  xpGained?: number;
  lessonId: string;
  onPlayAgain: () => void;
};

export function GameResultCard({
  score,
  correct,
  total,
  accuracy,
  xpGained,
  lessonId,
  onPlayAgain,
}: Props) {
  const locale = useUiLocale();
  return (
    <GameCard className="text-center">
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--app-primary-light)] text-2xl">
        🎉
      </div>
      <p className="text-sm font-bold text-[var(--app-primary-dark)]">
        {tr(locale, "Дууслаа!")}
      </p>
      <p className="mt-2 text-5xl font-bold text-[var(--app-purple-dark)]">
        {score}
      </p>
      <p className="text-sm font-medium text-[var(--app-muted)]">
        {tr(locale, "оноо")}
      </p>
      <div className="mx-auto mt-4 max-w-[240px] rounded-2xl bg-slate-50 px-4 py-3">
        <p className="text-sm font-semibold text-[var(--app-text)]">
          {correct}/{total} {tr(locale, "зөв")}
        </p>
        <p className="text-xs text-[var(--app-muted)]">
          {accuracy}% {tr(locale, "нарийвчлал")}
        </p>
      </div>
      {xpGained != null ? (
        <p className="mt-2 text-xs font-bold text-[var(--app-purple)]">
          +{xpGained} XP (local)
        </p>
      ) : null}
      <div className="mt-5 flex flex-col gap-2">
        <button type="button" onClick={onPlayAgain} className="app-btn-game w-full">
          {tr(locale, "Дахин тоглох")}
        </button>
        <Link href="/games" className="app-btn-outline-green w-full !border-purple-200 !bg-[var(--app-purple-light)] !text-[var(--app-purple-dark)]">
          {tr(locale, "Тоглоом руу буцах")}
        </Link>
        <Link
          href="/review"
          className="min-h-[44px] rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700"
        >
          {tr(locale, "Үг давтах")}
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
