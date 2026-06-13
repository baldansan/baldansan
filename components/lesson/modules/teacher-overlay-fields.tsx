"use client";

import { useState } from "react";
import { useQuestionTimer } from "@/lib/analytics/attempt-metrics";
import {
  mapGrammarExerciseType,
  recordQuestionAttempt,
} from "@/lib/analytics/record-question-attempt";
import { grammarCheckQuestionId } from "@/lib/lesson/grammar-question-id";
import { resolveTeacherCheckAnswer } from "@/lib/lesson/teacher-check-quiz";
import { MnGrammarTermText } from "@/components/lesson/mn-grammar-term-text";
import type { HskTeacherOverlayFields } from "@/types/hsk-lesson-package";

type OverlayProps = HskTeacherOverlayFields;

export function TeacherStructureBlock({
  structure,
  variant = "default",
}: {
  structure: string;
  variant?: "default" | "formula";
}) {
  if (variant === "formula") {
    return (
      <div className="bs-gr2-formula">
        <span className="bs-gr2-formula-label">Бүтэц</span>
        <code className="bs-gr2-formula-code">{structure}</code>
      </div>
    );
  }

  return (
    <div className="bs-tov-structure">
      <span className="bs-tov-structure-label">Бүтэц:</span>
      <code className="bs-tov-structure-code">{structure}</code>
    </div>
  );
}

export function TeacherNotesBlock({
  notes,
  variant = "default",
}: {
  notes: string;
  variant?: "default" | "warn";
}) {
  if (variant === "warn") {
    return (
      <div className="bs-gr2-warn">
        <span className="bs-gr2-warn-icon" aria-hidden>
          ⚠️
        </span>
        <div>
          <p className="bs-gr2-warn-title">Анхаарах</p>
          <p className="bs-gr2-warn-body">
            <MnGrammarTermText text={notes} />
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bs-tov-notes">
      <span className="bs-tov-notes-icon" aria-hidden>
        💡
      </span>
      <div>
        <p className="bs-tov-notes-title">Багшийн зөвлөгөө</p>
        <p className="bs-tov-notes-body">
          <MnGrammarTermText text={notes} />
        </p>
      </div>
    </div>
  );
}

export function TeacherCommonMistakesSection({
  mistakes,
}: {
  mistakes: NonNullable<OverlayProps["common_mistakes"]>;
}) {
  return (
    <div className="bs-gr2-mistakes">
      <p className="bs-gr2-section-label">Түгээмэл алдаа</p>
      <div className="bs-gr2-mistakes-list">
        {mistakes.map((row, i) => (
          <div className="bs-gr2-mistake-row" key={`${row.wrong}-${row.right}-${i}`}>
            <div className="bs-gr2-mistake-card bs-gr2-mistake-card--bad">
              <span className="bs-gr2-mistake-tag">✗ Буруу</span>
              <span>{row.wrong}</span>
            </div>
            <div className="bs-gr2-mistake-card bs-gr2-mistake-card--ok">
              <span className="bs-gr2-mistake-tag">✓ Зөв</span>
              <span>{row.right}</span>
            </div>
            {row.why ? (
              <p className="bs-gr2-mistake-why">
                <strong>Яагаад: </strong>
                <MnGrammarTermText text={row.why} nested />
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export function TeacherCheckQuizSection({
  check,
  lessonId,
  pointSlug,
}: {
  check: NonNullable<OverlayProps["check"]>;
  lessonId?: string;
  pointSlug?: string;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const resolvedAnswer = resolveTeacherCheckAnswer(check);
  const answered = picked !== null;
  const correct = picked === resolvedAnswer;
  const questionId =
    lessonId && pointSlug ? grammarCheckQuestionId(pointSlug) : null;
  const getElapsed = useQuestionTimer(
    questionId ? `grammar-check:${lessonId}:${questionId}` : "grammar-check:off"
  );

  function handlePick(opt: string) {
    if (answered) return;
    setPicked(opt);
    if (!lessonId || !questionId) return;
    const ok = opt === resolvedAnswer;
    recordQuestionAttempt({
      lessonId,
      stage: "grammar",
      questionId,
      questionType: "choice",
      isCorrect: ok,
      selectedAnswer: opt,
      correctAnswer: resolvedAnswer,
      timeSpentMs: getElapsed(),
    });
  }

  return (
    <div className="bs-gr2-check">
      <p className="bs-gr2-section-label">Шалгаад үз</p>
      <p className="bs-gr2-check-q">
        <MnGrammarTermText text={check.question} />
      </p>
      <div className="bs-gr2-quiz-opts">
        {check.options.map((opt) => {
          const isPicked = picked === opt;
          const isAnswer = opt === resolvedAnswer;
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
              onClick={() => handlePick(opt)}
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
      {answered ? (
        <p
          className={`bs-gr2-quiz-feedback ${correct ? "bs-gr2-quiz-feedback--ok" : "bs-gr2-quiz-feedback--bad"}`}
        >
          {correct ? "Зөв таасан!" : `Буруу. Зөв хариулт: ${resolvedAnswer}`}
        </p>
      ) : null}
    </div>
  );
}

/** Shared overlay blocks below grammar / wordExplanation explanations. */
export function TeacherOverlayFields({
  structure,
  teacher_notes,
  common_mistakes,
  check,
  showStructure = false,
  lessonId,
  pointSlug,
}: OverlayProps & {
  showStructure?: boolean;
  lessonId?: string;
  pointSlug?: string;
}) {
  const hasMistakes = common_mistakes && common_mistakes.length > 0;
  const hasCheck = check && check.question && check.options.length > 0;

  if (
    !showStructure &&
    !structure &&
    !teacher_notes &&
    !hasMistakes &&
    !hasCheck
  ) {
    return null;
  }

  return (
    <div className="bs-tov">
      {showStructure && structure ? (
        <TeacherStructureBlock structure={structure} />
      ) : null}
      {teacher_notes ? <TeacherNotesBlock notes={teacher_notes} /> : null}
      {hasMistakes ? (
        <TeacherCommonMistakesSection mistakes={common_mistakes!} />
      ) : null}
      {hasCheck ? (
        <TeacherCheckQuizSection
          check={check!}
          lessonId={lessonId}
          pointSlug={pointSlug}
        />
      ) : null}
    </div>
  );
}
