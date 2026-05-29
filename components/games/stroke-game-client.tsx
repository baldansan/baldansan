"use client";

import { useMemo, useState } from "react";
import { GameCard } from "@/components/games/game-card";
import { GameEmptyState } from "@/components/games/game-empty-state";
import { GameHeader } from "@/components/games/game-header";
import { GameOptionButton } from "@/components/games/game-option-button";
import { GameProgressPill } from "@/components/games/game-progress-pill";
import { GameResultCard } from "@/components/games/game-result-card";
import { GameShell } from "@/components/games/game-shell";
import { buildStrokeGameItems } from "@/lib/games/game-data";
import { saveGameResult } from "@/lib/games/game-progress";
import type { GameVocabItem } from "@/lib/games/game-types";

type Props = {
  lessonId: string;
  vocabulary: GameVocabItem[];
};

export function StrokeGameClient({ lessonId, vocabulary }: Props) {
  const questions = useMemo(
    () => buildStrokeGameItems(vocabulary),
    [vocabulary]
  );
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const current = questions[index];
  const total = questions.length;

  function finishGame(finalCorrect: number) {
    const finalScore = finalCorrect * 10;
    saveGameResult({
      gameType: "stroke",
      lessonId,
      score: finalScore,
      correct: finalCorrect,
      total,
      accuracy: Math.round((finalCorrect / total) * 100),
      playedAt: new Date().toISOString(),
    });
    setScore(finalScore);
    setFinished(true);
  }

  function handleSelect(option: string) {
    if (!current || revealed) return;
    setSelected(option);
    setRevealed(true);
    const isCorrect = option === current.correctComponent;
    const nextCorrect = isCorrect ? correctCount + 1 : correctCount;
    if (isCorrect) {
      setCorrectCount((c) => c + 1);
      setScore((s) => s + 10);
    }
    if (index >= total - 1) finishGame(nextCorrect);
  }

  function handleNext() {
    setIndex((i) => i + 1);
    setSelected(null);
    setRevealed(false);
  }

  function restart() {
    setIndex(0);
    setSelected(null);
    setRevealed(false);
    setCorrectCount(0);
    setScore(0);
    setFinished(false);
  }

  if (questions.length === 0) {
    return (
      <GameShell>
        <GameHeader title="Дутуу зураас" />
        <GameEmptyState
          lessonId={lessonId}
          message="Энэ хичээлд ханзны бүтэц тоглоом үүсгэхэд хангалттай үг алга."
        />
      </GameShell>
    );
  }

  if (finished) {
    return (
      <GameShell>
        <GameHeader title="Дутуу зураас" score={score} />
        <GameResultCard
          score={score}
          correct={correctCount}
          total={total}
          accuracy={Math.round((correctCount / total) * 100)}
          xpGained={score}
          lessonId={lessonId}
          onPlayAgain={restart}
        />
      </GameShell>
    );
  }

  return (
    <GameShell>
      <GameHeader
        title="Дутуу зураас"
        progress={`${index + 1}/${total}`}
        score={score}
      />
      <p className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-center text-[11px] leading-snug text-amber-800 ring-1 ring-amber-200">
        Дутуу зураас / ханзны бүтэц тоглоом — эхний demo хувилбар
      </p>
      <GameProgressPill current={index + 1} total={total} />
      {current ? (
        <>
          <GameCard className="mb-4 text-center">
            <p className="text-5xl font-bold text-[var(--app-text)]">
              {current.chinese}
            </p>
            <p className="mt-2 text-lg text-emerald-700">{current.pinyin}</p>
            <p className="mt-1 text-sm text-[var(--app-muted)]">
              {current.mongolian}
            </p>
            <p className="mt-4 text-base font-semibold text-purple-700">
              ? + бүрэлдэхүүн = {current.chinese}
            </p>
            <p className="mt-1 text-xs text-[var(--app-muted)]">
              {current.prompt}
            </p>
          </GameCard>
          <div className="grid grid-cols-2 gap-2">
            {current.options.map((option) => {
              let state: "default" | "correct" | "wrong" | "selected" =
                "default";
              if (revealed) {
                if (option === current.correctComponent) state = "correct";
                else if (option === selected) state = "wrong";
              } else if (option === selected) {
                state = "selected";
              }
              return (
                <GameOptionButton
                  key={option}
                  label={option}
                  state={state}
                  disabled={revealed}
                  onClick={() => handleSelect(option)}
                  className="!text-2xl !font-bold"
                />
              );
            })}
          </div>
          {revealed && index < total - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="mt-4 min-h-[44px] w-full rounded-full bg-emerald-500 py-3 text-sm font-semibold text-white"
            >
              Дараах
            </button>
          ) : null}
        </>
      ) : null}
    </GameShell>
  );
}
