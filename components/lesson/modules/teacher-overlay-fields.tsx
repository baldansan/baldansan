"use client";

import { useState } from "react";
import type { HskTeacherOverlayFields } from "@/types/hsk-lesson-package";
import "./teacher-overlay.css";

type OverlayProps = HskTeacherOverlayFields;

export function TeacherStructureBlock({ structure }: { structure: string }) {
  return (
    <div className="bs-tov-structure">
      <span className="bs-tov-structure-label">Бүтэц:</span>
      <code className="bs-tov-structure-code">{structure}</code>
    </div>
  );
}

export function TeacherNotesBlock({ notes }: { notes: string }) {
  return (
    <div className="bs-tov-notes">
      <span className="bs-tov-notes-icon" aria-hidden>💡</span>
      <div>
        <p className="bs-tov-notes-title">Багшийн зөвлөгөө</p>
        <p className="bs-tov-notes-body">{notes}</p>
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
    <div className="bs-tov-mistakes">
      <p className="bs-tov-section-title">Түгээмэл алдаа</p>
      <div className="bs-tov-mistakes-list">
        {mistakes.map((row, i) => (
          <div className="bs-tov-mistake" key={`${row.wrong}-${row.right}-${i}`}>
            <div className="bs-tov-mistake-wrong">
              <span className="bs-tov-mistake-tag">❌</span>
              <span>{row.wrong}</span>
            </div>
            <div className="bs-tov-mistake-right">
              <span className="bs-tov-mistake-tag">✓</span>
              <span>{row.right}</span>
            </div>
            {row.why ? <p className="bs-tov-mistake-why">{row.why}</p> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export function TeacherCheckQuizSection({
  check,
}: {
  check: NonNullable<OverlayProps["check"]>;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const answered = picked !== null;
  const correct = picked === check.answer;

  return (
    <div className="bs-tov-check">
      <p className="bs-tov-section-title">Шалгаад үз</p>
      <p className="bs-tov-check-q">{check.question}</p>
      <div className="bs-tov-check-opts">
        {check.options.map((opt) => {
          const isPicked = picked === opt;
          const isAnswer = opt === check.answer;
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
              onClick={() => setPicked(opt)}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {answered && !correct ? (
        <p className="bs-tov-check-feedback bs-tov-check-feedback--bad">
          Зөв хариулт: {check.answer}
        </p>
      ) : null}
      {answered && correct ? (
        <p className="bs-tov-check-feedback bs-tov-check-feedback--ok">Зөв!</p>
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
}: OverlayProps & { showStructure?: boolean }) {
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
      {showStructure && structure ? <TeacherStructureBlock structure={structure} /> : null}
      {teacher_notes ? <TeacherNotesBlock notes={teacher_notes} /> : null}
      {hasMistakes ? <TeacherCommonMistakesSection mistakes={common_mistakes!} /> : null}
      {hasCheck ? <TeacherCheckQuizSection check={check!} /> : null}
    </div>
  );
}
