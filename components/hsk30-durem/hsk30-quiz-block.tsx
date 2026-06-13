"use client";

import { useState } from "react";
import { useQuestionTimer } from "@/lib/analytics/attempt-metrics";
import { recordHsk30Attempt } from "@/lib/analytics/record-question-attempt";
import type { Hsk30QuizItem } from "@/types/hsk30-durem";

type Props = {
  item: Hsk30QuizItem;
  levelId: string;
  label?: string;
};

export function Hsk30QuizBlock({ item, levelId, label }: Props) {
  const [pickedIndex, setPickedIndex] = useState<number | null>(null);
  const answered = pickedIndex !== null;
  const correct = pickedIndex === item.a;
  const getElapsed = useQuestionTimer(`hsk30:${levelId}:${item.id}`);

  function handlePick(index: number) {
    if (answered) return;
    setPickedIndex(index);
    const selected = item.opts[index] ?? "";
    const correctAnswer = item.opts[item.a] ?? "";
    recordHsk30Attempt({
      levelId,
      questionId: item.id,
      questionType: item.type === "judge" ? "judge" : "choice",
      isCorrect: index === item.a,
      selectedAnswer: selected,
      correctAnswer,
      timeSpentMs: getElapsed(),
    });
  }

  const explanation = correct
    ? item.ok
    : item.no ?? item.ok;

  return (
    <div className="bs-gr2-check">
      {label ? <p className="bs-gr2-section-label">{label}</p> : null}
      <p className="bs-gr2-check-q">{item.q}</p>
      <div
        className={
          item.type === "judge" ? "bs-gr2-judge-row" : "bs-gr2-quiz-opts"
        }
      >
        {item.opts.map((opt, index) => {
          const isPicked = pickedIndex === index;
          const isAnswer = index === item.a;
          let cls =
            item.type === "judge" ? "bs-gr2-judge-btn" : "bs-gr2-quiz-opt";
          if (answered && isPicked && correct) cls += " bs-gr2-judge-btn--ok bs-gr2-quiz-opt--ok";
          else if (answered && isPicked && !correct)
            cls += " bs-gr2-judge-btn--bad bs-gr2-quiz-opt--bad";
          else if (answered && isAnswer && !correct)
            cls += " bs-gr2-quiz-opt--reveal";
          return (
            <button
              key={`${opt}-${index}`}
              type="button"
              className={cls}
              disabled={answered}
              onClick={() => handlePick(index)}
            >
              {answered && isPicked ? (
                <span className="bs-gr2-quiz-mark" aria-hidden>
                  {correct ? "✓" : "✗"}
                </span>
              ) : null}
              {answered && !isPicked && isAnswer && !correct ? (
                <span
                  className="bs-gr2-quiz-mark bs-gr2-quiz-mark--ok"
                  aria-hidden
                >
                  ✓
                </span>
              ) : null}
              {opt}
            </button>
          );
        })}
      </div>
      {answered && explanation ? (
        <p
          className={`bs-gr2-exercise-expl ${correct ? "" : "bs-gr2-exercise-expl--wrong"}`}
        >
          {explanation}
        </p>
      ) : null}
    </div>
  );
}
