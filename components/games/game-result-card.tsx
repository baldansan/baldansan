"use client";

import Link from "next/link";
import { GameCard } from "@/components/games/game-card";

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
  return (
    <GameCard className="text-center">
      <p className="text-sm font-semibold text-emerald-600">Дууслаа!</p>
      <p className="mt-2 text-4xl font-bold text-purple-600">{score}</p>
      <p className="text-sm text-[var(--app-muted)]">оноо</p>
      <p className="mt-3 text-sm text-[var(--app-text)]">
        {correct}/{total} зөв · {accuracy}% нарийвчлал
      </p>
      {xpGained != null ? (
        <p className="mt-1 text-xs text-purple-600">+{xpGained} XP (local)</p>
      ) : null}
      <div className="mt-5 flex flex-col gap-2">
        <button
          type="button"
          onClick={onPlayAgain}
          className="min-h-[44px] rounded-full bg-purple-500 px-5 py-3 text-sm font-semibold text-white"
        >
          Дахин тоглох
        </button>
        <Link
          href="/games"
          className="min-h-[44px] rounded-full border border-purple-200 bg-purple-50 px-5 py-3 text-sm font-semibold text-purple-700"
        >
          Тоглоом руу буцах
        </Link>
        <Link
          href="/review"
          className="min-h-[44px] rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700"
        >
          Үг давтах
        </Link>
        <Link
          href={`/lessons/${lessonId}`}
          className="min-h-[44px] rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700"
        >
          Хичээл рүү буцах
        </Link>
      </div>
    </GameCard>
  );
}
