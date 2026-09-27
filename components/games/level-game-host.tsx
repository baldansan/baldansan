"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrangeGameClient } from "@/components/games/arrange-game-client";
import { GameCard } from "@/components/games/game-card";
import { GameHeader } from "@/components/games/game-header";
import { GameShell } from "@/components/games/game-shell";
import { MatchGameClient } from "@/components/games/match-game-client";
import { MissingWordGameClient } from "@/components/games/missing-word-game-client";
import { TranslateGameClient } from "@/components/games/translate-game-client";
import { resolveGameLabels } from "@/lib/games/game-lesson-meta";
import type { GameVocabItem } from "@/lib/games/game-types";
import {
  TOTAL_LEVELS,
  clampLevel,
  currentLevel,
  levelMapHref,
  levelMeta,
  levelPlayHref,
  saveLevelResult,
  totalStars,
  type LevelGame,
  type LevelMeta,
  type LevelMode,
} from "@/lib/games/levels";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { tr } from "@/lib/i18n/translate";

type Props = {
  game: LevelGame;
  level: number;
  /** Эзний dev туг `?unlock=1` — түгжээтэй үе ч тоглоно. */
  unlock?: boolean;
};

type DeckState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; items: GameVocabItem[]; meta: LevelMeta };

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

/**
 * «Үе давах» хост: үеийн үгийн багцыг API-аас татаж, тоглоомын клиентийг
 * `key={level}`-тэй үзүүлнэ. «Дараагийн үе» → level+1, URL `?level=` шинэчилж
 * (router.replace, бүтэн ачаалалгүй), дараагийн багц шууд нэг дэлгэц дээр эхэлнэ.
 */
export function LevelGameHost({ game, level: initialLevel, unlock = false }: Props) {
  const locale = useUiLocale();
  const router = useRouter();
  const [level, setLevel] = useState(() => clampLevel(initialLevel));
  const [deck, setDeck] = useState<DeckState>({ status: "loading" });
  const [gameStars, setGameStars] = useState(0);
  const [locked, setLocked] = useState<boolean | null>(null);
  const finishedForLevel = useRef<number | null>(null);
  const mapHref = levelMapHref(game);

  // Түгжээ шалгах (localStorage — зөвхөн клиент дээр).
  useEffect(() => {
    setGameStars(totalStars(game));
    setLocked(!unlock && level > currentLevel(game));
  }, [game, level, unlock]);

  // Багц татах.
  useEffect(() => {
    if (locked !== false) return;
    let cancelled = false;
    setDeck({ status: "loading" });
    finishedForLevel.current = null;
    fetch(`/api/games/level-deck?game=${game}&level=${level}`)
      .then(async (res) => {
        const body = (await res.json()) as {
          error?: string;
          items?: GameVocabItem[];
          meta?: LevelMeta;
        };
        if (!res.ok || !body.items || !body.meta) {
          throw new Error(body.error ?? "Багц ачаалахад алдаа гарлаа.");
        }
        if (!cancelled) setDeck({ status: "ready", items: body.items, meta: body.meta });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Багц ачаалахад алдаа гарлаа.";
        setDeck({ status: "error", message });
      });
    return () => {
      cancelled = true;
    };
  }, [game, level, locked]);

  const goToLevel = useCallback(
    (next: number) => {
      const target = clampLevel(next);
      setLevel(target);
      router.replace(levelPlayHref(game, target) + (unlock ? "&unlock=1" : ""), {
        scroll: false,
      });
      if (typeof window !== "undefined") window.scrollTo({ top: 0 });
    },
    [game, router, unlock]
  );

  const onFinished = useCallback(
    (correct: number, total: number) => {
      // Strict mode / давхар дуудлагаас хамгаална — үе бүрт нэг л удаа хадгална.
      if (finishedForLevel.current === level) return;
      finishedForLevel.current = level;
      saveLevelResult(game, level, correct, total);
      setGameStars(totalStars(game));
    },
    [game, level]
  );

  const onNextLevel = useCallback(() => {
    if (level >= TOTAL_LEVELS) return;
    goToLevel(level + 1);
  }, [goToLevel, level]);

  const title = gameTitle(game);
  const meta = levelMeta(level);
  const headerLevel = {
    label: `${meta.title} · HSK ${meta.hskLevel}`,
    stars: gameStars,
    boss: meta.isBoss,
  };

  if (locked === null || (locked === false && deck.status === "loading")) {
    return (
      <GameShell>
        <GameHeader title={title} backHref={mapHref} level={headerLevel} />
        <GameCard className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-purple-200 border-t-[var(--app-purple)]" />
          <p className="text-sm font-semibold text-[var(--app-muted)]">
            {tr(locale, "Үе ачаалж байна…")}
          </p>
        </GameCard>
      </GameShell>
    );
  }

  if (locked) {
    return (
      <GameShell>
        <GameHeader title={title} backHref={mapHref} level={headerLevel} />
        <GameCard className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">
            🔒
          </div>
          <p className="text-base font-bold text-[var(--app-text)]">
            {tr(locale, "Үе")} {level} — {tr(locale, "Түгжээтэй")}
          </p>
          <p className="mt-1 text-xs text-[var(--app-muted)]">
            {tr(locale, "Өмнөх үеүдээ давсны дараа нээгдэнэ.")}
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <Link href={levelPlayHref(game, currentLevel(game))} className="app-btn-game w-full">
              ▶ {tr(locale, "Үргэлжлүүлэх")} · {tr(locale, "Үе")} {currentLevel(game)}
            </Link>
            <Link
              href={mapHref}
              className="min-h-[44px] rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700"
            >
              🗺 {tr(locale, "Үеийн газрын зураг")}
            </Link>
          </div>
        </GameCard>
      </GameShell>
    );
  }

  if (deck.status !== "ready") {
    return (
      <GameShell>
        <GameHeader title={title} backHref={mapHref} level={headerLevel} />
        <GameCard className="text-center">
          <p className="text-sm font-semibold text-red-600">
            {deck.status === "error" ? deck.message : tr(locale, "Багц ачаалахад алдаа гарлаа.")}
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => goToLevel(level)}
              className="app-btn-game w-full"
            >
              {tr(locale, "Дахин оролдох")}
            </button>
            <Link
              href={mapHref}
              className="min-h-[44px] rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700"
            >
              🗺 {tr(locale, "Үеийн газрын зураг")}
            </Link>
          </div>
        </GameCard>
      </GameShell>
    );
  }

  const levelMode: LevelMode = {
    level,
    total: deck.meta.questions,
    meta: deck.meta,
    gameStars,
    onFinished,
    onNextLevel,
    mapHref,
  };
  const lessonId = `level-${level}`;
  const common = {
    lessonId,
    vocabulary: deck.items,
    labels: LABELS,
    levelMode,
  };

  switch (game) {
    case "arrange":
      return <ArrangeGameClient key={level} {...common} />;
    case "match":
      return <MatchGameClient key={level} {...common} />;
    case "translate":
      return <TranslateGameClient key={level} {...common} />;
    case "missing-word":
      return <MissingWordGameClient key={level} {...common} />;
  }
}
