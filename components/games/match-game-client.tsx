"use client";

import { useCallback, useMemo, useState } from "react";
import { GameCard } from "@/components/games/game-card";
import { GameEmptyState } from "@/components/games/game-empty-state";
import { GameHeader } from "@/components/games/game-header";
import { GameResultCard } from "@/components/games/game-result-card";
import { GameShell } from "@/components/games/game-shell";
import { buildMatchGameItems, shuffleArray } from "@/lib/games/game-data";
import { saveGameResult } from "@/lib/games/game-progress";
import type { GameVocabItem, MatchPair } from "@/lib/games/game-types";

type Props = {
  lessonId: string;
  vocabulary: GameVocabItem[];
};

export function MatchGameClient({ lessonId, vocabulary }: Props) {
  const pairs = useMemo(() => buildMatchGameItems(vocabulary), [vocabulary]);
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
        <GameHeader title="Холбох" />
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
        <GameHeader title="Холбох" score={score} />
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
        title="Холбох"
        progress={`${matchedCount}/${total}`}
        score={score}
      />
      <div className="grid grid-cols-2 gap-2">
        <GameCard className="flex min-h-[320px] flex-col gap-2 !p-2">
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
                className={`min-h-[52px] rounded-xl border px-2 py-2 text-left text-sm font-medium transition-colors ${
                  isMatched
                    ? "border-emerald-300 bg-emerald-50 text-emerald-800 opacity-60"
                    : isWrong
                      ? "border-red-400 bg-red-50 animate-pulse"
                      : isSelected
                        ? "border-purple-400 bg-purple-50 ring-2 ring-purple-200"
                        : "border-slate-200 bg-white active:bg-slate-50"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </GameCard>
        <GameCard className="flex min-h-[320px] flex-col gap-2 !p-2">
          {rightItems.map((item) => {
            const isMatched = matched.has(item.id);
            const isSelected = selectedRight === item.id;
            const isWrong = wrongFlash?.endsWith(item.id);
            return (
              <button
                key={`r-${item.id}`}
                type="button"
                disabled={isMatched}
                onClick={() => handleRight(item.id)}
                className={`min-h-[52px] rounded-xl border px-2 py-2 text-left transition-colors ${
                  isMatched
                    ? "border-emerald-300 bg-emerald-50 text-emerald-800 opacity-60"
                    : isWrong
                      ? "border-red-400 bg-red-50 animate-pulse"
                      : isSelected
                        ? "border-purple-400 bg-purple-50 ring-2 ring-purple-200"
                        : "border-slate-200 bg-white active:bg-slate-50"
                }`}
              >
                <span className="block text-base font-bold">{item.label}</span>
                <span className="text-xs text-emerald-700">{item.sub}</span>
              </button>
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
