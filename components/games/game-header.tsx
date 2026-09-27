"use client";

import Link from "next/link";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { tr } from "@/lib/i18n/translate";

type LevelHeaderInfo = {
  /** «Үе 7 · HSK 2» */
  label: string;
  /** Энэ тоглоомын нийт од. */
  stars: number;
  boss?: boolean;
};

type Props = {
  title: string;
  backHref?: string;
  progress?: string;
  score?: number;
  timer?: string;
  /** «Үе давах» горим — үеийн шошго, одны тооллого, шалгалтын badge. */
  level?: LevelHeaderInfo;
};

export function GameHeader({
  title,
  backHref = "/games",
  progress,
  score,
  timer,
  level,
}: Props) {
  const locale = useUiLocale();
  return (
    <header className="mb-4 flex items-center gap-2">
      <Link
        href={backHref}
        className="app-game-header-close"
        aria-label={tr(locale, "Буцах")}
      >
        ×
      </Link>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-bold text-[var(--app-text)]">
          {tr(locale, title)}
        </h1>
        {level ? (
          <p className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-[var(--app-muted)]">
            <span>{level.label}</span>
            {level.boss ? (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 ring-1 ring-amber-200">
                ⭐ {tr(locale, "Шалгалтын үе")}
              </span>
            ) : null}
            {progress ? <span className="font-medium">· {progress}</span> : null}
          </p>
        ) : progress ? (
          <p className="text-xs font-medium text-[var(--app-muted)]">
            {progress}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        {level ? (
          <span
            className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 ring-1 ring-amber-200"
            title={tr(locale, "Нийт од")}
          >
            ⭐ {level.stars}
          </span>
        ) : null}
        {score != null ? (
          <span className="app-game-score-pill">
            {score} {tr(locale, "оноо")}
          </span>
        ) : null}
        {timer ? (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-medium text-slate-600">
            {timer}
          </span>
        ) : null}
      </div>
    </header>
  );
}
