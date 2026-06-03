"use client";

import { useCallback, useMemo, useState } from "react";
import { ExerciseFeedback } from "@/components/motion/exercise-feedback";
import { MotionButton } from "@/components/motion/motion-pressable";
import type { ExerciseOnResult, LessonV2WritingItem } from "@/types/lesson-v2";
import { EXERCISE_PRIMARY, EXERCISE_PRIMARY_DARK, EXERCISE_PRIMARY_LIGHT } from "./exercise-theme";

type Props = {
  item: LessonV2WritingItem;
  instructionMn?: string;
  onResult?: ExerciseOnResult;
};

function normalizeSentence(value: string): string {
  return value.replace(/\s+/g, "").replace(/。$/u, "").trim();
}

function shuffleWords(words: string[]): string[] {
  const copy = [...words];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function MakeSentence({ item, instructionMn, onResult }: Props) {
  const expected = useMemo(() => normalizeSentence(item.answer), [item.answer]);

  const [shuffled] = useState(() => shuffleWords(item.words));
  const [selected, setSelected] = useState<string[]>([]);
  const [usedIndices, setUsedIndices] = useState<Set<number>>(() => new Set());
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState<"idle" | "correct" | "wrong">("idle");
  const [showAnswer, setShowAnswer] = useState(false);

  const built = selected.join("");

  const resetAttempt = useCallback(() => {
    setSelected([]);
    setUsedIndices(new Set());
    setFeedback("idle");
  }, []);

  const handleTileTap = (word: string, index: number) => {
    if (feedback === "correct" || showAnswer) return;
    if (usedIndices.has(index)) return;
    setSelected((prev) => [...prev, word]);
    setUsedIndices((prev) => new Set(prev).add(index));
    setFeedback("idle");
  };

  const handleRemoveLast = () => {
    if (feedback === "correct" || showAnswer) return;
    if (selected.length === 0) return;
    const lastIndex = [...usedIndices].pop();
    setSelected((prev) => prev.slice(0, -1));
    if (lastIndex !== undefined) {
      setUsedIndices((prev) => {
        const next = new Set(prev);
        next.delete(lastIndex);
        return next;
      });
    }
    setFeedback("idle");
  };

  const handleCheck = () => {
    if (built.length === 0 || feedback === "correct" || showAnswer) return;

    const isCorrect = normalizeSentence(built) === expected;
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);

    if (isCorrect) {
      setFeedback("correct");
      onResult?.({ correct: true });
      return;
    }

    setFeedback("wrong");

    if (nextAttempts >= 2) {
      setShowAnswer(true);
      onResult?.({ correct: false });
    }
  };

  return (
    <ExerciseFeedback
      status={feedback}
      className="mx-auto w-full max-w-[430px] rounded-2xl bg-white p-4 ring-1 ring-slate-200"
    >
      <div
        className="mb-1 text-xs font-semibold uppercase tracking-wide"
        style={{ color: EXERCISE_PRIMARY }}
      >
        连词成句
      </div>
      {instructionMn ? (
        <p className="mb-3 text-sm text-slate-600">{instructionMn}</p>
      ) : null}

      <div
        className={`mb-4 min-h-[3.5rem] rounded-xl border-2 border-dashed px-3 py-3 text-center text-lg leading-relaxed transition-colors ${
          feedback === "correct"
            ? "border-emerald-400 bg-emerald-50 text-emerald-900"
            : feedback === "wrong"
              ? "border-red-300 bg-red-50 text-red-900"
              : "border-slate-200 bg-slate-50 text-slate-800"
        }`}
        aria-live="polite"
      >
        {built || (
          <span className="text-sm text-slate-400">Үгсийг дараалан сонгоно уу</span>
        )}
        {built && !showAnswer && feedback !== "correct" ? "。" : null}
      </div>

      <div className="mb-4 flex flex-wrap justify-center gap-2">
        {shuffled.map((word, index) => {
          const isUsed = usedIndices.has(index);
          return (
            <MotionButton
              key={`${word}-${index}`}
              disabled={isUsed || feedback === "correct" || showAnswer}
              onClick={() => handleTileTap(word, index)}
              className="min-h-[44px] rounded-xl px-4 py-2 text-base font-medium transition-colors disabled:cursor-default disabled:opacity-35"
              style={
                isUsed
                  ? undefined
                  : {
                      backgroundColor: EXERCISE_PRIMARY_LIGHT,
                      color: EXERCISE_PRIMARY_DARK,
                      border: `1px solid ${EXERCISE_PRIMARY}40`,
                    }
              }
            >
              {word}
            </MotionButton>
          );
        })}
      </div>

      {feedback === "wrong" && !showAnswer ? (
        <p className="mb-3 text-center text-sm font-medium text-red-600">
          Буруу байна. Дахин оролдоно уу ({attempts}/2)
        </p>
      ) : null}

      {feedback === "correct" ? (
        <p className="mb-3 mt-8 text-center text-sm font-semibold text-emerald-600">
          ✓ Зөв!
        </p>
      ) : null}

      {showAnswer ? (
        <div className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-center text-sm text-amber-900 ring-1 ring-amber-200">
          Зөв хариулт: <span className="font-semibold">{item.answer}</span>
        </div>
      ) : null}

      <div className="flex gap-2">
        <MotionButton
          onClick={handleRemoveLast}
          disabled={selected.length === 0 || feedback === "correct" || showAnswer}
          className="min-h-[44px] flex-1 rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700 disabled:opacity-40"
        >
          Буцаах
        </MotionButton>
        {!showAnswer && feedback !== "correct" ? (
          <MotionButton
            onClick={handleCheck}
            disabled={built.length === 0}
            className="min-h-[44px] flex-1 rounded-full text-sm font-semibold text-white disabled:opacity-40"
            style={{ backgroundColor: EXERCISE_PRIMARY }}
          >
            Шалгах
          </MotionButton>
        ) : (
          <MotionButton
            onClick={() => {
              resetAttempt();
              setAttempts(0);
              setShowAnswer(false);
            }}
            className="min-h-[44px] flex-1 rounded-full text-sm font-semibold text-white"
            style={{ backgroundColor: EXERCISE_PRIMARY }}
          >
            Дахин
          </MotionButton>
        )}
      </div>
    </ExerciseFeedback>
  );
}
