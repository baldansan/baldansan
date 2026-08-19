"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { GameWordSourcePicker } from "@/components/games/game-word-source-picker";
import { HskLevelSelector } from "@/components/hsk/hsk-level-selector";
import { useActiveHskLevel } from "@/components/providers/active-hsk-level-provider";
import { GameShell } from "@/components/games/game-shell";
import { saveGameResult } from "@/lib/games/game-progress";
import type { HskQuizQuestion } from "@/lib/games/hsk-quiz-builders";
import {
  buildGameWordPool,
  defaultGameWordSource,
  type GameWordSource,
  wordIdsToQuery,
} from "@/lib/games/game-word-pool";
import { formatActiveHskLevel } from "@/lib/hsk/active-hsk-level";
import { getAuthenticatedUserId, hasSupabaseConfig } from "@/lib/supabase/auth";
import { useActivityTracker } from "@/lib/analytics/activity-tracker";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { tr } from "@/lib/i18n/translate";

const ROUND_SECONDS = 60;

type Phase = "source" | "loading" | "play" | "done";

export function SpeedChallengeClient() {
  useActivityTracker("game", "speed-challenge");
  const locale = useUiLocale();
  const { level: activeLevel, hydrated } = useActiveHskLevel();
  const [phase, setPhase] = useState<Phase>("source");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [wordSource, setWordSource] = useState<GameWordSource>("catalog");
  const [poolNote, setPoolNote] = useState<string | null>(null);
  const [wordSourceQuery, setWordSourceQuery] = useState("");
  const [sourceLoading, setSourceLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deck, setDeck] = useState<HskQuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);

  const correctRef = useRef(0);
  const streakRef = useRef(0);
  const indexRef = useRef(0);

  const current = deck[index % Math.max(deck.length, 1)];

  const finishGame = useCallback(() => {
    const finalScore = score;
    saveGameResult({
      gameType: "speed-challenge",
      lessonId: "hsk",
      score: finalScore,
      correct: correctRef.current,
      total: correctRef.current + (deck.length > 0 ? 0 : 0),
      accuracy:
        correctRef.current > 0
          ? Math.min(100, Math.round((correctRef.current / (indexRef.current + 1)) * 100))
          : 0,
      playedAt: new Date().toISOString(),
    });
    setPhase("done");
  }, [deck.length, score]);

  useEffect(() => {
    if (!hasSupabaseConfig) return;
    void getAuthenticatedUserId().then(({ userId }) => {
      const loggedIn = Boolean(userId);
      setIsLoggedIn(loggedIn);
      setWordSource(defaultGameWordSource(loggedIn));
    });
  }, []);

  const confirmSource = useCallback(async () => {
    if (!hydrated) return;
    setSourceLoading(true);
    try {
      const pool = await buildGameWordPool(wordSource, activeLevel);
      setWordSourceQuery(wordIdsToQuery(pool.wordIds));
      setPoolNote(pool.note);
      setPhase("loading");
    } finally {
      setSourceLoading(false);
    }
  }, [wordSource, activeLevel, hydrated]);

  const loadDeck = useCallback(async () => {
    if (!hydrated || phase !== "loading") return;
    setError(null);
    try {
      const res = await fetch(
        `/api/games/speed-challenge-deck?level=${encodeURIComponent(String(activeLevel))}${wordSourceQuery}`
      );
      const body = (await res.json()) as {
        deck?: HskQuizQuestion[];
        error?: string;
      };
      if (!res.ok || !body.deck?.length) {
        setError(body.error ?? "Ачаалахад алдаа.");
        setPhase("done");
        return;
      }
      setDeck(body.deck);
      indexRef.current = 0;
      correctRef.current = 0;
      streakRef.current = 0;
      setIndex(0);
      setScore(0);
      setCorrectCount(0);
      setStreak(0);
      setTimeLeft(ROUND_SECONDS);
      setPicked(null);
      setLocked(false);
      setPhase("play");
    } catch {
      setError("Сүлжээний алдаа.");
      setPhase("done");
    }
  }, [activeLevel, hydrated, phase, wordSourceQuery]);

  useEffect(() => {
    if (phase === "loading") void loadDeck();
  }, [phase, loadDeck]);

  useEffect(() => {
    if (phase !== "play") return;
    if (timeLeft <= 0) {
      finishGame();
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft, finishGame]);

  function pickOption(option: string) {
    if (locked || !current || phase !== "play") return;
    setLocked(true);
    setPicked(option);
    const ok = option === current.correct;

    if (ok) {
      correctRef.current += 1;
      streakRef.current += 1;
      const bonus = Math.min(5, streakRef.current);
      const points = 10 + bonus;
      setCorrectCount(correctRef.current);
      setStreak(streakRef.current);
      setScore((s) => s + points);
    } else {
      streakRef.current = 0;
      setStreak(0);
    }

    setTimeout(() => {
      indexRef.current += 1;
      setIndex(indexRef.current);
      setPicked(null);
      setLocked(false);
    }, 400);
  }

  if (!hydrated) {
    return (
      <GameShell mainClassName=" px-4 py-12 text-center text-sm text-[var(--app-muted)]">
        {tr(locale, "Ачааллаж байна…")}
      </GameShell>
    );
  }

  if (phase === "source") {
    return (
      <GameShell mainClassName=" px-4 pb-8">
        <div className="bs-mock-setup">
          <h1 className="bs-mock-title">{tr(locale, "Хурдны тэмцээн")}</h1>
          <p className="bs-mock-sub">
            {tr(locale, "60 секундэд хэдэн зөв хариулах вэ?")}
          </p>
          <GameWordSourcePicker
            value={wordSource}
            onChange={setWordSource}
            isLoggedIn={isLoggedIn}
          />
          <button
            type="button"
            className="bs-mock-primary-btn mt-5"
            disabled={sourceLoading}
            onClick={() => void confirmSource()}
          >
            {tr(locale, sourceLoading ? "Бэлдэж байна…" : "Эхлэх →")}
          </button>
          <Link href="/games" className="bs-meaning-link mt-4 block text-center">
            {tr(locale, "← Тоглоом руу")}
          </Link>
        </div>
      </GameShell>
    );
  }

  if (phase === "loading") {
    return (
      <GameShell mainClassName=" px-4 py-12 text-center text-sm text-[var(--app-muted)]">
        {tr(locale, "Асуулт бэлдэж байна…")}
      </GameShell>
    );
  }

  if (phase === "done") {
    return (
      <GameShell mainClassName=" px-4 pb-8">
        <div className="bs-meaning-done">
          <h2 className="text-xl font-extrabold text-[var(--bs-ink)]">
            {tr(locale, error ? "Тоглоом эхлэхгүй" : "⏱ Цаг дууслаа!")}
          </h2>
          {error ? (
            <p className="mt-2 text-sm text-red-600">{tr(locale, error)}</p>
          ) : (
            <>
              <p className="bs-meaning-final-score">⭐ {score}</p>
              <p className="mt-1 text-sm text-[var(--app-muted)]">
                {tr(locale, "Зөв:")} {correctCount} · {tr(locale, "Цуваа")}{" "}
                {streak}
              </p>
            </>
          )}
          <button
            type="button"
            onClick={() => setPhase("source")}
            className="bs-meaning-primary-btn mt-5"
          >
            {tr(locale, "Дахин тоглох")}
          </button>
          <Link href="/games" className="bs-meaning-link mt-3">
            {tr(locale, "← Тоглоом руу")}
          </Link>
        </div>
      </GameShell>
    );
  }

  if (!current) return null;

  const timerPct = (timeLeft / ROUND_SECONDS) * 100;

  return (
    <GameShell mainClassName=" bg-[var(--bs-bg)] px-4 pt-4 pb-8">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h1 className="text-base font-extrabold text-[var(--bs-ink)]">
            {tr(locale, "Хурдны тэмцээн")}
          </h1>
          <p className="text-[11px] font-bold text-[var(--bs-muted)]">
            {formatActiveHskLevel(activeLevel)} · 60 {tr(locale, "сек")}
          </p>
        </div>
        <HskLevelSelector className="shrink-0" />
      </div>

      <div className="mb-3 flex items-center justify-between text-sm font-extrabold">
        <span className="text-[var(--bs-green-700)]">⭐ {score}</span>
        <span className="text-amber-600">🔥 {streak}</span>
        <span className="text-[var(--bs-muted)]">
          ⏱ {timeLeft}
          {tr(locale, "с")}
        </span>
      </div>

      <div className="mb-4 h-3 overflow-hidden rounded-full bg-[#e1ebe5]">
        <div
          className="h-full rounded-full bg-[#1FB85A] transition-all duration-1000 linear"
          style={{ width: `${timerPct}%` }}
        />
      </div>

      <div className="bs-meaning-card">
        <p className="text-center text-sm font-bold text-[var(--bs-muted)]">
          {current.promptLabel}
        </p>
        <p className="mt-2 text-center text-base font-bold text-[var(--bs-ink)]">
          {current.display}
        </p>
        {current.subDisplay &&
        !(current.kind === "word-recall" && !locked) ? (
          <p className="text-center text-sm text-[var(--bs-green)]">
            {current.subDisplay}
          </p>
        ) : null}

        <div className="mt-4 grid grid-cols-2 gap-2">
          {current.options.map((option) => {
            let cls = "bs-meaning-option bs-meaning-option--hanzi";
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
        {tr(locale, "← Буцах")}
      </Link>
    </GameShell>
  );
}
