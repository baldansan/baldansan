"use client";

import { useState } from "react";
import { useQuestionTimer } from "@/lib/analytics/attempt-metrics";
import {
  mapGrammarExerciseType,
  recordQuestionAttempt,
} from "@/lib/analytics/record-question-attempt";
import { QuestionFeedbackButtons } from "@/components/feedback/question-feedback-buttons";
import {
  grammarExerciseAnswerLabel,
  isGrammarExerciseCorrect,
} from "@/lib/lesson/grammar-exercise";
import { grammarExerciseQuestionId } from "@/lib/lesson/grammar-question-id";
import { MnGrammarTermText } from "@/components/lesson/mn-grammar-term-text";
import type { HskPackageGrammarExercise } from "@/types/hsk-lesson-package";

type Props = {
  lessonId: string;
  pointSlug: string;
  exercises: HskPackageGrammarExercise[];
  isLastPoint?: boolean;
  onComplete: () => void;
};

export function GrammarPointExercises({
  lessonId,
  pointSlug,
  exercises,
  isLastPoint = false,
  onComplete,
}: Props) {
  const [ei, setEi] = useState(0);
  const [fillText, setFillText] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const [tf, setTf] = useState<boolean | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correct, setCorrect] = useState(false);

  const ex = exercises[ei];
  const total = exercises.length;
  const questionId = grammarExerciseQuestionId(pointSlug, ei);
  const getElapsed = useQuestionTimer(
    `grammar-ex:${lessonId}:${questionId}`
  );

  if (!ex) {
    onComplete();
    return null;
  }

  function resetAnswerState() {
    setFillText("");
    setPicked(null);
    setTf(null);
    setAnswered(false);
    setCorrect(false);
  }

  function logAttempt(selected: string, ok: boolean) {
    recordQuestionAttempt({
      lessonId,
      stage: "grammar",
      questionId,
      questionType: mapGrammarExerciseType(ex.type),
      isCorrect: ok,
      selectedAnswer: selected,
      correctAnswer: answerLabel,
      timeSpentMs: getElapsed(),
    });
  }

  function submitChoice(opt: string) {
    if (answered) return;
    setPicked(opt);
    const ok = isGrammarExerciseCorrect(ex, opt);
    setCorrect(ok);
    setAnswered(true);
    logAttempt(opt, ok);
  }

  function submitJudge(value: boolean) {
    if (answered) return;
    setTf(value);
    const ok = isGrammarExerciseCorrect(ex, value);
    setCorrect(ok);
    setAnswered(true);
    logAttempt(value ? "Үнэн" : "Худал", ok);
  }

  function submitFill() {
    if (answered || !fillText.trim()) return;
    const ok = isGrammarExerciseCorrect(ex, fillText);
    setCorrect(ok);
    setAnswered(true);
    logAttempt(fillText.trim(), ok);
  }

  function continueAfterFeedback() {
    if (ei < total - 1) {
      setEi(ei + 1);
      resetAnswerState();
      return;
    }
    onComplete();
  }

  const answerLabel = grammarExerciseAnswerLabel(ex);
  const explanation = correct
    ? ex.explanation_correct_mn
    : ex.explanation_wrong_mn || ex.explanation_correct_mn;

  const continueLabel =
    ei < total - 1
      ? "Дараагийн дасгал →"
      : isLastPoint
        ? "Үргэлжлүүлэх →"
        : "Дараагийн дүрэм →";

  return (
    <div className="bs-gr2-exercises">
      <p className="bs-gr2-section-label">
        Дасгал ({ei + 1}/{total})
      </p>

      <p className="bs-gr2-exercise-q">
        <MnGrammarTermText text={ex.question} />
      </p>

      {ex.type === "choice" && ex.options ? (
        <div className="bs-gr2-quiz-opts">
          {ex.options.map((opt) => {
            const isPicked = picked === opt;
            const isAnswer = opt === answerLabel;
            let cls = "bs-gr2-quiz-opt";
            if (answered && isPicked && correct) cls += " bs-gr2-quiz-opt--ok";
            else if (answered && isPicked && !correct) cls += " bs-gr2-quiz-opt--bad";
            else if (answered && isAnswer && !correct) cls += " bs-gr2-quiz-opt--reveal";
            return (
              <button
                key={opt}
                type="button"
                className={cls}
                disabled={answered}
                onClick={() => submitChoice(opt)}
              >
                {answered && isPicked ? (
                  <span className="bs-gr2-quiz-mark" aria-hidden>
                    {correct ? "✓" : "✗"}
                  </span>
                ) : null}
                {answered && !isPicked && isAnswer && !correct ? (
                  <span className="bs-gr2-quiz-mark bs-gr2-quiz-mark--ok" aria-hidden>
                    ✓
                  </span>
                ) : null}
                <MnGrammarTermText text={opt} nested />
              </button>
            );
          })}
        </div>
      ) : null}

      {ex.type === "judge" ? (
        <div className="bs-gr2-judge-row">
          {[
            { v: true, label: "Үнэн" },
            { v: false, label: "Худал" },
          ].map(({ v, label }) => {
            let cls = "bs-gr2-judge-btn";
            if (answered) {
              const ansBool = answerLabel === "Үнэн";
              if (v === ansBool) cls += " bs-gr2-judge-btn--ok";
              else if (v === tf) cls += " bs-gr2-judge-btn--bad";
            }
            return (
              <button
                key={String(v)}
                type="button"
                className={cls}
                disabled={answered}
                onClick={() => submitJudge(v)}
              >
                {answered && v === tf ? (
                  <span className="bs-gr2-quiz-mark" aria-hidden>
                    {correct ? "✓" : "✗"}
                  </span>
                ) : null}
                {answered && v !== tf && answerLabel === (v ? "Үнэн" : "Худал") ? (
                  <span className="bs-gr2-quiz-mark bs-gr2-quiz-mark--ok" aria-hidden>
                    ✓
                  </span>
                ) : null}
                {label}
              </button>
            );
          })}
        </div>
      ) : null}

      {ex.type === "fill" ? (
        <div className="bs-gr-fill">
          <input
            type="text"
            className="bs-gr-fill-input"
            value={fillText}
            disabled={answered}
            placeholder="Хариулт бичнэ үү…"
            onChange={(e) => setFillText(e.target.value)}
          />
          {!answered ? (
            <button
              type="button"
              className="bs-ex-check"
              disabled={!fillText.trim()}
              onClick={submitFill}
            >
              Шалгах
            </button>
          ) : null}
        </div>
      ) : null}

      {answered ? (
        <div className="bs-gr2-exercise-feedback">
          {!correct && ex.type !== "judge" && ex.type !== "choice" ? (
            <p className="bs-gr2-quiz-feedback bs-gr2-quiz-feedback--bad">
              Буруу. Зөв хариулт: <MnGrammarTermText text={answerLabel} nested />
            </p>
          ) : null}
          {explanation ? (
            <p
              className={`bs-gr2-exercise-expl ${correct ? "" : "bs-gr2-exercise-expl--wrong"}`}
            >
              <MnGrammarTermText text={explanation} />
            </p>
          ) : null}
          <QuestionFeedbackButtons lessonId={lessonId} questionId={questionId} />
          <button
            type="button"
            className="bs-cta bs-path-visible-cta"
            onClick={continueAfterFeedback}
          >
            {continueLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}
