"use client";

import { useRef } from "react";
import { MockTestSentenceOrder } from "@/components/mock-test/mock-test-sentence-order";
import { formatCorrectAnswer } from "@/lib/mock-test/format-answer";
import {
  isMockSentenceOrderQuestion,
  parseSentenceOrderTokens,
} from "@/lib/mock-test/sentence-order";
import type {
  MockOption,
  MockTestAnswers,
  MockTestQuestionRow,
} from "@/lib/mock-test/types";

type Props = {
  question: MockTestQuestionRow;
  answers: MockTestAnswers;
  onAnswer: (qNo: number, value: string) => void;
  showResults?: boolean;
  resultCorrect?: boolean | null;
  hideQuestionAudio?: boolean;
  onAdvanceNext?: () => void;
};

const LONG_TEXT_TYPES = new Set([
  "picture_sentence",
  "essay",
  "summary",
]);

function QuestionHeader({
  question,
  showResults,
  resultCorrect,
}: {
  question: MockTestQuestionRow;
  showResults: boolean;
  resultCorrect: boolean | null;
}) {
  return (
    <p className="bs-mt-q-label">
      Асуулт {question.q_no}
      {showResults && resultCorrect != null ? (
        <span className={resultCorrect ? " bs-mt-q-ok" : " bs-mt-q-bad"}>
          {resultCorrect ? " ✓" : " ✗"}
        </span>
      ) : null}
      {showResults && resultCorrect == null && question.autograde === "manual" ? (
        <span className=" bs-mt-q-pending"> · хүлээгдэж байна</span>
      ) : null}
    </p>
  );
}

function QuestionAudio({ url }: { url: string }) {
  const ref = useRef<HTMLAudioElement>(null);
  return (
    <button
      type="button"
      className="bs-mt-q-audio-btn"
      onClick={() => {
        const el = ref.current;
        if (!el) return;
        void el.play();
      }}
      aria-label="Сонсох"
    >
      ▶
      <audio ref={ref} src={url} preload="none" />
    </button>
  );
}

function StemBlock({ question }: { question: MockTestQuestionRow }) {
  return (
    <>
      {question.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={question.image_url} alt="" className="bs-mt-q-image" />
      ) : null}
      {question.stem ? (
        <p className="bs-mt-q-text hanzi">{question.stem}</p>
      ) : null}
    </>
  );
}

function ResultExtras({
  question,
  showResults,
  resultCorrect,
  hideCorrectLine = false,
}: {
  question: MockTestQuestionRow;
  showResults: boolean;
  resultCorrect: boolean | null;
  hideCorrectLine?: boolean;
}) {
  if (!showResults) return null;

  const showCorrect =
    !hideCorrectLine &&
    question.correct_answer &&
    (resultCorrect === false || question.autograde === "manual");

  return (
    <>
      {showCorrect ? (
        <p className="bs-mt-correct-line hanzi">
          Зөв хариулт: {formatCorrectAnswer(question)}
        </p>
      ) : null}
      {question.explanation_mn ? (
        <p className="bs-mt-explain">{question.explanation_mn}</p>
      ) : null}
    </>
  );
}

export function MockTestQuestion({
  question,
  answers,
  onAnswer,
  showResults = false,
  resultCorrect = null,
  hideQuestionAudio = false,
  onAdvanceNext,
}: Props) {
  const key = String(question.q_no);
  const value = answers[key] ?? "";
  const options = question.options ?? [];

  if (question.q_type === "judge") {
    return (
      <div className="bs-mt-question">
        <QuestionHeader
          question={question}
          showResults={showResults}
          resultCorrect={resultCorrect}
        />
        {!hideQuestionAudio && question.audio_url ? (
          <QuestionAudio url={question.audio_url} />
        ) : null}
        <StemBlock question={question} />
        <div className="bs-mt-option-grid bs-mt-option-grid--judge">
          {[
            { label: "√", value: "√" },
            { label: "×", value: "×" },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              disabled={showResults}
              className={`bs-mt-option ${value === opt.value ? "bs-mt-option--picked" : ""}`}
              onClick={() => onAnswer(question.q_no, opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <ResultExtras
          question={question}
          showResults={showResults}
          resultCorrect={resultCorrect}
        />
      </div>
    );
  }

  if (question.q_type === "order") {
    return (
      <OrderQuestion
        question={question}
        value={value}
        options={options}
        onAnswer={(v) => onAnswer(question.q_no, v)}
        showResults={showResults}
        resultCorrect={resultCorrect}
      />
    );
  }

  if (LONG_TEXT_TYPES.has(question.q_type)) {
    return (
      <div className="bs-mt-question">
        <QuestionHeader
          question={question}
          showResults={showResults}
          resultCorrect={resultCorrect}
        />
        <StemBlock question={question} />
        <textarea
          className="bs-mt-essay-input"
          rows={6}
          value={value}
          disabled={showResults}
          placeholder="Хариултаа энд бичнэ үү…"
          onChange={(e) => onAnswer(question.q_no, e.target.value)}
        />
        <ResultExtras
          question={question}
          showResults={showResults}
          resultCorrect={resultCorrect}
        />
      </div>
    );
  }

  if (question.q_type === "complete" || question.q_type === "fill_char") {
    if (isMockSentenceOrderQuestion(question)) {
      const tokens = parseSentenceOrderTokens(question);
      return (
        <div className="bs-mt-question">
          <QuestionHeader
            question={question}
            showResults={showResults}
            resultCorrect={resultCorrect}
          />
          <MockTestSentenceOrder
            question={question}
            tokens={tokens}
            value={value}
            onAnswer={(next) => onAnswer(question.q_no, next)}
            showResults={showResults}
            resultCorrect={resultCorrect}
            onAdvanceNext={onAdvanceNext}
          />
          {showResults ? (
            <ResultExtras
              question={question}
              showResults={showResults}
              resultCorrect={resultCorrect}
              hideCorrectLine
            />
          ) : null}
        </div>
      );
    }

    return (
      <div className="bs-mt-question">
        <QuestionHeader
          question={question}
          showResults={showResults}
          resultCorrect={resultCorrect}
        />
        <StemBlock question={question} />
        <input
          type="text"
          className="bs-mt-text-input hanzi"
          value={value}
          disabled={showResults}
          placeholder="Хариулт…"
          onChange={(e) => onAnswer(question.q_no, e.target.value)}
        />
        <ResultExtras
          question={question}
          showResults={showResults}
          resultCorrect={resultCorrect}
        />
      </div>
    );
  }

  if (question.q_type === "fill_word") {
    return (
      <div className="bs-mt-question">
        <QuestionHeader
          question={question}
          showResults={showResults}
          resultCorrect={resultCorrect}
        />
        <StemBlock question={question} />
        <select
          className="bs-mt-select"
          value={value}
          disabled={showResults}
          onChange={(e) => onAnswer(question.q_no, e.target.value)}
        >
          <option value="">Сонгох…</option>
          {options.map((opt) => (
            <option key={opt.key} value={opt.key}>
              {opt.text ? `${opt.key}. ${opt.text}` : opt.key}
            </option>
          ))}
        </select>
        <ResultExtras
          question={question}
          showResults={showResults}
          resultCorrect={resultCorrect}
        />
      </div>
    );
  }

  const hasImageOptions = options.some((o) => o.image_url);

  if (
    question.q_type === "match" ||
    question.q_type === "fill_match" ||
    hasImageOptions
  ) {
    return (
      <div className="bs-mt-question">
        <QuestionHeader
          question={question}
          showResults={showResults}
          resultCorrect={resultCorrect}
        />
        <StemBlock question={question} />
        {hasImageOptions ? (
          <div className="bs-mt-image-option-grid">
            {options.map((opt) => (
              <button
                key={opt.key}
                type="button"
                disabled={showResults}
                className={`bs-mt-image-option ${value === opt.key ? "bs-mt-image-option--picked" : ""}`}
                onClick={() => onAnswer(question.q_no, opt.key)}
              >
                <span className="bs-mt-option-letter">{opt.key}</span>
                {opt.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={opt.image_url} alt="" />
                ) : (
                  <span className="hanzi">{opt.text}</span>
                )}
              </button>
            ))}
          </div>
        ) : (
          <TextOptions
            options={options}
            value={value}
            showResults={showResults}
            onPick={(k) => onAnswer(question.q_no, k)}
          />
        )}
        <ResultExtras
          question={question}
          showResults={showResults}
          resultCorrect={resultCorrect}
        />
      </div>
    );
  }

  return (
    <div className="bs-mt-question">
      <QuestionHeader
        question={question}
        showResults={showResults}
        resultCorrect={resultCorrect}
      />
      {!hideQuestionAudio && question.audio_url ? (
        <QuestionAudio url={question.audio_url} />
      ) : null}
      <StemBlock question={question} />
      <TextOptions
        options={options}
        value={value}
        showResults={showResults}
        onPick={(k) => onAnswer(question.q_no, k)}
      />
      <ResultExtras
        question={question}
        showResults={showResults}
        resultCorrect={resultCorrect}
      />
    </div>
  );
}

function TextOptions({
  options,
  value,
  showResults,
  onPick,
}: {
  options: MockOption[];
  value: string;
  showResults: boolean;
  onPick: (key: string) => void;
}) {
  if (!options.length) return null;
  return (
    <div className="bs-mt-option-grid">
      {options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          disabled={showResults}
          className={`bs-mt-option ${value === opt.key ? "bs-mt-option--picked" : ""}`}
          onClick={() => onPick(opt.key)}
        >
          <span className="bs-mt-option-letter">{opt.key}</span>
          <span className="hanzi">{opt.text}</span>
        </button>
      ))}
    </div>
  );
}

function OrderQuestion({
  question,
  value,
  options,
  onAnswer,
  showResults,
  resultCorrect,
}: {
  question: MockTestQuestionRow;
  value: string;
  options: MockOption[];
  onAnswer: (v: string) => void;
  showResults: boolean;
  resultCorrect: boolean | null;
}) {
  const picked = value ? value.split("").filter(Boolean) : [];

  function toggleKey(k: string) {
    if (showResults) return;
    const next = picked.includes(k)
      ? picked.filter((c) => c !== k)
      : [...picked, k];
    onAnswer(next.join(""));
  }

  function reset() {
    if (showResults) return;
    onAnswer("");
  }

  return (
    <div className="bs-mt-question">
      <QuestionHeader
        question={question}
        showResults={showResults}
        resultCorrect={resultCorrect}
      />
      <StemBlock question={question} />
      <p className="bs-mt-word-sentence hanzi">{picked.join(" → ") || "…"}</p>
      <div className="bs-mt-chip-row">
        {options.map((opt) => (
          <button
            key={opt.key}
            type="button"
            disabled={showResults || picked.includes(opt.key)}
            className={`bs-mt-chip hanzi ${picked.includes(opt.key) ? "bs-mt-chip--used" : ""}`}
            onClick={() => toggleKey(opt.key)}
          >
            {opt.key}
            {opt.text ? ` ${opt.text}` : ""}
          </button>
        ))}
      </div>
      {!showResults ? (
        <button type="button" className="bs-mt-link-btn" onClick={reset}>
          Дахин эхлэх
        </button>
      ) : null}
      <ResultExtras
        question={question}
        showResults={showResults}
        resultCorrect={resultCorrect}
      />
    </div>
  );
}
