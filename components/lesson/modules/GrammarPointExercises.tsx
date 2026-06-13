"use client";

import { useState } from "react";
import { useQuestionTimer } from "@/lib/analytics/attempt-metrics";
import {
  mapGrammarExerciseType,
  recordQuestionAttempt,
} from "@/lib/analytics/record-question-attempt";
import { QuestionFeedbackButtons } from "@/components/feedback/question-feedback-buttons";
import { grammarExerciseAnswerLabel, isGrammarExerciseCorrect } from "@/lib/lesson/grammar-exercise";
import { MnGrammarTermText } from "@/components/lesson/mn-grammar-term-text";
import type { HskPackageGrammarExercise } from "@/types/hsk-lesson-package";

type Props = {
  lessonId: string;
  grammarPointIndex: number;
  exercises: HskPackageGrammarExercise[];
  /** Бүх дүрэм дууссан эсэх — сүүлийн дасгалын товчны шошгыг тодорхойлно. */
  isLastPoint?: boolean;
  onComplete: () => void;
};

export function GrammarPointExercises({
  lessonId,
  grammarPointIndex,
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
  const getElapsed = useQuestionTimer(`gr:${grammarPointIndex}:${ei}`);

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
      stage: "grammar_exercise",
      questionId: `gr:${grammarPointIndex}:${ei}`,
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

  const continueLabel =
    ei < total - 1
      ? "Дараагийн дасгал →"
      : isLastPoint
        ? "Үргэлжлүүлэх →"
        : "Дараагийн дүрэм →";

  return (
    <div className="bs-gr-exercise-block">
      <div className="bs-label" style={{ margin: 0 }}>
        <span className="bs-dot" />
        Дасгал ({ei + 1}/{total})
      </div>

      <p className="bs-gr-exercise-q">
        <MnGrammarTermText text={ex.question} />
      </p>

      {ex.type === "choice" && ex.options ? (
        <div className="bs-tov-check-opts">
          {ex.options.map((opt) => {
            const isPicked = picked === opt;
            const isAnswer = opt === answerLabel;
            let cls = "bs-tov-check-opt";
            if (answered && isPicked && correct) cls += " bs-tov-check-opt--ok";
            else if (answered && isPicked && !correct) cls += " bs-tov-check-opt--bad";
            else if (answered && isAnswer && !correct) cls += " bs-tov-check-opt--reveal";
            return (
              <button
                key={opt}
                type="button"
                className={cls}
                disabled={answered}
                onClick={() => submitChoice(opt)}
              >
                <MnGrammarTermText text={opt} nested />
              </button>
            );
          })}
        </div>
      ) : null}

      {ex.type === "judge" ? (
        <div className="bs-ex-tf">
          {[
            { v: true, label: "✓ Үнэн" },
            { v: false, label: "✗ Худал" },
          ].map(({ v, label }) => {
            let cls = "bs-ex-opt";
            if (answered) {
              const ansBool = answerLabel === "Үнэн";
              if (v === ansBool) cls += " bs-correct";
              else if (v === tf) cls += " bs-wrong";
            }
            return (
              <button
                key={String(v)}
                type="button"
                className={cls}
                disabled={answered}
                onClick={() => submitJudge(v)}
              >
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
        <div className="bs-gr-exercise-feedback">
          {correct ? (
            <>
              <p className="bs-tov-check-feedback bs-tov-check-feedback--ok">Зөв!</p>
              {ex.explanation_correct_mn ? (
                <p className="bs-gr-exercise-expl">
                  <MnGrammarTermText text={ex.explanation_correct_mn} />
                </p>
              ) : null}
            </>
          ) : (
            <>
              <p className="bs-tov-check-feedback bs-tov-check-feedback--bad">
                Буруу. Зөв хариулт:{" "}
                <MnGrammarTermText text={answerLabel} nested />
              </p>
              {ex.explanation_wrong_mn ? (
                <p className="bs-gr-exercise-expl bs-gr-exercise-expl--wrong">
                  <MnGrammarTermText text={ex.explanation_wrong_mn} />
                </p>
              ) : null}
              {ex.explanation_correct_mn ? (
                <p className="bs-gr-exercise-expl">
                  <MnGrammarTermText text={ex.explanation_correct_mn} />
                </p>
              ) : null}
            </>
          )}
          <QuestionFeedbackButtons
            lessonId={lessonId}
            questionId={`gr:${grammarPointIndex}:${ei}`}
          />
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
