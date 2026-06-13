"use client";

import { useEffect, useMemo, useState } from "react";
import "@/components/lesson/modules/exercises-module.css";
import { SpeakerButton } from "@/components/tts/speaker-button";
import { LessonPlayerCard } from "@/components/lesson-player/lesson-player-shell";
import {
  buildSentenceFromTokenIndices,
  gradeQuizSentenceOrder,
  parseQuizSentenceOrderTokens,
  quizSentenceOrderInstruction,
  seqIndicesFromStoredAnswer,
} from "@/lib/quiz/sentence-order";
import { containsTargetScript } from "@/lib/tts/infer-lang";
import type { QuizQuestion } from "@/types/lesson";

type Props = {
  question: QuizQuestion;
  index: number;
  total: number;
  selected: string | null;
  revealed: boolean;
  ttsLang: string;
  courseId: string;
  onChecked: (answer: string) => void;
};

export function LessonQuizSentenceOrder({
  question,
  index,
  total,
  selected,
  revealed,
  ttsLang,
  courseId,
  onChecked,
}: Props) {
  const tokens = useMemo(
    () => parseQuizSentenceOrderTokens(question),
    [question]
  );
  const instruction = quizSentenceOrderInstruction(question);
  const [seq, setSeq] = useState<number[]>(() =>
    selected ? seqIndicesFromStoredAnswer(tokens, selected) : []
  );

  const built = useMemo(
    () => buildSentenceFromTokenIndices(tokens, seq),
    [tokens, seq]
  );
  const allPlaced = seq.length === tokens.length;
  const locked = revealed;
  const isCorrect = revealed && selected != null
    ? gradeQuizSentenceOrder(question, selected)
    : false;

  useEffect(() => {
    if (!selected) {
      setSeq([]);
      return;
    }
    const restored = seqIndicesFromStoredAnswer(tokens, selected);
    if (restored.length === tokens.length) {
      setSeq(restored);
    }
  }, [question.id, tokens, selected]);

  function toggleToken(index: number) {
    if (locked) return;
    setSeq((prev) => {
      const pos = prev.indexOf(index);
      return pos >= 0 ? prev.filter((i) => i !== index) : [...prev, index];
    });
  }

  function resetOrder() {
    if (locked) return;
    setSeq([]);
  }

  function checkAnswer() {
    if (!allPlaced || locked) return;
    onChecked(buildSentenceFromTokenIndices(tokens, seq));
  }

  return (
    <LessonPlayerCard>
      <p className="text-sm font-medium text-emerald-700">
        Асуулт {index + 1} / {total}
      </p>
      <div className="mt-3 flex items-start gap-2">
        <h2 className="min-w-0 flex-1 text-lg font-bold leading-snug text-slate-900">
          {instruction}
        </h2>
        {containsTargetScript(question.correctAnswer) ? (
          <SpeakerButton
            text={question.correctAnswer}
            lang={ttsLang}
            courseId={courseId}
            size="sm"
          />
        ) : null}
      </div>

      <div className="bs-ex-build" style={{ marginTop: 16 }}>
        {seq.length === 0 ? (
          <span className="bs-ex-ph">Доороос үг дарж энд нэмнэ…</span>
        ) : (
          seq.map((tokenIndex, pos) => (
            <button
              key={`${tokenIndex}-${pos}`}
              type="button"
              className="bs-ex-tok bs-built hanzi"
              onClick={() => toggleToken(tokenIndex)}
              disabled={locked}
            >
              {tokens[tokenIndex]}
            </button>
          ))
        )}
      </div>

      <div className="bs-ex-pool">
        {tokens.map((token, tokenIndex) =>
          seq.includes(tokenIndex) ? null : (
            <button
              key={tokenIndex}
              type="button"
              className="bs-ex-tok hanzi"
              onClick={() => toggleToken(tokenIndex)}
              disabled={locked}
            >
              {token}
            </button>
          )
        )}
      </div>

      {!locked ? (
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <button
            type="button"
            className="bs-ex-check"
            onClick={checkAnswer}
            disabled={!allPlaced}
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

      {revealed ? (
        <div
          className={`bs-ex-fb ${isCorrect ? "bs-ok" : "bs-no"}`}
          style={{ marginTop: 12 }}
        >
          {isCorrect ? (
            <span>✓ Зөв!</span>
          ) : (
            <span>
              ✗ Буруу. <b className="hanzi">Зөв: {question.correctAnswer}</b>
            </span>
          )}
          {question.explanation ? (
            <p className="mt-2 text-sm text-slate-700">{question.explanation}</p>
          ) : null}
        </div>
      ) : null}
    </LessonPlayerCard>
  );
}
