"use client";

import { useState } from "react";
import { useQuestionTimer } from "@/lib/analytics/attempt-metrics";
import { recordHsk30Attempt } from "@/lib/analytics/record-question-attempt";
import { highlightZh } from "@/lib/text/highlight-zh";
import type { Hsk30QuizItem } from "@/types/hsk30-durem";

type Props = {
  item: Hsk30QuizItem;
  levelId: string;
};

export function Hsk30QuizBlock({ item, levelId }: Props) {
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

  const explanation = correct ? item.ok : item.no ?? item.ok;
  const qtag = item.type === "judge" ? "Зөв / Буруу" : "Сонголт";

  return (
    <div className="ex">
      <div className="qtag">{qtag}</div>
      <div className="q">{highlightZh(item.q)}</div>
      <div className="opts">
        {item.opts.map((opt, index) => {
          const isPicked = pickedIndex === index;
          const isAnswer = index === item.a;
          let cls = "opt";
          if (answered && isAnswer) cls += " correct";
          else if (answered && isPicked && !correct) cls += " wrong";

          let mark = "";
          if (answered && isAnswer) mark = "✓";
          else if (answered && isPicked && !correct) mark = "✗";

          const isZh = /[一-鿿]/.test(opt);

          return (
            <button
              key={`${opt}-${index}`}
              type="button"
              className={cls}
              disabled={answered}
              onClick={() => handlePick(index)}
            >
              <span className={isZh ? "zh" : undefined}>{opt}</span>
              {mark ? <span className="mk">{mark}</span> : null}
            </button>
          );
        })}
      </div>
      {answered && explanation ? (
        <div className={`fb ${correct ? "ok" : "no"}`}>{explanation}</div>
      ) : null}
    </div>
  );
}
