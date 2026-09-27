"use client";

import { useEffect, useMemo, useState } from "react";
import { GameCard } from "@/components/games/game-card";
import { GameEmptyState } from "@/components/games/game-empty-state";
import { GameHeader } from "@/components/games/game-header";
import { GameResultCard } from "@/components/games/game-result-card";
import { GameShell } from "@/components/games/game-shell";
import { LevelResultCard } from "@/components/games/level-result-card";
import { buildArrangeGameItems } from "@/lib/games/game-data";
import { resolveGameLabels, type GameLabels } from "@/lib/games/game-lesson-meta";
import { saveGameResult } from "@/lib/games/game-progress";
import {
  TOTAL_LEVELS,
  levelHeaderInfo,
  levelShellClass,
  type LevelMode,
} from "@/lib/games/level-core";
import { SpeakerButton } from "@/components/tts/speaker-button";
import { resolveTtsLang } from "@/lib/tts/infer-lang";
import type { GameVocabItem } from "@/lib/games/game-types";
import { useActivityTracker } from "@/lib/analytics/activity-tracker";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { tr } from "@/lib/i18n/translate";

type Props = {
  lessonId: string;
  courseId?: string;
  vocabulary: GameVocabItem[];
  isKorean?: boolean;
  isPrelesson?: boolean;
  labels?: GameLabels;
  /** «Үе давах» горим — level-game-host дамжуулна. */
  levelMode?: LevelMode;
};

export function ArrangeGameClient({
  lessonId,
  courseId,
  vocabulary,
  isKorean = false,
  isPrelesson = false,
  labels: labelsProp,
  levelMode,
}: Props) {
  useActivityTracker("game", "arrange");
  const locale = useUiLocale();
  const labels = labelsProp ?? resolveGameLabels(isKorean, isPrelesson);
  const gameContext = { isKorean, isPrelesson };
  const questions = useMemo(
    () => buildArrangeGameItems(vocabulary, levelMode?.total ?? 6, gameContext),
    [vocabulary, isKorean, isPrelesson, levelMode?.total]
  );
  const [qIndex, setQIndex] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [pool, setPool] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const current = questions[qIndex];
  const total = questions.length;
  const ttsLang = resolveTtsLang({ courseId });

  useEffect(() => {
    if (current) {
      setPicked([]);
      setPool([...current.tiles]);
      setChecked(false);
      setIsCorrect(false);
    }
  }, [qIndex, current]);

  function pickTile(tile: string, fromPoolIndex: number) {
    if (checked) return;
    setPicked((p) => [...p, tile]);
    setPool((p) => p.filter((_, i) => i !== fromPoolIndex));
  }

  function unpick(index: number) {
    if (checked) return;
    const tile = picked[index];
    setPicked((p) => p.filter((_, i) => i !== index));
    setPool((p) => [...p, tile]);
  }

  function finishGame(finalCorrect: number) {
    const finalScore = finalCorrect * 10;
    if (levelMode) {
      levelMode.onFinished(finalCorrect, total);
      setScore(finalScore);
      setCorrectCount(finalCorrect);
      setFinished(true);
      return;
    }
    saveGameResult({
      gameType: "arrange",
      lessonId,
      score: finalScore,
      correct: finalCorrect,
      total,
      accuracy: Math.round((finalCorrect / total) * 100),
      playedAt: new Date().toISOString(),
    });
    setScore(finalScore);
    setCorrectCount(finalCorrect);
    setFinished(true);
  }

  function handleCheckOrNext() {
    if (!current) return;
    if (!checked) {
      const ok = picked.join("") === current.target;
      setIsCorrect(ok);
      setChecked(true);
      const nextCorrect = ok ? correctCount + 1 : correctCount;
      if (ok) {
        setCorrectCount(nextCorrect);
        setScore((s) => s + 10);
      }
      if (qIndex >= total - 1) {
        finishGame(nextCorrect);
      }
      return;
    }

    if (qIndex >= total - 1) {
      finishGame(correctCount);
      return;
    }
    setQIndex((i) => i + 1);
  }

  function restart() {
    setQIndex(0);
    setPicked([]);
    setChecked(false);
    setCorrectCount(0);
    setScore(0);
    setFinished(false);
  }

  if (questions.length === 0) {
    return (
      <GameShell>
        <GameHeader title={labels.arrangeTitle} />
        <GameEmptyState
          lessonId={lessonId}
          message={labels.arrangeEmptyMessage}
        />
      </GameShell>
    );
  }

  const headerLevel = levelMode ? levelHeaderInfo(levelMode) : undefined;
  const backHref = levelMode?.mapHref;
  const shellClass = levelShellClass(levelMode);

  if (finished && levelMode) {
    return (
      <GameShell mainClassName={shellClass}>
        <GameHeader
          title={labels.arrangeTitle}
          backHref={backHref}
          level={headerLevel}
          score={score}
        />
        <LevelResultCard
          meta={levelMode.meta}
          correct={correctCount}
          total={total}
          onNextLevel={levelMode.onNextLevel}
          onRetry={restart}
          mapHref={levelMode.mapHref}
          isLast={levelMode.level >= TOTAL_LEVELS}
        />
      </GameShell>
    );
  }

  if (finished) {
    return (
      <GameShell>
        <GameHeader title={labels.arrangeTitle} score={score} />
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
    <GameShell mainClassName={shellClass}>
      <GameHeader
        title={labels.arrangeTitle}
        backHref={backHref}
        level={headerLevel}
        progress={`${qIndex + 1}/${total}`}
        score={score}
      />
      {current ? (
        <>
          <GameCard className="mb-3 min-h-[56px]">
            <div className="flex items-center justify-center gap-2">
              <p className="text-center text-xl font-bold tracking-widest text-[var(--app-text)]">
                {picked.length > 0 ? picked.join("") : "—"}
              </p>
              {checked && current.target ? (
                <SpeakerButton
                  text={current.target}
                  lang={ttsLang}
                  courseId={courseId}
                  size="sm"
                />
              ) : null}
            </div>
            <p className="mt-1 text-center text-xs text-[var(--app-muted)]" translate="no">
              {current.mongolianHint}
            </p>
          </GameCard>
          {checked ? (
            <p
              className={`mb-3 text-center text-sm font-semibold ${isCorrect ? "text-emerald-600" : "text-red-600"}`}
            >
              {isCorrect
                ? tr(locale, "Зөв!")
                : `${tr(locale, "Зөв:")} ${current.target}`}
            </p>
          ) : null}
          <div className="mb-4 flex flex-wrap gap-2">
            {pool.map((tile, i) => (
              <button
                key={`${tile}-${i}`}
                type="button"
                onClick={() => pickTile(tile, i)}
                className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-lg font-bold shadow-sm active:bg-slate-50"
              >
                {tile}
              </button>
            ))}
          </div>
          {picked.length > 0 ? (
            <div className="mb-4 flex flex-wrap gap-2">
              {picked.map((tile, i) => (
                <button
                  key={`p-${tile}-${i}`}
                  type="button"
                  onClick={() => unpick(i)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-base font-bold text-purple-800"
                >
                  {tile}
                </button>
              ))}
            </div>
          ) : null}
          <button
            type="button"
            onClick={handleCheckOrNext}
            disabled={!checked && picked.length === 0}
            className="min-h-[48px] w-full app-btn-primary py-3 text-sm font-bold disabled:opacity-50"
          >
            {tr(
              locale,
              checked ? (qIndex < total - 1 ? "Дараах" : "Дуусгах") : "Шалгах"
            )}
          </button>
        </>
      ) : null}
    </GameShell>
  );
}
