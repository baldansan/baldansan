"use client";

import { useEffect, useMemo, useState } from "react";
import { GameCard } from "@/components/games/game-card";
import { GameEmptyState } from "@/components/games/game-empty-state";
import { GameHeader } from "@/components/games/game-header";
import { GameOptionButton } from "@/components/games/game-option-button";
import { GameProgressPill } from "@/components/games/game-progress-pill";
import { GameResultCard } from "@/components/games/game-result-card";
import { GameShell } from "@/components/games/game-shell";
import { buildRadicalDecomposeGameItems, isNewRadicalFamily } from "@/lib/games/radical-decompose-game";
import { resolveGameLabels, type GameLabels } from "@/lib/games/game-lesson-meta";
import { saveGameResult } from "@/lib/games/game-progress";
import type { HskCharacter } from "@/types/hsk-lesson-package";

type Props = {
  lessonId: string;
  lessonCharacters: HskCharacter[];
  labels?: GameLabels;
};

export function RadicalGameClient({
  lessonId,
  lessonCharacters,
  labels: labelsProp,
}: Props) {
  const labels = labelsProp ?? resolveGameLabels(false, false);
  const questions = useMemo(
    () => buildRadicalDecomposeGameItems(lessonCharacters, 8),
    [lessonCharacters]
  );

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [pool, setPool] = useState<string[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const current = questions[index];
  const total = questions.length;
  const showFamilyBanner = current && isNewRadicalFamily(questions, index);

  useEffect(() => {
    if (!current || current.type !== "assemble") return;
    setPicked([]);
    setPool([...(current.shuffledComponents ?? [])]);
    setSelected(null);
    setRevealed(false);
  }, [index, current]);

  function finishGame(finalCorrect: number) {
    const finalScore = finalCorrect * 10;
    saveGameResult({
      gameType: "radical",
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

  function handleMeaningSelect(option: string) {
    if (!current || revealed || current.type !== "meaning") return;
    setSelected(option);
    setRevealed(true);
    const isCorrect = option === current.correctAnswer;
    const nextCorrect = isCorrect ? correctCount + 1 : correctCount;
    if (isCorrect) {
      setCorrectCount((c) => c + 1);
      setScore((s) => s + 10);
    }
    if (index >= total - 1) finishGame(nextCorrect);
  }

  function pickComponent(tile: string, fromPoolIndex: number) {
    if (!current || revealed || current.type !== "assemble") return;
    setPicked((prev) => [...prev, tile]);
    setPool((prev) => prev.filter((_, i) => i !== fromPoolIndex));
  }

  function unpickComponent(slotIndex: number) {
    if (!current || revealed || current.type !== "assemble") return;
    const tile = picked[slotIndex];
    setPicked((prev) => prev.filter((_, i) => i !== slotIndex));
    setPool((prev) => [...prev, tile]);
  }

  function handleAssembleCheck() {
    if (!current || revealed || current.type !== "assemble") return;
    const isCorrect =
      Boolean(current.componentOrder) &&
      picked.length === current.componentOrder!.length &&
      picked.every((part, i) => part === current.componentOrder![i]);
    setRevealed(true);
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
    setPicked([]);
  }

  function restart() {
    setIndex(0);
    setSelected(null);
    setRevealed(false);
    setPicked([]);
    setCorrectCount(0);
    setScore(0);
    setFinished(false);
  }

  if (questions.length === 0) {
    return (
      <GameShell>
        <GameHeader title={labels.radicalTitle} />
        <GameEmptyState lessonId={lessonId} message={labels.radicalEmptyMessage} />
      </GameShell>
    );
  }

  if (finished) {
    return (
      <GameShell>
        <GameHeader title={labels.radicalTitle} score={score} />
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

  const isMeaning = current?.type === "meaning";
  const isAssemble = current?.type === "assemble";
  const assembleReady =
    isAssemble &&
    current.componentOrder &&
    picked.length === current.componentOrder.length;

  return (
    <GameShell>
      <GameHeader
        title={labels.radicalTitle}
        progress={`${index + 1}/${total}`}
        score={score}
      />
      <p className="mb-3 rounded-xl bg-violet-50 px-3 py-2 text-center text-[11px] leading-snug text-violet-900 ring-1 ring-violet-200">
        {labels.radicalDesc}
      </p>
      <GameProgressPill current={index + 1} total={total} />

      {showFamilyBanner && current ? (
        <div className="mb-3 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 ring-1 ring-amber-200">
          <p className="text-[11px] font-bold uppercase tracking-wide text-amber-800">
            {labels.radicalFamilyLabel}
          </p>
          <p className="mt-1 font-[family-name:var(--font-noto-sc,'Noto Sans SC',sans-serif)] text-2xl font-black text-[var(--app-text)]">
            {current.familyRadical}
          </p>
          <p className="mt-1 text-sm text-[var(--app-muted)]">
            {current.familyHanzi.join(" · ")}
          </p>
        </div>
      ) : null}

      {current ? (
        <>
          <GameCard className="mb-4 text-center">
            <p className="text-5xl font-bold text-[var(--app-text)]">
              {isMeaning || revealed ? current.targetHanzi : "?"}
            </p>
            <p className="mt-2 text-lg text-emerald-700">{current.targetPinyin}</p>
            <p className="mt-1 text-sm text-[var(--app-muted)]">
              {current.targetMeaning}
            </p>
            <p className="mt-4 text-xl font-semibold tracking-wide text-purple-700">
              {isMeaning
                ? `${current.promptComponent} = ?`
                : current.formula.replace(current.targetHanzi, "?")}
            </p>
            <p className="mt-2 text-sm font-medium text-[var(--app-text)]">
              {isMeaning
                ? `${current.promptComponent} ямар утгатай вэ?`
                : "Бүрдэлүүдийг зөв дарааллаар сонго"}
            </p>
          </GameCard>

          {isMeaning ? (
            <div className="grid grid-cols-1 gap-2">
              {current.options.map((option) => {
                let state: "default" | "correct" | "wrong" | "selected" = "default";
                if (revealed) {
                  if (option === current.correctAnswer) state = "correct";
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
                    onClick={() => handleMeaningSelect(option)}
                    className="!text-sm !font-medium !leading-snug"
                  />
                );
              })}
            </div>
          ) : null}

          {isAssemble ? (
            <>
              <div className="mb-3 flex min-h-[52px] flex-wrap justify-center gap-2 rounded-2xl bg-slate-50 px-3 py-3 ring-1 ring-slate-200">
                {picked.length === 0 ? (
                  <span className="text-sm text-[var(--app-muted)]">
                    Энд бүрдэлүүд харагдана
                  </span>
                ) : (
                  picked.map((tile, slotIndex) => (
                    <button
                      key={`${tile}-${slotIndex}`}
                      type="button"
                      onClick={() => unpickComponent(slotIndex)}
                      disabled={revealed}
                      className="min-h-[44px] min-w-[44px] rounded-xl bg-white px-3 text-2xl font-bold text-[var(--app-text)] ring-1 ring-slate-200 disabled:opacity-60"
                    >
                      {tile}
                    </button>
                  ))
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {pool.map((tile, poolIndex) => (
                  <GameOptionButton
                    key={`${tile}-${poolIndex}`}
                    label={tile}
                    disabled={revealed}
                    onClick={() => pickComponent(tile, poolIndex)}
                    className="!text-3xl !font-bold"
                  />
                ))}
              </div>
              {!revealed ? (
                <button
                  type="button"
                  onClick={handleAssembleCheck}
                  disabled={!assembleReady}
                  className="mt-4 min-h-[48px] w-full app-btn-primary py-3 disabled:opacity-50"
                >
                  Шалгах
                </button>
              ) : null}
            </>
          ) : null}

          {revealed && current.explanation ? (
            <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-3 text-sm leading-relaxed text-emerald-900 ring-1 ring-emerald-200">
              {current.explanation}
            </p>
          ) : null}

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
