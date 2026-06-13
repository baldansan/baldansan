"use client";

import { useState } from "react";
import { MnGrammarTermText } from "@/components/lesson/mn-grammar-term-text";
import {
  CHINESE_SENTENCE_STRUCTURE_INTRO,
  CHINESE_SENTENCE_STRUCTURE_QUIZ,
  markSentenceStructureGatePassed,
} from "@/lib/lesson/chinese-sentence-structure";

type Props = {
  onPassed: () => void;
};

export function SentenceStructureGate({ onPassed }: Props) {
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const item = CHINESE_SENTENCE_STRUCTURE_QUIZ[qi];
  const total = CHINESE_SENTENCE_STRUCTURE_QUIZ.length;
  const isCorrect = picked === item.answer;
  const effectiveCorrectCount =
    answered && isCorrect && correctCount < total ? correctCount + 1 : correctCount;
  const allCorrectSoFar =
    answered && qi === total - 1 && effectiveCorrectCount === total;

  function pickOption(opt: string) {
    if (answered) return;
    setPicked(opt);
    setAnswered(true);
    if (opt === item.answer) {
      setCorrectCount((c) => c + 1);
    }
  }

  function continueAfterAnswer() {
    if (qi < total - 1) {
      setQi(qi + 1);
      setPicked(null);
      setAnswered(false);
      return;
    }

    if (correctCount === total || (picked === item.answer && correctCount === total - 1)) {
      markSentenceStructureGatePassed();
      onPassed();
      return;
    }

    setQi(0);
    setPicked(null);
    setAnswered(false);
    setCorrectCount(0);
  }

  return (
    <div className="bs-card bs-sentence-gate">
      <div className="bs-label">
        <span className="bs-dot" />
        {CHINESE_SENTENCE_STRUCTURE_INTRO.title}
      </div>

      <ul className="bs-sentence-gate-bullets">
        {CHINESE_SENTENCE_STRUCTURE_INTRO.bullets.map((line) => (
          <li key={line}>
            <MnGrammarTermText text={line} />
          </li>
        ))}
      </ul>

      <div className="bs-sentence-gate-quiz">
        <p className="bs-tov-section-title">
          Мини-сорил ({qi + 1}/{total})
        </p>
        <p className="bs-tov-check-q">
          <MnGrammarTermText text={item.question} />
        </p>
        <div className="bs-tov-check-opts">
          {item.options.map((opt) => {
            const isPicked = picked === opt;
            const isAnswer = opt === item.answer;
            let cls = "bs-tov-check-opt";
            if (answered && isPicked && isCorrect) cls += " bs-tov-check-opt--ok";
            else if (answered && isPicked && !isCorrect) cls += " bs-tov-check-opt--bad";
            else if (answered && isAnswer && !isCorrect) cls += " bs-tov-check-opt--reveal";
            return (
              <button
                key={opt}
                type="button"
                className={cls}
                disabled={answered}
                onClick={() => pickOption(opt)}
              >
                <MnGrammarTermText text={opt} nested />
              </button>
            );
          })}
        </div>
        {answered && !isCorrect ? (
          <p className="bs-tov-check-feedback bs-tov-check-feedback--bad">
            Зөв хариулт: <MnGrammarTermText text={item.answer} nested />
          </p>
        ) : null}
        {answered && isCorrect ? (
          <p className="bs-tov-check-feedback bs-tov-check-feedback--ok">Зөв!</p>
        ) : null}
        {answered ? (
          <button type="button" className="bs-cta" onClick={continueAfterAnswer}>
            {allCorrectSoFar ? "Дасгал руу орох →" : qi < total - 1 ? "Дараагийнх →" : "Дахин оролдох"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
