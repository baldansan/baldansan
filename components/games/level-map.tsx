"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { GameHeader } from "@/components/games/game-header";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { SHELL_MAIN_NARROW } from "@/lib/app-shell-classes";
import { resolveGameLabels } from "@/lib/games/game-lesson-meta";
import {
  HSK_BAND_ORDER,
  LEVELS_PER_HSK,
  TOTAL_STARS,
  currentLevel,
  firstLevelOfBand,
  getLevelProgress,
  isBossIndex,
  levelPlayHref,
  totalStars,
  type GameLevelProgress,
  type LevelGame,
} from "@/lib/games/levels";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { tr } from "@/lib/i18n/translate";

type Props = {
  game: LevelGame;
  /** Эзний dev туг — түгжээтэй үе ч дарж орно. */
  unlock?: boolean;
};

const LABELS = resolveGameLabels(false, false);

function gameTitle(game: LevelGame): string {
  switch (game) {
    case "arrange":
      return LABELS.arrangeTitle;
    case "match":
      return LABELS.matchTitle;
    case "translate":
      return LABELS.translateTitle;
    case "missing-word":
      return LABELS.missingWordTitle;
  }
}

function StarRow({ stars, size = "text-[10px]" }: { stars: number; size?: string }) {
  return (
    <span className={`flex justify-center gap-px leading-none ${size}`} aria-label={`${stars}/3`}>
      {[1, 2, 3].map((i) => (
        <span key={i} className={i <= stars ? "" : "opacity-25 grayscale"} aria-hidden>
          ⭐
        </span>
      ))}
    </span>
  );
}

/** Үеийн газрын зураг: HSK түвшин бүрээр хэсэг, дугуй зангилаа (түгжээтэй / одоогийн / давсан / шалгалт). */
export function LevelMap({ game, unlock = false }: Props) {
  const locale = useUiLocale();
  const [progress, setProgress] = useState<GameLevelProgress>({});
  const [current, setCurrent] = useState(1);
  const [stars, setStars] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const refresh = () => {
      setProgress(getLevelProgress(game));
      setCurrent(currentLevel(game));
      setStars(totalStars(game));
      setReady(true);
    };
    refresh();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [game]);

  const sections = useMemo(
    () =>
      HSK_BAND_ORDER.map((band) => ({
        band,
        count: LEVELS_PER_HSK[band],
        start: firstLevelOfBand(band),
      })),
    []
  );

  const suffix = unlock ? "&unlock=1" : "";
  const title = gameTitle(game);

  return (
    <MobileAppShell activeTab="games" mainClassName={SHELL_MAIN_NARROW}>
      <GameHeader
        title={`${title} · ${tr(locale, "Үе давах")}`}
        backHref="/games"
      />

      <div className="mb-4 rounded-3xl bg-gradient-to-br from-[#9b6bff] to-[#6d28d9] p-4 text-white shadow-[0_8px_20px_rgba(109,40,217,0.35)]">
        <p className="text-[10px] font-extrabold uppercase tracking-wider opacity-90">
          🗺 {tr(locale, "Үеийн газрын зураг")}
        </p>
        <div className="mt-1 flex items-end justify-between gap-3">
          <div>
            <p className="text-lg font-black">{tr(locale, title)}</p>
            <p className="text-sm font-semibold opacity-95" data-testid="map-total-stars">
              ⭐ {stars} / {TOTAL_STARS} · {tr(locale, "Нийт од")}
            </p>
          </div>
          <Link
            href={levelPlayHref(game, current) + suffix}
            className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-bold text-[#6d28d9] shadow"
          >
            ▶ {tr(locale, "Үргэлжлүүлэх")} · {tr(locale, "Үе")} {current}
          </Link>
        </div>
      </div>

      {sections.map((section) => {
        const bandStars = Array.from({ length: section.count }, (_, i) =>
          progress[String(section.start + i)]?.stars ?? 0
        ).reduce((a, b) => a + b, 0);
        return (
          <section key={section.band} className="mb-5">
            <div className="mb-2 flex items-baseline justify-between px-1">
              <h2 className="text-sm font-extrabold text-[var(--app-text)]">
                HSK {section.band} · {section.count} {tr(locale, "үе")}
              </h2>
              <span className="text-xs font-semibold text-[var(--app-muted)]">
                ⭐ {bandStars} / {section.count * 3}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-x-2 gap-y-3 rounded-3xl bg-white p-3 shadow-[0_3px_0_rgba(0,0,0,0.04)]">
              {Array.from({ length: section.count }, (_, i) => {
                const index = i + 1;
                const n = section.start + i;
                const boss = isBossIndex(index, section.count);
                const levelStars = progress[String(n)]?.stars ?? 0;
                const passed = levelStars > 0;
                const isCurrent = ready && n === current;
                const isLocked = ready && !passed && !isCurrent && !unlock;
                const playable = ready && (passed || isCurrent || unlock);

                const circle = boss ? "h-16 w-16 text-lg" : "h-12 w-12 text-sm";
                let tone = "bg-slate-100 text-slate-400 ring-1 ring-slate-200";
                if (passed) tone = "bg-emerald-500 text-white shadow-md shadow-emerald-200";
                if (isCurrent) tone = "bg-[var(--app-purple)] text-white ring-4 ring-purple-200 animate-pulse";
                if (boss && (passed || isCurrent)) tone = `${tone} ring-4 ring-amber-300`;
                if (boss && isLocked) tone = "bg-amber-50 text-amber-300 ring-1 ring-amber-200";

                const node = (
                  <span
                    className={`mx-auto flex items-center justify-center rounded-full font-extrabold ${circle} ${tone}`}
                    data-level={n}
                    data-state={!ready ? "pending" : isLocked ? "locked" : isCurrent ? "current" : "passed"}
                  >
                    {isLocked ? "🔒" : boss ? "⭐" : n}
                  </span>
                );

                return (
                  <div key={n} className={`flex flex-col items-center ${boss ? "col-span-1" : ""}`}>
                    {playable ? (
                      <Link
                        href={levelPlayHref(game, n) + suffix}
                        aria-label={`${tr(locale, "Үе")} ${n}`}
                        className="active:scale-95"
                      >
                        {node}
                      </Link>
                    ) : (
                      <span aria-label={`${tr(locale, "Үе")} ${n} · ${tr(locale, "Түгжээтэй")}`}>{node}</span>
                    )}
                    {boss ? (
                      <span className="mt-0.5 text-[9px] font-bold text-amber-700">
                        {n} · {tr(locale, "Шалгалт")}
                      </span>
                    ) : null}
                    {passed ? (
                      <StarRow stars={levelStars} />
                    ) : isCurrent ? (
                      <span className="mt-0.5 text-[9px] font-bold text-[var(--app-purple-dark)]">
                        {tr(locale, "Та энд байна")}
                      </span>
                    ) : (
                      <span className="mt-0.5 h-[10px]" />
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </MobileAppShell>
  );
}
