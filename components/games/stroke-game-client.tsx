"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { GameCard } from "@/components/games/game-card";
import { GameEmptyState } from "@/components/games/game-empty-state";
import { GameHeader } from "@/components/games/game-header";
import { GameOptionButton } from "@/components/games/game-option-button";
import { GameProgressPill } from "@/components/games/game-progress-pill";
import { GameResultCard } from "@/components/games/game-result-card";
import { GameShell } from "@/components/games/game-shell";
import { buildStrokeGameItems } from "@/lib/games/game-data";
import { resolveGameLabels, type GameLabels } from "@/lib/games/game-lesson-meta";
import { saveGameResult } from "@/lib/games/game-progress";
import {
  extractHanziCharacters,
  HANZI_WRITING_LABELS,
  resolveLessonPracticeHanzi,
} from "@/lib/hanzi/writing-practice";
import type { GameVocabItem } from "@/lib/games/game-types";
import type { HskCharacterNote } from "@/lib/lesson/hsk-lesson-content";

type Props = {
  lessonId: string;
  vocabulary: GameVocabItem[];
  isKorean?: boolean;
  isPrelesson?: boolean;
  labels?: GameLabels;
  hskCharacterNotes?: HskCharacterNote[];
};

export function StrokeGameClient({
  lessonId,
  vocabulary,
  isKorean = false,
  isPrelesson = false,
  labels: labelsProp,
  hskCharacterNotes = [],
}: Props) {
  const labels = labelsProp ?? resolveGameLabels(isKorean, isPrelesson);
  const gameContext = { isKorean, isPrelesson, hskCharacterNotes };
  const questions = useMemo(
    () => buildStrokeGameItems(vocabulary, 6, gameContext),
    [vocabulary, isKorean, isPrelesson, hskCharacterNotes]
  );
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const current = questions[index];
  const total = questions.length;
  const isHangul = current?.mode === "hangul";
  const isStrokeOrder = current?.mode === "stroke-order";
  const isComponent = current?.mode === "component";
  const lessonPracticeHanzi = useMemo(
    () => resolveLessonPracticeHanzi(lessonId, vocabulary),
    [lessonId, vocabulary]
  );
  const writingChar =
    current && !isHangul
      ? extractHanziCharacters(current.chinese)[0] ?? current.chinese
      : null;
  const writingHref =
    writingChar && lessonPracticeHanzi.includes(writingChar)
      ? `/kanji/${encodeURIComponent(writingChar)}?lessonId=${encodeURIComponent(lessonId)}&write=1`
      : null;

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
        <GameHeader title={labels.strokeTitle} />
        <GameEmptyState
          lessonId={lessonId}
          message={labels.strokeEmptyMessage}
        />
      </GameShell>
    );
  }

  if (finished) {
    return (
      <GameShell>
        <GameHeader title={labels.strokeTitle} score={score} />
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
        title={labels.strokeTitle}
        progress={`${index + 1}/${total}`}
        score={score}
      />
      <p className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-center text-[11px] leading-snug text-amber-800 ring-1 ring-amber-200">
        {labels.strokeDesc}
      </p>
      <GameProgressPill current={index + 1} total={total} />
      {current ? (
        <>
          <GameCard className="mb-4 text-center">
            {isHangul ? (
              <>
                <p className="text-3xl font-bold tracking-wide text-[var(--app-text)]">
                  {current.prompt}
                </p>
                <p className="mt-3 text-lg text-purple-700">{current.chinese}</p>
                <p className="mt-1 text-sm text-[var(--app-muted)]">
                  {current.mongolian}
                </p>
              </>
            ) : (
              <>
                <p className="text-5xl font-bold text-[var(--app-text)]">
                  {current.chinese}
                </p>
                <p className="mt-2 text-lg text-emerald-700">{current.pinyin}</p>
                <p className="mt-1 text-sm text-[var(--app-muted)]">
                  {current.mongolian}
                </p>
                {current.formulaPrompt ? (
                  <p className="mt-4 text-xl font-semibold tracking-wide text-purple-700">
                    {current.formulaPrompt}
                  </p>
                ) : null}
                <p className="mt-2 text-sm font-medium text-[var(--app-text)]">
                  {current.prompt}
                </p>
                {isStrokeOrder ? (
                  <p className="mt-1 text-xs text-[var(--app-muted)]">
                    Зураасны дараалал
                  </p>
                ) : null}
                {isComponent ? (
                  <p className="mt-1 text-xs text-[var(--app-muted)]">
                    偏旁 / бүрдэл
                  </p>
                ) : null}
              </>
            )}
          </GameCard>
          <div
            className={`grid gap-2 ${
              isComponent && current.questionType !== "structure"
                ? "grid-cols-2"
                : "grid-cols-1"
            }`}
          >
            {current.options.map((option) => {
              let state: "default" | "correct" | "wrong" | "selected" =
                "default";
              if (revealed) {
                if (option === current.correctComponent) state = "correct";
                else if (option === selected) state = "wrong";
              } else if (option === selected) {
                state = "selected";
              }
              const isLargeComponentOption =
                isComponent &&
                (current.questionType === "completion" ||
                  current.questionType === "reverse");
              return (
                <GameOptionButton
                  key={option}
                  label={option}
                  state={state}
                  disabled={revealed}
                  onClick={() => handleSelect(option)}
                  className={
                    isLargeComponentOption
                      ? "!text-2xl !font-bold"
                      : "!text-sm !font-medium !leading-snug"
                  }
                />
              );
            })}
          </div>
          {revealed && current.explanation ? (
            <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-3 text-sm leading-relaxed text-emerald-900 ring-1 ring-emerald-200">
              {current.explanation}
            </p>
          ) : null}
          {revealed && writingHref ? (
            <Link
              href={writingHref}
              className="mt-3 flex min-h-[44px] w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              {HANZI_WRITING_LABELS.traceWriteLong}
            </Link>
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
