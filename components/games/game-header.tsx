"use client";

import Link from "next/link";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { tr } from "@/lib/i18n/translate";

type Props = {
  title: string;
  backHref?: string;
  progress?: string;
  score?: number;
  timer?: string;
};

export function GameHeader({
  title,
  backHref = "/games",
  progress,
  score,
  timer,
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
        {progress ? (
          <p className="text-xs font-medium text-[var(--app-muted)]">
            {progress}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
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
