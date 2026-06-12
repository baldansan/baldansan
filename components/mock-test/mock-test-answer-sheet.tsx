"use client";

import type { MockTestAnswers, MockTestQuestionRow } from "@/lib/mock-test/types";

type Props = {
  questions: MockTestQuestionRow[];
  answers: MockTestAnswers;
  activeQNo: number;
  onSelect: (qNo: number) => void;
};

export function MockTestAnswerSheet({
  questions,
  answers,
  activeQNo,
  onSelect,
}: Props) {
  if (!questions.length) return null;

  return (
    <div className="bs-mt-answer-sheet" aria-label="Хариултын хуудас">
      <p className="bs-mt-answer-sheet-label">Хариултын хуудас</p>
      <div className="bs-mt-answer-sheet-scroll">
        <div className="bs-mt-answer-sheet-grid">
          {questions.map((question) => {
            const answered = Boolean((answers[String(question.q_no)] ?? "").trim());
            const isActive = question.q_no === activeQNo;
            return (
              <button
                key={question.id}
                type="button"
                className={`bs-mt-answer-cell ${answered ? "bs-mt-answer-cell--done" : ""} ${isActive ? "bs-mt-answer-cell--active" : ""}`}
                onClick={() => onSelect(question.q_no)}
                aria-label={`Асуулт ${question.q_no}${answered ? ", хариулсан" : ""}`}
                aria-current={isActive ? "true" : undefined}
              >
                {question.q_no}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
