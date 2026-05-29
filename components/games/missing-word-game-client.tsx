"use client";

import { useMemo, useState } from "react";
import { GameCard } from "@/components/games/game-card";
import { GameEmptyState } from "@/components/games/game-empty-state";
import { GameHeader } from "@/components/games/game-header";
import { GameOptionButton } from "@/components/games/game-option-button";
import { GameProgressPill } from "@/components/games/game-progress-pill";
import { GameResultCard } from "@/components/games/game-result-card";
import { GameShell } from "@/components/games/game-shell";
import { buildMissingWordItems } from "@/lib/games/game-data";
import { saveGameResult } from "@/lib/games/game-progress";
import { SpeakerButton } from "@/components/tts/speaker-button";
import { resolveTtsLang } from "@/lib/tts/infer-lang";
import type { GameVocabItem } from "@/lib/games/game-types";

type Props = {
  lessonId: string;
  courseId?: string;
  vocabulary: GameVocabItem[];
};

export function MissingWordGameClient({ lessonId, courseId, vocabulary }: Props) {
  const questions = useMemo(
    () => buildMissingWordItems(vocabulary),
    [vocabulary]
  );
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const current = questions[index];
  const total = questions.length;
  const ttsLang = resolveTtsLang({ courseId });

  function finishGame(finalCorrect: number) {
    const finalScore = finalCorrect * 10;
    saveGameResult({
      gameType: "missing-word",
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
    const isCorrect = option === current.correctAnswer;
    const next = isCorrect ? correctCount + 1 : correctCount;
    if (isCorrect) {
      setCorrectCount((c) => c + 1);
      setScore((s) => s + 10);
    }
    if (index >= total - 1) finishGame(next);
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
        <GameHeader title="Дутуу үг" />
        <GameEmptyState
          lessonId={lessonId}
          message="Энэ тоглоомд example sentence хэрэгтэй. Үг бүрт жишээ өгүүлбэр нэмэгдсэн эсэхийг шалгана уу."
        />
      </GameShell>
    );
  }

  if (finished) {
    return (
      <GameShell>
        <GameHeader title="Дутуу үг" score={score} />
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
        title="Дутуу үг"
        progress={`${index + 1}/${total}`}
        score={score}
      />
      <GameProgressPill current={index + 1} total={total} />
      {current ? (
        <>
          <GameCard className="mb-4">
            <div className="flex items-start justify-center gap-2">
              <p className="text-center text-xl font-medium leading-relaxed text-[var(--app-text)]">
                {current.sentence}
              </p>
              <SpeakerButton
                text={current.sentence.replace(/＿＿＿/g, current.correctAnswer)}
                lang={ttsLang}
                courseId={courseId}
                size="sm"
                label="Өгүүлбэр уншуулах"
              />
            </div>
            <p className="mt-2 text-center text-xs text-[var(--app-muted)]">
              {current.mongolianHint}
            </p>
          </GameCard>
          <div className="flex flex-col gap-2">
            {current.options.map((option) => {
              let state: "default" | "correct" | "wrong" = "default";
              if (revealed) {
                if (option === current.correctAnswer) state = "correct";
                else if (option === selected) state = "wrong";
              }
              return (
                <GameOptionButton
                  key={option}
                  label={option}
                  state={state}
                  disabled={revealed}
                  onClick={() => handleSelect(option)}
                />
              );
            })}
          </div>
          {revealed && index < total - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="mt-4 min-h-[48px] w-full app-btn-primary py-3"
            >
              Дараах
            </button>
          ) : null}
        </>
      ) : null}
    </GameShell>
  );
}
