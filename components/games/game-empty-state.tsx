"use client";

import Link from "next/link";
import { GameCard } from "@/components/games/game-card";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { tr } from "@/lib/i18n/translate";

type Props = {
  message: string;
  lessonId?: string;
};

export function GameEmptyState({ message, lessonId }: Props) {
  const locale = useUiLocale();
  return (
    <GameCard className="text-center">
      <p className="text-4xl" aria-hidden>
        🎮
      </p>
      <p className="mt-3 text-sm leading-6 text-[var(--app-muted)]">
        {tr(locale, message)}
      </p>
      <div className="mt-4 flex flex-col gap-2">
        {lessonId ? (
          <Link
            href={`/lessons/${lessonId}/vocabulary`}
            className="min-h-[44px] app-btn-primary px-5 py-3"
          >
            {tr(locale, "Үгийн сан үзэх")}
          </Link>
        ) : null}
        <Link
          href="/games"
          className="min-h-[44px] rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700"
        >
          {tr(locale, "Тоглоом руу буцах")}
        </Link>
      </div>
    </GameCard>
  );
}
