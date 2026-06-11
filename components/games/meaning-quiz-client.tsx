"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HskLevelSelector } from "@/components/hsk/hsk-level-selector";
import { useActiveHskLevel } from "@/components/providers/active-hsk-level-provider";
import { GameShell } from "@/components/games/game-shell";
import {
  MAX_LIVES,
  QUESTION_COUNT,
  QUESTION_SECONDS,
  scoreMeaningQuiz,
  type MeaningQuizQuestion,
} from "@/lib/games/meaning-quiz";
import { saveGameResult } from "@/lib/games/game-progress";
import { formatActiveHskLevel } from "@/lib/hsk/active-hsk-level";

type Phase = "loading" | "play" | "done";

export function MeaningQuizClient() {
  const { level: activeLevel, hydrated } = useActiveHskLevel();
  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState<string | null>(null);
  const [deck, setDeck] = useState<MeaningQuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_SECONDS);
  const [picked, setPicked] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);

  const correctRef = useRef(0);
  const livesRef = useRef(MAX_LIVES);
  const indexRef = useRef(0);

  const current = deck[index];
  const total = deck.length;
  const timerPct = (timeLeft / QUESTION_SECONDS) * 100;

  const finishGame = useCallback(
    (finalCorrect: number, finalLives: number, reason?: string) => {
      const answered = indexRef.current + (locked ? 1 : 0);
      const finalScore = scoreMeaningQuiz(
        finalCorrect,
        Math.max(answered, finalCorrect),
        finalLives
      );
      setScore(finalScore);
      setCorrectCount(finalCorrect);
      if (reason) setError(reason);
      saveGameResult({
        gameType: "meaning",
        lessonId: "hsk",
        score: finalScore,
        correct: finalCorrect,
        total: deck.length,
        accuracy:
          deck.length > 0
            ? Math.round((finalCorrect / deck.length) * 100)
            : 0,
        playedAt: new Date().toISOString(),
      });
      setPhase("done");
    },
    [deck.length, locked]
  );

  const advance = useCallback(() => {
    if (indexRef.current >= deck.length - 1) {
      finishGame(correctRef.current, livesRef.current);
      return;
    }
    indexRef.current += 1;
    setIndex(indexRef.current);
    setTimeLeft(QUESTION_SECONDS);
    setPicked(null);
    setLocked(false);
  }, [deck.length, finishGame]);

  const loadDeck = useCallback(async () => {
    if (!hydrated) return;
    setPhase("loading");
    setError(null);

    try {
      const res = await fetch(
        `/api/games/meaning-deck?level=${encodeURIComponent(String(activeLevel))}&size=${QUESTION_COUNT}`
      );
      const body = (await res.json()) as {
        deck?: MeaningQuizQuestion[];
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
      livesRef.current = MAX_LIVES;
      setIndex(0);
      setLives(MAX_LIVES);
      setScore(0);
      setCorrectCount(0);
      setTimeLeft(QUESTION_SECONDS);
      setPicked(null);
      setLocked(false);
      setPhase("play");
    } catch {
      setError("Сүлжээний алдаа.");
      setPhase("done");
    }
  }, [activeLevel, hydrated]);

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

  if (!hydrated || phase === "loading") {
    return (
      <GameShell mainClassName="mx-auto w-full max-w-[430px] lg:max-w-none px-4 py-12 text-center text-sm text-[var(--app-muted)]">
        Ачааллаж байна…
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
          <button
            type="button"
            onClick={() => void loadDeck()}
            className="bs-meaning-primary-btn mt-5"
          >
            Дахин тоглох
          </button>
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
            Утга сонгох
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
          <span className="opacity-30">{"🖤".repeat(MAX_LIVES - lives)}</span>
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
          Энэ үгийн утга?
        </p>
        <p className="bs-meaning-hanzi">{current.hanzi}</p>
        {current.pinyin ? (
          <p className="text-center text-base font-extrabold text-[var(--bs-green)]">
            {current.pinyin}
          </p>
        ) : null}

        <div className="mt-4 grid gap-2">
          {current.options.map((option) => {
            let cls = "bs-meaning-option";
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
