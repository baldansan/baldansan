"use client";

import { SKILL_LABELS_MN, type MockTestQuestionRow } from "@/lib/mock-test/types";
import type { WritingSelfGrade } from "@/lib/mock-test/hsk-scoring";

type Props = {
  questions: MockTestQuestionRow[];
  answers: Record<string, string>;
  grades: Record<number, WritingSelfGrade>;
  onGrade: (qNo: number, grade: WritingSelfGrade) => void;
  onComplete: () => void;
  onSkip: () => void;
};

const GRADE_OPTIONS: { value: WritingSelfGrade; label: string }[] = [
  { value: "none", label: "0" },
  { value: "half", label: "Тал" },
  { value: "full", label: "Бүтэн" },
];

export function MockTestWritingGrade({
  questions,
  answers,
  grades,
  onGrade,
  onComplete,
  onSkip,
}: Props) {
  return (
    <div className="bs-mt-writing-grade px-4">
      <h2 className="bs-mt-title">Бичих хэсгээ үнэл</h2>
      <p className="bs-mt-sub">
        Шударга өөрийн үнэлгээ — жишиг хариулттай харьцуулж 0, тал, эсвэл бүтэн
        оноо сонгоно.
      </p>

      <div className="bs-mt-questions mt-4">
        {questions.map((question) => {
          const answer = answers[String(question.q_no)] ?? "";
          const grade = grades[question.q_no] ?? "none";
          return (
            <div key={question.id} className="bs-mt-question">
              <p className="bs-mt-q-label">
                Асуулт {question.q_no} · {SKILL_LABELS_MN.writing}
              </p>
              {question.stem ? (
                <p className="bs-mt-q-text hanzi">{question.stem}</p>
              ) : null}
              <p className="bs-mt-writing-label">Таны хариулт</p>
              <p className="bs-mt-writing-answer hanzi">
                {answer.trim() || "— хоосон —"}
              </p>
              {question.correct_answer ? (
                <>
                  <p className="bs-mt-writing-label">Жишиг хариулт</p>
                  <p className="bs-mt-writing-sample hanzi">
                    {question.correct_answer}
                  </p>
                </>
              ) : null}
              <div className="bs-mt-grade-row">
                {GRADE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`bs-mt-grade-btn ${grade === option.value ? "bs-mt-grade-btn--on" : ""}`}
                    onClick={() => onGrade(question.q_no, option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <button type="button" className="bs-mock-primary-btn mt-6 w-full" onClick={onComplete}>
        Үнэлгээг хадгалах →
      </button>
      <button type="button" className="bs-mt-link-btn mt-3 w-full" onClick={onSkip}>
        Алгасах (Бичих «үнэлээгүй»)
      </button>
    </div>
  );
}
