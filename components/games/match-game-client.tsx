"use client";

import { useCallback, useMemo, useState } from "react";
import { GameCard } from "@/components/games/game-card";
import { GameEmptyState } from "@/components/games/game-empty-state";
import { GameHeader } from "@/components/games/game-header";
import { GameResultCard } from "@/components/games/game-result-card";
import { GameShell } from "@/components/games/game-shell";
import { buildMatchGameItems, shuffleArray } from "@/lib/games/game-data";
import { resolveGameLabels, type GameLabels } from "@/lib/games/game-lesson-meta";
import { saveGameResult } from "@/lib/games/game-progress";
import { SpeakerButton } from "@/components/tts/speaker-button";
import { resolveTtsLang } from "@/lib/tts/infer-lang";
import type { GameVocabItem, MatchPair } from "@/lib/games/game-types";
import { useActivityTracker } from "@/lib/analytics/activity-tracker";

type Props = {
  lessonId: string;
  courseId?: string;
  vocabulary: GameVocabItem[];
  isKorean?: boolean;
  isPrelesson?: boolean;
  labels?: GameLabels;
};

export function MatchGameClient({
  lessonId,
  courseId,
  vocabulary,
  isKorean = false,
  isPrelesson = false,
  labels: labelsProp,
}: Props) {
  useActivityTracker("game", "match");
  const labels = labelsProp ?? resolveGameLabels(isKorean, isPrelesson);
  const gameContext = { isPrelesson };
  const pairs = useMemo(
    () => buildMatchGameItems(vocabulary, 6, gameContext),
    [vocabulary, isPrelesson]
  );
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
  const [finished, setFinished] = useState(false);

  const total = pairs.length;
  const matchedCount = matched.size;
  const ttsLang = resolveTtsLang({ courseId });

  const tryMatch = useCallback(
    (leftId: string, rightId: string) => {
      if (leftId === rightId) {
        setMatched((prev) => {
          const next = new Set(prev).add(leftId);
          const newCount = next.size;
          if (newCount >= total) {
            const finalScore = newCount * 10;
            saveGameResult({
              gameType: "match",
              lessonId,
              score: finalScore,
              correct: newCount,
              total,
              accuracy: Math.round((newCount / total) * 100),
              playedAt: new Date().toISOString(),
            });
            setScore(finalScore);
            setFinished(true);
          } else {
            setScore(newCount * 10);
          }
          return next;
        });
      } else {
        setWrongFlash(`${leftId}-${rightId}`);
        setTimeout(() => setWrongFlash(null), 600);
      }
      setSelectedLeft(null);
      setSelectedRight(null);
    },
    [lessonId, total]
  );

  function handleLeft(id: string) {
    if (matched.has(id) || finished) return;
    if (selectedRight) {
      tryMatch(id, selectedRight);
      return;
    }
    setSelectedLeft(selectedLeft === id ? null : id);
  }

  function handleRight(id: string) {
    if (matched.has(id) || finished) return;
    if (selectedLeft) {
      tryMatch(selectedLeft, id);
      return;
    }
    setSelectedRight(selectedRight === id ? null : id);
  }

  function restart() {
    setMatched(new Set());
    setSelectedLeft(null);
    setSelectedRight(null);
    setScore(0);
    setFinished(false);
  }

  if (pairs.length < 4) {
    return (
      <GameShell>
        <GameHeader title={labels.matchTitle} />
        <GameEmptyState
          lessonId={lessonId}
          message="Энэ хичээлд тоглоом үүсгэхэд хангалттай үг алга. Дор хаяж 4 үг шаардлагатай."
        />
      </GameShell>
    );
  }

  if (finished) {
    return (
      <GameShell>
        <GameHeader title={labels.matchTitle} score={score} />
        <GameResultCard
          score={score}
          correct={total}
          total={total}
          accuracy={100}
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
        title={labels.matchTitle}
        progress={`${matchedCount}/${total}`}
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
        Зүүн ба баруун талаас нэг нэгийг сонгоно уу
      </p>
    </GameShell>
  );
}
