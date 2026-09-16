"use client";

import { useState } from "react";
import {
  mapGrammarExerciseType,
  recordQuestionAttempt,
} from "@/lib/analytics/record-question-attempt";
import type { DeepDrill } from "@/types/lesson-deep-teaching";

type Props = {
  lessonId: string;
  /** Дүрмийн цэгийн нэр — асуултын ID-д хэрэглэнэ. */
  pointKey: string;
  drills: DeepDrill[];
};

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s.,，。、；;：:！!？?"""''（）()]/g, "");
}

function isCorrect(drill: DeepDrill, answer: string): boolean {
  if (drill.type === "judge") {
    return normalize(answer) === normalize(drill.answer);
  }
  return normalize(answer) === normalize(drill.answer);
}

/**
 * Дүрмийн жижиг дасгал — хариулсан даруйд зөв эсэхийг ХАРУУЛНА, дараа нь
 * «яагаад» гэдгийг тайлбарлана. Шалгалт биш тул дахин оролдож болно.
 */
export function DeepGrammarDrill({ lessonId, pointKey, drills }: Props) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [drafts, setDrafts] = useState<Record<number, string>>({});

  if (!drills.length) return null;

  function submit(index: number, drill: DeepDrill, value: string) {
    if (!value.trim() || answers[index] != null) return;
    setAnswers((prev) => ({ ...prev, [index]: value }));
    recordQuestionAttempt({
      lessonId,
      stage: "grammar_exercise",
      questionId: `deep:${pointKey}:${index}`,
      questionType: mapGrammarExerciseType(drill.type),
      isCorrect: isCorrect(drill, value),
      selectedAnswer: value,
      correctAnswer: drill.answer,
    });
  }

  return (
    <div className="bs-deep-block">
      <p className="bs-deep-block-title">Шалгаад үзье</p>
      <ol className="bs-deep-drills">
        {drills.map((drill, index) => {
          const given = answers[index];
          const answered = given != null;
          const correct = answered && isCorrect(drill, given);

          return (
            <li key={index} className="bs-deep-drill">
              <p className="bs-deep-drill-q hanzi">{drill.question}</p>

              {drill.type === "choice" && drill.options?.length ? (
                <div className="bs-deep-drill-options">
                  {drill.options.map((option) => {
                    const picked = given === option;
                    const isAnswer =
                      answered && normalize(option) === normalize(drill.answer);
                    const tone = !answered
                      ? ""
                      : isAnswer
                        ? " bs-deep-opt--ok"
                        : picked
                          ? " bs-deep-opt--bad"
                          : "";
                    return (
                      <button
                        key={option}
                        type="button"
                        disabled={answered}
                        className={`bs-deep-opt${tone}`}
                        onClick={() => submit(index, drill, option)}
                      >
                        <span className="hanzi">{option}</span>
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {drill.type === "judge" ? (
                <div className="bs-deep-drill-options">
                  {[
                    { value: "true", label: "Зөв" },
                    { value: "false", label: "Буруу" },
                  ].map((option) => {
                    const picked = given === option.value;
                    const isAnswer =
                      answered &&
                      normalize(option.value) === normalize(drill.answer);
                    const tone = !answered
                      ? ""
                      : isAnswer
                        ? " bs-deep-opt--ok"
                        : picked
                          ? " bs-deep-opt--bad"
                          : "";
                    return (
                      <button
                        key={option.value}
                        type="button"
                        disabled={answered}
                        className={`bs-deep-opt${tone}`}
                        onClick={() => submit(index, drill, option.value)}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {drill.type === "fill" ? (
                answered ? (
                  <p className="bs-deep-your hanzi">
                    Таны хариулт: {given || "—"}
                  </p>
                ) : (
                  <div className="bs-deep-fill">
                    <input
                      type="text"
                      className="bs-deep-fill-input hanzi"
                      value={drafts[index] ?? ""}
                      placeholder="Хариултаа бич…"
                      onChange={(event) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [index]: event.target.value,
                        }))
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          submit(index, drill, drafts[index] ?? "");
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="bs-deep-fill-btn"
                      disabled={!(drafts[index] ?? "").trim()}
                      onClick={() => submit(index, drill, drafts[index] ?? "")}
                    >
                      Шалгах
                    </button>
                  </div>
                )
              ) : null}

              {answered ? (
                <div
                  className={`bs-deep-drill-feedback ${
                    correct
                      ? "bs-deep-drill-feedback--ok"
                      : "bs-deep-drill-feedback--bad"
                  }`}
                >
                  <p className="bs-deep-drill-verdict">
                    {correct ? "Зөв!" : `Зөв хариулт: ${
                      drill.type === "judge"
                        ? normalize(drill.answer) === "true"
                          ? "Зөв"
                          : "Буруу"
                        : drill.answer
                    }`}
                  </p>
                  <p className="bs-deep-why">{drill.why_mn}</p>
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
