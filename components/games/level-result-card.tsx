"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GameCard } from "@/components/games/game-card";
import { levelXp, starsFor, type LevelMeta } from "@/lib/games/level-core";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { tr } from "@/lib/i18n/translate";

type Props = {
  meta: LevelMeta;
  correct: number;
  total: number;
  onNextLevel: () => void;
  onRetry: () => void;
  mapHref: string;
  /** Сүүлийн үе — «Дараагийн үе» байхгүй. */
  isLast?: boolean;
};

const STAR_DELAY_MS = 420;

/** Үеийн үр дүн: том одууд нэг нэгээрээ асна, XP, дараагийн үе / дахин оролдох. */
export function LevelResultCard({
  meta,
  correct,
  total,
  onNextLevel,
  onRetry,
  mapHref,
  isLast = false,
}: Props) {
  const locale = useUiLocale();
  const stars = starsFor(correct, total, meta.isBoss);
  const passed = stars >= 1;
  const xp = levelXp(correct, meta.isBoss);
  const [lit, setLit] = useState(0);

  useEffect(() => {
    setLit(0);
    if (stars <= 0) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i <= stars; i += 1) {
      timers.push(setTimeout(() => setLit(i), STAR_DELAY_MS * i));
    }
    return () => timers.forEach(clearTimeout);
  }, [stars, meta.level]);

  return (
    <GameCard className={`text-center ${meta.isBoss ? "ring-2 ring-amber-200" : ""}`}>
      <div
        className="mx-auto mb-2 flex items-center justify-center gap-2"
        aria-label={`${stars}/3`}
        data-testid="level-stars"
        data-stars={stars}
      >
        {[1, 2, 3].map((i) => {
          const on = i <= lit;
          return (
            <span
              key={i}
              aria-hidden
              className={`inline-block text-5xl transition-all duration-300 ease-out ${
                on
                  ? "scale-100 opacity-100 drop-shadow-[0_4px_10px_rgba(245,158,11,0.45)]"
                  : "scale-75 opacity-100 grayscale"
              } ${i === 2 ? "text-6xl -translate-y-1" : ""}`}
              style={{ filter: on ? undefined : "grayscale(1) opacity(0.35)" }}
            >
              ⭐
            </span>
          );
        })}
      </div>
      {meta.isBoss ? (
        <span className="mb-1 inline-flex rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold text-amber-800 ring-1 ring-amber-200">
          ⭐ {tr(locale, "Шалгалтын үе")}
        </span>
      ) : null}
      <p className="mt-1 text-lg font-bold text-[var(--app-text)]">
        {tr(locale, "Үе")} {meta.level} {tr(locale, passed ? "дууслаа" : "давсангүй")}
      </p>
      <p className="text-xs font-medium text-[var(--app-muted)]">{meta.subtitle}</p>
      <div className="mx-auto mt-4 max-w-[240px] rounded-2xl bg-slate-50 px-4 py-3">
        <p className="text-sm font-semibold text-[var(--app-text)]">
          {correct}/{total} {tr(locale, "зөв")}
        </p>
        {!passed ? (
          <p className="mt-1 text-xs text-[var(--app-muted)]">
            {tr(locale, "Давахад")} {meta.passCorrect}/{total} {tr(locale, "зөв хэрэгтэй")}
          </p>
        ) : null}
      </div>
      <p className="mt-2 text-sm font-bold text-[var(--app-purple)]">
        +{xp} XP{meta.isBoss ? " ×2" : ""}
      </p>
      <div className="mt-5 flex flex-col gap-2">
        {passed && !isLast ? (
          <button type="button" onClick={onNextLevel} className="app-btn-game w-full">
            {tr(locale, "Дараагийн үе →")}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onRetry}
          className={passed ? "app-btn-outline-green w-full" : "app-btn-game w-full"}
        >
          {tr(locale, passed ? "Дахин тоглох" : "Дахин оролдох")}
        </button>
        <Link
          href={mapHref}
          className="min-h-[44px] rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700"
        >
          🗺 {tr(locale, "Үеийн газрын зураг")}
        </Link>
      </div>
    </GameCard>
  );
}
