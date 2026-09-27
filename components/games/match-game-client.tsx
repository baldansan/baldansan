"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GameCard } from "@/components/games/game-card";
import { GameEmptyState } from "@/components/games/game-empty-state";
import { GameHeader } from "@/components/games/game-header";
import { GameResultCard } from "@/components/games/game-result-card";
import { GameShell } from "@/components/games/game-shell";
import { LevelResultCard } from "@/components/games/level-result-card";
import { buildMatchGameItems, shuffleArray } from "@/lib/games/game-data";
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
import type { GameVocabItem, MatchPair } from "@/lib/games/game-types";
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
  /** «Үе давах» горим — level-game-host дамжуулна. Буруу оролдлого бүр нэг «зөв»-ийг хасна. */
  levelMode?: LevelMode;
};

/** Нэг үед харуулах хос — хэт олон болохоос сэргийлнэ. */
const ROUND_SIZE = 6;

/**
 * Бүх хосыг ROUND_SIZE-аар үед хуваана. Сүүлийн үлдэгдэл хэт бага (4-с бага,
 * тоглоомын доод босго) бол өмнөх үедээ нэгтгэнэ — «1 үгтэй үе» гарахгүй.
 */
function chunkPairs(pairs: MatchPair[], size: number): MatchPair[][] {
  if (pairs.length === 0) return [];
  const rounds: MatchPair[][] = [];
  for (let i = 0; i < pairs.length; i += size) {
    rounds.push(pairs.slice(i, i + size));
  }
  if (rounds.length > 1 && rounds[rounds.length - 1].length < 4) {
    const last = rounds.pop()!;
    rounds[rounds.length - 1] = [...rounds[rounds.length - 1], ...last];
  }
  return rounds;
}

export function MatchGameClient({
  lessonId,
  courseId,
  vocabulary,
  isKorean = false,
  isPrelesson = false,
  labels: labelsProp,
  levelMode,
}: Props) {
  useActivityTracker("game", "match");
  const locale = useUiLocale();
  const labels = labelsProp ?? resolveGameLabels(isKorean, isPrelesson);
  const gameContext = { isPrelesson };

  // «Үе давах» горимд зөвхөн тухайн үеийн үгс (levelMode.total ширхэг).
  // Хичээлийн дасгалд ЭНЭ хичээлийн БҮХ үгийг ROUND_SIZE-аар үе үе дамжина —
  // өмнө нь үргэлж зөвхөн эхний 6 үгийг л ашигладаг байсан тул нэг товч
  // үедээ дуусаад «дараагийн үе» гэж байдаггүй байсныг засав.
  const allPairs = useMemo(
    () =>
      buildMatchGameItems(
        vocabulary,
        levelMode ? levelMode.total : vocabulary.length,
        gameContext
      ),
    [vocabulary, isPrelesson, levelMode?.total]
  );
  const rounds = useMemo(
    () => (levelMode ? [allPairs] : chunkPairs(allPairs, ROUND_SIZE)),
    [allPairs, levelMode]
  );

  const [roundIndex, setRoundIndex] = useState(0);
  const pairs = rounds[roundIndex] ?? [];

  const leftItems = useMemo(
    () => shuffleArray(pairs.map((p) => ({ id: p.id, label: p.mongolian }))),
    [pairs]
  );
  const rightItems = useMemo(
    () =>
      shuffleArray(
        pairs.map((p) => ({
          id: p.id,
          label: p.chinese,
          sub: p.pinyin,
        }))
      ),
    [pairs]
  );

  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [wrongFlash, setWrongFlash] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [roundComplete, setRoundComplete] = useState(false);
  const [finished, setFinished] = useState(false);
  /** Үеийн горимд болон нийт дасгалд буруу оролдлогын тоо (нарийвчлал/од тооцоход). */
  const wrongRef = useRef(0);
  const [levelCorrect, setLevelCorrect] = useState(0);
  /** Тухайн үеийг аль хэдийн боловсруулсан эсэх — StrictMode давхар дуудахаас хамгаална. */
  const handledRef = useRef(false);

  const total = pairs.length;
  const matchedCount = matched.size;
  const isLastRound = roundIndex >= rounds.length - 1;
  const ttsLang = resolveTtsLang({ courseId });

  useEffect(() => {
    handledRef.current = false;
  }, [roundIndex]);

  // Тухайн үеийн бүх хос олдоход дуудагдана.
  useEffect(() => {
    if (handledRef.current) return;
    if (total === 0 || matchedCount < total) return;
    handledRef.current = true;

    if (levelMode) {
      const correct = Math.max(0, total - wrongRef.current);
      setLevelCorrect(correct);
      setScore(correct * 10);
      setFinished(true);
      levelMode.onFinished(correct, total);
      return;
    }

    setScore((prev) => prev + total * 10);

    if (isLastRound) {
      const totalPairs = allPairs.length;
      const accuracy =
        totalPairs > 0
          ? Math.round((totalPairs / (totalPairs + wrongRef.current)) * 100)
          : 100;
      saveGameResult({
        gameType: "match",
        lessonId,
        score: (score + total * 10),
        correct: totalPairs,
        total: totalPairs,
        accuracy,
        playedAt: new Date().toISOString(),
      });
      setFinished(true);
    } else {
      setRoundComplete(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchedCount, total, levelMode, isLastRound]);

  const tryMatch = useCallback(
    (leftId: string, rightId: string) => {
      if (leftId === rightId) {
        setMatched((prev) => new Set(prev).add(leftId));
      } else {
        wrongRef.current += 1;
        setWrongFlash(`${leftId}-${rightId}`);
        setTimeout(() => setWrongFlash(null), 600);
      }
      setSelectedLeft(null);
      setSelectedRight(null);
    },
    []
  );

  function handleLeft(id: string) {
    if (matched.has(id) || finished || roundComplete) return;
    if (selectedRight) {
      tryMatch(id, selectedRight);
      return;
    }
    setSelectedLeft(selectedLeft === id ? null : id);
  }

  function handleRight(id: string) {
    if (matched.has(id) || finished || roundComplete) return;
    if (selectedLeft) {
      tryMatch(selectedLeft, id);
      return;
    }
    setSelectedRight(selectedRight === id ? null : id);
  }

  function startNextRound() {
    setMatched(new Set());
    setSelectedLeft(null);
    setSelectedRight(null);
    setRoundComplete(false);
    setRoundIndex((i) => i + 1);
  }

  function restart() {
    setMatched(new Set());
    setSelectedLeft(null);
    setSelectedRight(null);
    setScore(0);
    setRoundComplete(false);
    setFinished(false);
    setRoundIndex(0);
    wrongRef.current = 0;
    setLevelCorrect(0);
  }

  if (allPairs.length < 4) {
    return (
      <GameShell>
        <GameHeader
          title={labels.matchTitle}
          backHref={levelMode ? undefined : `/lessons/${lessonId}`}
        />
        <GameEmptyState
          lessonId={lessonId}
          message="Энэ хичээлд тоглоом үүсгэхэд хангалттай үг алга. Дор хаяж 4 үг шаардлагатай."
        />
      </GameShell>
    );
  }

  const headerLevel = levelMode ? levelHeaderInfo(levelMode) : undefined;
  // Хичээлийн горимд × товч ЭНЭ хичээл рүү буцаана — өмнө нь үргэлж /games
  // хэсэг рүү шууд гардаг байсныг засав.
  const backHref = levelMode ? levelMode.mapHref : `/lessons/${lessonId}`;
  const shellClass = levelShellClass(levelMode);
  const overallProgress = !levelMode
    ? `${roundIndex * ROUND_SIZE + matchedCount}/${allPairs.length}${
        rounds.length > 1 ? ` · ${tr(locale, "Үе")} ${roundIndex + 1}/${rounds.length}` : ""
      }`
    : undefined;

  if (finished && levelMode) {
    return (
      <GameShell mainClassName={shellClass}>
        <GameHeader
          title={labels.matchTitle}
          backHref={backHref}
          level={headerLevel}
          score={score}
        />
        <LevelResultCard
          meta={levelMode.meta}
          correct={levelCorrect}
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
    const totalPairs = allPairs.length;
    const accuracy =
      totalPairs > 0
        ? Math.round((totalPairs / (totalPairs + wrongRef.current)) * 100)
        : 100;
    return (
      <GameShell>
        <GameHeader title={labels.matchTitle} backHref={backHref} score={score} />
        <GameResultCard
          score={score}
          correct={totalPairs}
          total={totalPairs}
          accuracy={accuracy}
          xpGained={score}
          lessonId={lessonId}
          onPlayAgain={restart}
        />
      </GameShell>
    );
  }

  if (roundComplete) {
    const nextRound = rounds[roundIndex + 1] ?? [];
    return (
      <GameShell>
        <GameHeader
          title={labels.matchTitle}
          backHref={backHref}
          progress={overallProgress}
          score={score}
        />
        <GameCard className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--app-primary-light)] text-2xl">
            🎉
          </div>
          <p className="text-sm font-bold text-[var(--app-primary-dark)]">
            {tr(locale, "Үе")} {roundIndex + 1} {tr(locale, "дуусла!")}
          </p>
          <p className="mt-1 text-xs text-[var(--app-muted)]">
            {roundIndex * ROUND_SIZE + matchedCount}/{allPairs.length}{" "}
            {tr(locale, "үг давлаа")}
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <button
              type="button"
              onClick={startNextRound}
              className="app-btn-game w-full"
            >
              {tr(locale, "Дараагийн")} {nextRound.length} {tr(locale, "үг →")}
            </button>
          </div>
        </GameCard>
      </GameShell>
    );
  }

  return (
    <GameShell mainClassName={shellClass}>
      <GameHeader
        title={labels.matchTitle}
        backHref={backHref}
        level={headerLevel}
        progress={levelMode ? `${matchedCount}/${total}` : overallProgress}
        score={score}
      />
      <div className="grid grid-cols-2 gap-3">
        <GameCard className="flex min-h-[340px] flex-col gap-2 !p-2">
          {leftItems.map((item) => {
            const isMatched = matched.has(item.id);
            const isSelected = selectedLeft === item.id;
            const isWrong = wrongFlash?.startsWith(item.id);
            return (
              <button
                key={`l-${item.id}`}
                type="button"
                disabled={isMatched}
                onClick={() => handleLeft(item.id)}
                className={`min-h-[56px] rounded-xl border px-2 py-2.5 text-left text-sm font-medium transition-colors ${
                  isMatched
                    ? "border-emerald-300 bg-emerald-50 text-emerald-800 opacity-70"
                    : isWrong
                      ? "border-red-400 bg-red-50 animate-pulse"
                      : isSelected
                        ? "border-[var(--app-purple)] bg-[var(--app-purple-light)] ring-2 ring-purple-200"
                        : "border-[var(--app-border)] bg-white shadow-sm active:bg-slate-50"
                }`}
                translate="no"
              >
                {item.label}
              </button>
            );
          })}
        </GameCard>
        <GameCard className="flex min-h-[340px] flex-col gap-2 !p-2">
          {rightItems.map((item) => {
            const isMatched = matched.has(item.id);
            const isSelected = selectedRight === item.id;
            const isWrong = wrongFlash?.endsWith(item.id);
            return (
              <div
                key={`r-${item.id}`}
                className={`flex min-h-[56px] items-center gap-1 rounded-xl border px-2 py-2.5 transition-colors ${
                  isMatched
                    ? "border-emerald-300 bg-emerald-50 text-emerald-800 opacity-70"
                    : isWrong
                      ? "border-red-400 bg-red-50 animate-pulse"
                      : isSelected
                        ? "border-[var(--app-purple)] bg-[var(--app-purple-light)] ring-2 ring-purple-200"
                        : "border-[var(--app-border)] bg-white shadow-sm"
                }`}
              >
                <button
                  type="button"
                  disabled={isMatched}
                  onClick={() => handleRight(item.id)}
                  className="min-w-0 flex-1 text-left active:bg-slate-50 disabled:cursor-default"
                >
                  <span className="block text-base font-bold">{item.label}</span>
                  <span className="text-xs text-emerald-700">{item.sub}</span>
                </button>
                <SpeakerButton
                  text={item.label}
                  lang={ttsLang}
                  courseId={courseId}
                  size="sm"
                />
              </div>
            );
          })}
        </GameCard>
      </div>
      <p className="mt-3 text-center text-xs text-[var(--app-muted)]">
        {tr(locale, "Зүүн ба баруун талаас нэг нэгийг сонгоно уу")}
      </p>
    </GameShell>
  );
}
