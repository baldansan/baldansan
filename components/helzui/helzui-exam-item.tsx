"use client";

import { useEffect, useMemo, useState } from "react";
import { HelzuiAnswerBlocks } from "@/components/helzui/helzui-answer-blocks";
import { HelzuiRichHtml } from "@/components/helzui/helzui-rich-html";
import { recordHelzuiSelfAssessment } from "@/lib/analytics/record-question-attempt";
import type { ExamItem, HelzuiRoleColors } from "@/types/helzui-course";

type Props = {
  item: ExamItem;
  index: number;
  variant: "real" | "practice";
  moduleId: string;
  roleColors: HelzuiRoleColors;
};

function shuffleWords(words: string[]): string[] {
  const next = [...words];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j]!, next[i]!];
  }
  return next;
}

export function HelzuiExamItem({
  item,
  index,
  variant,
  moduleId,
  roleColors,
}: Props) {
  const [open, setOpen] = useState(false);
  const [selfRating, setSelfRating] = useState<"correct" | "wrong" | null>(null);
  const tokens = useMemo(() => item.words, [item.words]);
  const [pool, setPool] = useState(tokens);

  useEffect(() => {
    setPool(shuffleWords(tokens));
  }, [tokens]);

  const revealLabel = variant === "practice" ? "Шалгах" : "Хариу харах";

  function handleSelfRating(isCorrect: boolean) {
    if (selfRating !== null) return;
    setSelfRating(isCorrect ? "correct" : "wrong");
    recordHelzuiSelfAssessment({
      moduleId,
      questionId: item.id,
      isCorrect,
    });
  }

  return (
    <article className={`hz-exam ${variant === "practice" ? "hz-exam--mini" : ""} ${open ? "hz-exam--open" : ""}`}>
      {item.src ? (
        <p className="hz-exam-tag">
          {item.src}
        </p>
      ) : variant === "practice" ? (
        <p className="hz-exam-qn">{index + 1}</p>
      ) : null}

      <div className="hz-scramble" aria-label="Холилдсон үгс">
        {!open
          ? pool.map((word, wi) => (
              <span key={`${word}-${wi}`} className="hz-word zh">
                {word}
              </span>
            ))
          : null}
      </div>

      {!open ? (
        <button
          type="button"
          className="hz-reveal-btn"
          onClick={() => setOpen(true)}
        >
          {revealLabel}
        </button>
      ) : (
        <div className="hz-answer">
          <HelzuiAnswerBlocks blocks={item.answer} roleColors={roleColors} />
          <div className="hz-analysis">
            <HelzuiRichHtml html={item.analysis} as="p" />
          </div>
          <div className="hz-self-rating" role="group" aria-label="Өөрийн үнэлгээ">
            <button
              type="button"
              className={`hz-self-btn hz-self-btn--ok ${selfRating === "correct" ? "hz-self-btn--selected" : ""}`}
              disabled={selfRating !== null}
              onClick={() => handleSelfRating(true)}
            >
              Зөв таасан ✓
            </button>
            <button
              type="button"
              className={`hz-self-btn hz-self-btn--bad ${selfRating === "wrong" ? "hz-self-btn--selected" : ""}`}
              disabled={selfRating !== null}
              onClick={() => handleSelfRating(false)}
            >
              Андуурсан ✗
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
