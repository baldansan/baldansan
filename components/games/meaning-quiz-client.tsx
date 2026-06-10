"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useActiveHskLevel } from "@/components/providers/active-hsk-level-provider";
import { GameShell } from "@/components/games/game-shell";
import {
  buildMeaningQuizDeck,
  MAX_LIVES,
  QUESTION_SECONDS,
  scoreMeaningQuiz,
  type MeaningQuizQuestion,
} from "@/lib/games/meaning-quiz";
import { saveGameResult } from "@/lib/games/game-progress";
import { fetchHskWordsByLevel } from "@/lib/supabase/hsk-words";

type Phase = "loading" | "play" | "done";
type AnswerState = "idle" | "correct" | "wrong";

export function MeaningQuizClient() {
  const { level: activeLevel, hydrated } = useActiveHskLevel();
  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState<string | null>(null);
  const [deck, setDeck] = useState<MeaningQuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_SECONDS);
  const [answerState, setAnswerState] = useState<AnswerState>("idle");
  const [picked, setPicked] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);

  const current = deck[index];
  const total = deck.length;
  const timerPct = (timeLeft / QUESTION_SECONDS) * 100;

  const loadDeck = useCallback(async () => {
    if (!hydrated) return;
    setPhase("loading");
    setError(null);
    const { data, error: fetchError } = await fetchHskWordsByLevel(activeLevel);
    if (fetchError || data.length < 4) {
      setError(fetchError ?? "Үгийн сан хангалтгүй байна.");
      setPhase("done");
      return;
    }
    const built = buildMeaningQuizDeck(data, activeLevel, 15);
    if (built.length === 0) {
      setError("Асуулт бүрдэж чадсангүй.");
      setPhase("done");
      return;
    }
    setDeck(built);
    setIndex(0);
    setLives(MAX_LIVES);
    setScore(0);
    setCorrect(0);
    setTimeLeft(QUESTION_SECONDS);
    setAnswerState("idle");
    setPicked(null);
    setLocked(false);
    setPhase("play");
  }, [activeLevel, hydrated]);

  useEffect(() => {
    void loadDeck();
  }, [loadDeck]);

  const advance = useCallback(() => {
    if (index >= deck.length - 1) {
      const finalScore = scoreMeaningQuiz(correct, total, lives);
      setScore(finalScore);
      saveGameResult({
        gameType: "meaning",
        lessonId: "hsk",
        score: finalScore,
        correct,
        total,
        accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
        playedAt: new Date().toISOString(),
      });
      setPhase("done");
      return;
    }
    setIndex((i) => i + 1);
    setTimeLeft(QUESTION_SECONDS);
    setAnswerState("idle");
    setPicked(null);
    setLocked(false);
  }, [index, deck.length, correct, total, lives]);

  useEffect(() => {
    if (phase !== "play" || locked || !current) return;
    if (timeLeft <= 0) {
      setLocked(true);
      setAnswerState("wrong");
      setLives((l) => {
        const next = l - 1;
        if (next <= 0) {
          setTimeout(() => {
            const finalScore = scoreMeaningQuiz(correct, total, 0);
            setScore(finalScore);
            saveGameResult({
              gameType: "meaning",
              lessonId: "hsk",
              score: finalScore,
              correct,
              total,
              accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
              playedAt: new Date().toISOString(),
            });
            setPhase("done");
          }, 900);
        } else {
          setTimeout(() => advance(), 900);
        }
        return Math.max(0, next);
      });
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, locked, timeLeft, current, advance, correct, total]);

  function pickOption(option: string) {
    if (locked || !current) return;
    setLocked(true);
    setPicked(option);
    const ok = option === current.correct;
    setAnswerState(ok ? "correct" : "wrong");
    if (ok) {
      setCorrect((c) => c + 1);
      setScore((s) => s + 10);
      setTimeout(() => advance(), 700);
    } else {
      setLives((l) => {
        const next = l - 1;
        if (next <= 0) {
          setTimeout(() => {
            const finalScore = scoreMeaningQuiz(correct, total, 0);
            setScore(finalScore);
            saveGameResult({
              gameType: "meaning",
              lessonId: "hsk",
              score: finalScore,
              correct,
              total,
              accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
              playedAt: new Date().toISOString(),
            });
            setPhase("done");
          }, 900);
        } else {
          setTimeout(() => advance(), 900);
        }
        return Math.max(0, next);
      });
    }
  }

  const timerColor = useMemo(() => {
    if (timeLeft <= 3) return "bg-red-500";
    if (timeLeft <= 6) return "bg-amber-400";
    return "bg-[var(--app-primary)]";
  }, [timeLeft]);

  if (!hydrated || phase === "loading") {
    return (
      <GameShell mainClassName="max-w-[430px] mx-auto w-full px-4 py-12 text-center text-sm text-[var(--app-muted)]">
        Ачааллаж байна…
      </GameShell>
    );
  }

  if (phase === "done") {
    return (
      <GameShell mainClassName="max-w-[430px] mx-auto w-full px-4 pb-8">
        <div className="rounded-[24px] bg-white p-6 text-center shadow-[var(--bs-shadow)]">
          <h2 className="text-xl font-bold">
            {lives > 0 && correct === total ? "🏆 Төгс!" : "Тоглоом дууслаа"}
          </h2>
          {error ? (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          ) : (
            <>
              <p className="mt-3 text-3xl font-black text-[var(--app-primary-dark)]">
                ⭐ {score}
              </p>
              <p className="mt-1 text-sm text-[var(--app-muted)]">
                Зөв: {correct} / {total}
              </p>
            </>
          )}
          <button
            type="button"
            onClick={() => void loadDeck()}
            className="mt-5 min-h-[48px] w-full rounded-[14px] bg-[var(--app-primary)] text-sm font-extrabold text-white"
          >
            Дахин тоглох
          </button>
          <Link
            href="/games"
            className="mt-2 block text-sm font-bold text-[var(--app-primary-dark)] underline"
          >
            ← Тоглоом руу
          </Link>
        </div>
      </GameShell>
    );
  }

  if (!current) return null;

  return (
    <GameShell mainClassName="max-w-[430px] mx-auto w-full bg-[#f1f6f3] px-4 pt-5 pb-8">
      <div className="mb-3 flex items-center justify-between text-sm font-extrabold">
        <span className="text-red-500">
          {"❤️".repeat(lives)}
          {"🖤".repeat(MAX_LIVES - lives)}
        </span>
        <span className="text-[var(--app-primary-dark)]">⭐ {score}</span>
        <span className="text-[var(--app-muted)]">
          {index + 1}/{total}
        </span>
      </div>

      <div className="mb-4 h-2 overflow-hidden rounded-full bg-[#e1ebe5]">
        <div
          className={`h-full rounded-full transition-all duration-1000 linear ${timerColor}`}
          style={{ width: `${timerPct}%` }}
        />
      </div>

      <div className="rounded-[24px] bg-white p-5 shadow-[0_12px_30px_rgba(25,40,30,0.10)]">
        <p className="text-center text-sm font-bold text-[var(--app-muted)]">
          Энэ үгийн утга?
        </p>
        <p className="bs-srs-hanzi mt-2 text-center">{current.hanzi}</p>
        {current.pinyin ? (
          <p className="text-center text-sm text-[var(--app-primary)]">
            {current.pinyin}
          </p>
        ) : null}

        <div className="mt-4 grid gap-2">
          {current.options.map((option) => {
            let cls =
              "rounded-[14px] border border-[var(--app-border)] bg-white px-3 py-3 text-left text-sm font-bold transition active:scale-[0.98]";
            if (locked && option === current.correct) {
              cls += " border-[#1FB85A] bg-[#EAF8F0] text-[#149247]";
            } else if (locked && picked === option && option !== current.correct) {
              cls += " border-red-400 bg-red-50 text-red-700";
            } else if (answerState === "correct" && picked === option) {
              cls += " border-[#1FB85A] bg-[#EAF8F0]";
            }
            return (
              <button
                key={option}
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

      <Link
        href="/games"
        className="mt-4 block text-center text-xs font-bold text-[var(--app-primary-dark)] underline"
      >
        ← Буцах
      </Link>
    </GameShell>
  );
}
