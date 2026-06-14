"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuestionTimer } from "@/lib/analytics/attempt-metrics";
import { recordQuestionAttempt } from "@/lib/analytics/record-question-attempt";
import { QuestionFeedbackButtons } from "@/components/feedback/question-feedback-buttons";
import {
  buildSentenceFromTokenIndices,
  gradeMockSentenceOrder,
  seqIndicesFromStoredAnswer,
  sentenceOrderInstruction,
} from "@/lib/mock-test/sentence-order";
import type { MockTestQuestionRow } from "@/lib/mock-test/types";

type Props = {
  question: MockTestQuestionRow;
  tokens: string[];
  value: string;
  onAnswer: (value: string) => void;
  showResults?: boolean;
  resultCorrect?: boolean | null;
  onAdvanceNext?: () => void;
  analyticsLessonId?: string;
};

export function MockTestSentenceOrder({
  question,
  tokens,
  value,
  onAnswer,
  showResults = false,
  resultCorrect = null,
  onAdvanceNext,
  analyticsLessonId,
}: Props) {
  const instruction = sentenceOrderInstruction(question.stem);
  const [seq, setSeq] = useState<number[]>(() =>
    value ? seqIndicesFromStoredAnswer(tokens, value) : []
  );
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState<boolean | null>(null);

  const built = useMemo(
    () => buildSentenceFromTokenIndices(tokens, seq),
    [tokens, seq]
  );
  const allPlaced = seq.length === tokens.length;
  const locked = showResults || checked;
  const getElapsed = useQuestionTimer(`mock:so:${question.id}`);

  useEffect(() => {
    if (!value) {
      setSeq([]);
      setChecked(false);
      setCorrect(null);
      return;
    }
    const restored = seqIndicesFromStoredAnswer(tokens, value);
    if (restored.length === tokens.length) {
      setSeq(restored);
    }
  }, [question.id, tokens, value]);

  function toggleToken(index: number) {
    if (locked) return;
    setChecked(false);
    setCorrect(null);
    setSeq((prev) => {
      const pos = prev.indexOf(index);
      const next =
        pos >= 0 ? prev.filter((i) => i !== index) : [...prev, index];
      if (next.length === tokens.length) {
        onAnswer(buildSentenceFromTokenIndices(tokens, next));
      }
      return next;
    });
  }

  function resetOrder() {
    if (locked) return;
    setSeq([]);
    setChecked(false);
    setCorrect(null);
    onAnswer("");
  }

  function checkAnswer() {
    if (!allPlaced || locked) return;
    const builtAnswer = buildSentenceFromTokenIndices(tokens, seq);
    onAnswer(builtAnswer);
    const ok = gradeMockSentenceOrder(question, builtAnswer);
    setCorrect(ok);
    setChecked(true);
    if (analyticsLessonId) {
      recordQuestionAttempt({
        lessonId: analyticsLessonId,
        stage: "mock_exam",
        questionId: `mock:${question.id}`,
        questionType: "order",
        isCorrect: ok,
        selectedAnswer: builtAnswer,
        correctAnswer: question.correct_answer,
        timeSpentMs: getElapsed(),
      });
    }
  }

  const feedbackCorrect =
    showResults && resultCorrect != null ? resultCorrect : correct;

  return (
    <div className="bs-mt-sentence-order">
      <p className="bs-mt-q-text hanzi">{instruction}</p>

      <div className="bs-mt-sentence-build">
        {seq.length === 0 ? (
          <span className="bs-mt-sentence-ph">Доороос үг дарж энд нэмнэ…</span>
        ) : (
          seq.map((index, pos) => (
            <button
              key={`${index}-${pos}`}
              type="button"
              className="bs-mt-chip hanzi bs-mt-chip--built"
              disabled={locked}
              onClick={() => toggleToken(index)}
            >
              {tokens[index]}
            </button>
          ))
        )}
      </div>

      <div className="bs-mt-chip-row bs-mt-sentence-pool">
        {tokens.map((token, index) =>
          seq.includes(index) ? null : (
            <button
              key={index}
              type="button"
              className="bs-mt-chip hanzi"
              disabled={locked}
              onClick={() => toggleToken(index)}
            >
              {token}
            </button>
          )
        )}
      </div>

      {!locked ? (
        <div className="bs-mt-sentence-actions">
          <button
            type="button"
            className="bs-mt-sentence-check"
            disabled={!allPlaced}
            onClick={checkAnswer}
          >
            Шалгах
          </button>
          {seq.length > 0 ? (
            <button type="button" className="bs-mt-link-btn" onClick={resetOrder}>
              Дахин эхлэх
            </button>
          ) : null}
        </div>
      ) : null}

      {locked && feedbackCorrect != null ? (
        <div
          className={`bs-mt-sentence-feedback ${feedbackCorrect ? "bs-mt-sentence-feedback--ok" : "bs-mt-sentence-feedback--bad"}`}
        >
          {feedbackCorrect ? (
            <p>✓ Зөв!</p>
          ) : (
            <p>
              ✗ Буруу. Зөв хариулт:{" "}
              <span className="hanzi">{question.correct_answer ?? "—"}</span>
            </p>
          )}
          {question.explanation_mn ? (
            <p className="bs-mt-explain">{question.explanation_mn}</p>
          ) : null}
          {onAdvanceNext && !showResults ? (
            <button
              type="button"
              className="bs-mock-primary-btn bs-mt-sentence-next"
              onClick={onAdvanceNext}
            >
              Дараагийн асуулт →
            </button>
          ) : null}
          {analyticsLessonId && !showResults ? (
            <QuestionFeedbackButtons
              lessonId={analyticsLessonId}
              questionId={`mock:${question.id}`}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
