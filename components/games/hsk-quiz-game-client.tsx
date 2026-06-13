"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HskLevelSelector } from "@/components/hsk/hsk-level-selector";
import { useActiveHskLevel } from "@/components/providers/active-hsk-level-provider";
import { GameShell } from "@/components/games/game-shell";
import {
  canPlayDailyChallenge,
  getDailyChallengeState,
  saveDailyChallengeResult,
} from "@/lib/games/daily-challenge";
import type { GameType } from "@/lib/games/game-types";
import { saveGameResult } from "@/lib/games/game-progress";
import {
  scoreQuizResult,
  type HskQuizQuestion,
} from "@/lib/games/hsk-quiz-builders";
import { formatActiveHskLevel } from "@/lib/hsk/active-hsk-level";

type Phase = "loading" | "play" | "done" | "locked";

export type HskQuizGameConfig = {
  title: string;
  deckPath: string;
  gameType: GameType;
  lessonId?: string;
  questionSeconds?: number;
  maxLives?: number;
  hanziOptions?: boolean;
  dailyMode?: boolean;
  extraQuery?: string;
};

const DEFAULT_SECONDS = 10;
const DEFAULT_LIVES = 3;

export function HskQuizGameClient({ config }: { config: HskQuizGameConfig }) {
  const {
    title,
    deckPath,
    gameType,
    lessonId = "hsk",
    questionSeconds = DEFAULT_SECONDS,
    maxLives = DEFAULT_LIVES,
    hanziOptions = false,
    dailyMode = false,
    extraQuery = "",
  } = config;

  const { level: activeLevel, hydrated } = useActiveHskLevel();
  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState<string | null>(null);
  const [deck, setDeck] = useState<HskQuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [lives, setLives] = useState(maxLives);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(questionSeconds);
  const [picked, setPicked] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [dailyDone, setDailyDone] = useState(
    dailyMode ? getDailyChallengeState() : null
  );

  const correctRef = useRef(0);
  const livesRef = useRef(maxLives);
  const indexRef = useRef(0);

  const current = deck[index];
  const total = deck.length;
  const timerPct = (timeLeft / questionSeconds) * 100;

  const finishGame = useCallback(
    (finalCorrect: number, finalLives: number, reason?: string) => {
      const finalScore = scoreQuizResult(
        finalCorrect,
        deck.length,
        finalLives
      );
      setScore(finalScore);
      setCorrectCount(finalCorrect);
      if (reason) setError(reason);

      if (dailyMode) {
        saveDailyChallengeResult(finalScore, finalCorrect, deck.length);
        setDailyDone(getDailyChallengeState());
      } else {
        saveGameResult({
          gameType,
          lessonId,
          score: finalScore,
          correct: finalCorrect,
          total: deck.length,
          accuracy:
            deck.length > 0
              ? Math.round((finalCorrect / deck.length) * 100)
              : 0,
          playedAt: new Date().toISOString(),
        });
      }
      setPhase("done");
    },
    [deck.length, dailyMode, gameType, lessonId]
  );

  const advance = useCallback(() => {
    if (indexRef.current >= deck.length - 1) {
      finishGame(correctRef.current, livesRef.current);
      return;
    }
    indexRef.current += 1;
    setIndex(indexRef.current);
    setTimeLeft(questionSeconds);
    setPicked(null);
    setLocked(false);
  }, [deck.length, finishGame, questionSeconds]);

  const loadDeck = useCallback(async () => {
    if (!hydrated) return;

    if (dailyMode && !canPlayDailyChallenge()) {
      setDailyDone(getDailyChallengeState());
      setPhase("locked");
      return;
    }

    setPhase("loading");
    setError(null);

    try {
      const q = extraQuery ? `&${extraQuery}` : "";
      const res = await fetch(
        `${deckPath}?level=${encodeURIComponent(String(activeLevel))}${q}`
      );
      const body = (await res.json()) as {
        deck?: HskQuizQuestion[];
        error?: string;
      };
      if (!res.ok || !body.deck?.length) {
        setError(body.error ?? "Ачаалахад алдаа гарлаа.");
        setPhase("done");
        return;
      }

      setDeck(body.deck);
      indexRef.current = 0;
      correctRef.current = 0;
      livesRef.current = maxLives;
      setIndex(0);
      setLives(maxLives);
      setScore(0);
      setCorrectCount(0);
      setTimeLeft(questionSeconds);
      setPicked(null);
      setLocked(false);
      setPhase("play");
    } catch {
      setError("Сүлжээний алдаа.");
      setPhase("done");
    }
  }, [
    activeLevel,
    dailyMode,
    deckPath,
    extraQuery,
    hydrated,
    maxLives,
    questionSeconds,
  ]);

  useEffect(() => {
    void loadDeck();
  }, [loadDeck]);

  useEffect(() => {
    if (phase !== "play" || locked || !current) return;

    if (timeLeft <= 0) {
      setLocked(true);
      setPicked(null);
      livesRef.current = Math.max(0, livesRef.current - 1);
      setLives(livesRef.current);
      if (livesRef.current <= 0) {
        setTimeout(() => finishGame(correctRef.current, 0), 800);
      } else {
        setTimeout(() => advance(), 800);
      }
      return;
    }

    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, locked, timeLeft, current, advance, finishGame]);

  function pickOption(option: string) {
    if (locked || !current) return;
    setLocked(true);
    setPicked(option);

    const ok = option === current.correct;
    if (ok) {
      correctRef.current += 1;
      setCorrectCount(correctRef.current);
      setScore((s) => s + 10);
      setTimeout(() => advance(), 650);
      return;
    }

    livesRef.current = Math.max(0, livesRef.current - 1);
    setLives(livesRef.current);
    if (livesRef.current <= 0) {
      setTimeout(() => finishGame(correctRef.current, 0), 800);
    } else {
      setTimeout(() => advance(), 800);
    }
  }

  const timerColor = useMemo(() => {
    if (timeLeft <= 3) return "bg-red-500";
    if (timeLeft <= 6) return "bg-amber-400";
    return "bg-[var(--app-primary)]";
  }, [timeLeft]);

  const isHanziDisplay =
    current?.kind === "word-recall" ||
    current?.kind === "pinyin" ||
    current?.kind === "meaning" ||
    current?.kind === "example-cloze";

  if (!hydrated || phase === "loading") {
    return (
      <GameShell mainClassName="mx-auto w-full max-w-[430px] lg:max-w-none px-4 py-12 text-center text-sm text-[var(--app-muted)]">
        Ачааллаж байна…
      </GameShell>
    );
  }

  if (phase === "locked" && dailyDone) {
    return (
      <GameShell mainClassName="mx-auto w-full max-w-[430px] lg:max-w-none px-4 pb-8">
        <div className="bs-meaning-done">
          <h2 className="text-xl font-extrabold text-[var(--bs-ink)]">
            ✅ Өнөөдрийн сорил дууссан
          </h2>
          <p className="bs-meaning-final-score mt-3">⭐ {dailyDone.score}</p>
          <p className="mt-1 text-sm text-[var(--app-muted)]">
            Зөв: {dailyDone.correct} / {dailyDone.total}
          </p>
          <p className="mt-2 text-xs text-[var(--app-muted)]">
            Маргааш шинэ 10 асуулт нээгдэнэ.
          </p>
          <Link href="/games" className="bs-meaning-link mt-5">
            ← Тоглоом руу
          </Link>
        </div>
      </GameShell>
    );
  }

  if (phase === "done") {
    const won = lives > 0 && correctCount === total && !error;
    return (
      <GameShell mainClassName="mx-auto w-full max-w-[430px] lg:max-w-none px-4 pb-8">
        <div className="bs-meaning-done">
          <h2 className="text-xl font-extrabold text-[var(--bs-ink)]">
            {error ? "Тоглоом эхлэхгүй" : won ? "🏆 Төгс!" : "Тоглоом дууслаа"}
          </h2>
          {error ? (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          ) : (
            <>
              <p className="bs-meaning-final-score">⭐ {score}</p>
              <p className="mt-1 text-sm text-[var(--app-muted)]">
                Зөв: {correctCount} / {total}
              </p>
            </>
          )}
          {!dailyMode ? (
            <button
              type="button"
              onClick={() => void loadDeck()}
              className="bs-meaning-primary-btn mt-5"
            >
              Дахин тоглох
            </button>
          ) : null}
          <Link href="/games" className="bs-meaning-link mt-3">
            ← Тоглоом руу
          </Link>
        </div>
      </GameShell>
    );
  }

  if (!current) return null;

  return (
    <GameShell mainClassName="mx-auto w-full max-w-[430px] lg:max-w-none bg-[var(--bs-bg)] px-4 pt-4 pb-8">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h1 className="text-base font-extrabold text-[var(--bs-ink)]">
            {title}
          </h1>
          <p className="text-[11px] font-bold text-[var(--bs-muted)]">
            {formatActiveHskLevel(activeLevel)}
          </p>
        </div>
        <HskLevelSelector className="shrink-0" />
      </div>

      <div className="mb-3 flex items-center justify-between text-sm font-extrabold">
        <span className="text-red-500" aria-label={`${lives} амь`}>
          {"❤️".repeat(lives)}
          <span className="opacity-30">
            {"🖤".repeat(maxLives - lives)}
          </span>
        </span>
        <span className="text-[var(--bs-green-700)]">⭐ {score}</span>
        <span className="text-[var(--bs-muted)]">
          {index + 1}/{total}
        </span>
      </div>

      <div className="mb-4 h-2 overflow-hidden rounded-full bg-[#e1ebe5]">
        <div
          className={`h-full rounded-full transition-all duration-1000 linear ${timerColor}`}
          style={{ width: `${timerPct}%` }}
        />
      </div>
      <p className="mb-3 text-center text-[11px] font-bold text-[var(--bs-muted)]">
        ⏱ {timeLeft} сек
      </p>

      <div className="bs-meaning-card">
        <p className="text-center text-sm font-bold text-[var(--bs-muted)]">
          {current.promptLabel}
        </p>
        {current.display ? (
          isHanziDisplay && current.kind !== "example-cloze" ? (
            <p className="bs-meaning-hanzi">{current.display}</p>
          ) : (
            <p className="mt-3 text-center text-base font-bold leading-relaxed text-[var(--bs-ink)]">
              {current.display}
            </p>
          )
        ) : null}
        {current.subDisplay &&
        !(current.kind === "word-recall" && !locked) ? (
          <p className="text-center text-sm font-extrabold text-[var(--bs-green)]">
            {current.subDisplay}
          </p>
        ) : null}
        {current.hint ? (
          <p className="mt-1 text-center text-xs text-[var(--bs-muted)]">
            {current.hint}
          </p>
        ) : null}

        <div className="mt-4 grid gap-2">
          {current.options.map((option) => {
            let cls = hanziOptions
              ? "bs-meaning-option bs-meaning-option--hanzi"
              : "bs-meaning-option";
            if (locked && option === current.correct) {
              cls += " bs-meaning-option--correct";
            } else if (
              locked &&
              picked === option &&
              option !== current.correct
            ) {
              cls += " bs-meaning-option--wrong";
            }
            return (
              <button
                key={`${current.id}-${option}`}
                type="button"
                disabled={locked}
                onClick={() => pickOption(option)}
                className={cls}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>

      <Link href="/games" className="bs-meaning-link mt-4">
        ← Буцах
      </Link>
    </GameShell>
  );
}
