"use client";

import { useRef, useState } from "react";
import {
  isSelfGradedPracticeQuestion,
  type PracticeFeedback,
} from "@/lib/mock-test/practice-feedback";
import {
  buildSentenceFromTokenIndices,
  isMockSentenceOrderQuestion,
  parseSentenceOrderTokens,
  sentenceOrderInstruction,
} from "@/lib/mock-test/sentence-order";
import type { MockOption, MockTestQuestionRow } from "@/lib/mock-test/types";

type Props = {
  question: MockTestQuestionRow;
  /** Хариулсан утга (илгээгдсэн бол). null = хараахан хариулаагүй. */
  answer: string | null;
  revealed: boolean;
  onAnswer: (value: string) => void;
  onSelfGrade: (isCorrect: boolean) => void;
  feedback: PracticeFeedback | null;
  /**
   * Энэ асуултын аудио нь хэсгийн БҮТЭН бичлэг (олон асуулт дундаа
   * хуваалцдаг) тул дээд талд нэг тоглуулагчаар тусад нь харуулж байгаа —
   * картан дотор давхардуулахгүй.
   */
  hideAudio?: boolean;
};

/** Сонголт бүрийн харагдах төлөв — будаж харуулахад хэрэглэнэ. */
type OptionState = "idle" | "picked" | "correct" | "wrong";

function optionState(
  key: string,
  answer: string | null,
  correctKey: string | null,
  revealed: boolean
): OptionState {
  const picked = answer != null && answer === key;
  if (!revealed) return picked ? "picked" : "idle";
  if (correctKey != null && key === correctKey) return "correct";
  if (picked) return "wrong";
  return "idle";
}

const OPTION_STATE_CLASS: Record<OptionState, string> = {
  idle: "",
  picked: " bs-mtp-option--picked",
  correct: " bs-mtp-option--correct",
  wrong: " bs-mtp-option--wrong",
};

function OptionMark({ state }: { state: OptionState }) {
  if (state === "correct") return <span className="bs-mtp-mark bs-mtp-mark--ok">✓</span>;
  if (state === "wrong") return <span className="bs-mtp-mark bs-mtp-mark--bad">✗</span>;
  return null;
}

/**
 * Аудио тоглуулагч. Шалгалтаас ялгаатай нь ХЯЗГААРГҮЙ дахин сонсоно —
 * сурах горимын гол утга нь энэ.
 *
 * Асуулт солигдоход дуудагч талаас `key={url}` өгч дахин мountлуулна —
 * effect дотор setState хийхээс зайлсхийсэн.
 */
export function PracticeAudio({
  url,
  startSec = null,
  endSec = null,
}: {
  url: string;
  /** Хэсгийн бүтэн бичлэг дэх энэ асуултын эхлэх секунд. */
  startSec?: number | null;
  endSec?: number | null;
}) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const sliced = startSec != null;

  /**
   * Зөвхөн энэ асуултын хэсгийг тоглуулна: эхлэхдээ startSec рүү үсэрч,
   * endSec дээр зогсоно. Хэрэглэгч гар аргаар хэсгээс гарвал таслахгүй —
   * зөвхөн энэ хэсгийг дуусгах үед л зогсооно.
   */
  const playFromStart = () => {
    const el = ref.current;
    if (!el) return;
    if (sliced) el.currentTime = startSec;
    void el.play();
  };

  const handleTimeUpdate = () => {
    const el = ref.current;
    if (!el || endSec == null) return;
    if (el.currentTime >= endSec) el.pause();
  };

  /**
   * `#t=` хэлтэрхий заримдаа ажиллахгүй (хөтөч, серверээс хамаарна) тул
   * мета мэдээлэл ачаалагдмагц гараар нь эхлэх цэг рүү нь аваачна.
   */
  const handleLoadedMetadata = () => {
    const el = ref.current;
    if (!el || !sliced) return;
    if (el.currentTime < startSec) {
      try {
        el.currentTime = startSec;
      } catch {
        // seek дэмжигдэхгүй бол эхнээс нь тоглоно — эвдрэхээсээ дээр.
      }
    }
  };

  return (
    <div className="bs-mtp-audio">
      <button
        type="button"
        className="bs-mtp-audio-btn"
        onClick={() => {
          const el = ref.current;
          if (!el) return;
          if (playing) {
            el.pause();
            return;
          }
          // Хэсгээс гадуур байвал эхнээс нь эхэлнэ.
          if (
            sliced &&
            (el.currentTime < startSec ||
              (endSec != null && el.currentTime >= endSec))
          ) {
            el.currentTime = startSec;
          }
          void el.play();
        }}
      >
        <span aria-hidden>{playing ? "⏸" : "▶"}</span>
        {playing ? "Түр зогсоох" : "Сонсох"}
      </button>
      <button type="button" className="bs-mtp-audio-again" onClick={playFromStart}>
        ⟲ Эхнээс
      </button>
      <audio
        ref={ref}
        src={sliced ? `${url}#t=${startSec}` : url}
        preload="metadata"
        controls
        className="bs-mtp-audio-el"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
      />
    </div>
  );
}

function Stem({ question }: { question: MockTestQuestionRow }) {
  return (
    <>
      {question.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={question.image_url} alt="" className="bs-mtp-image" />
      ) : null}
      {question.stem ? (
        <p className="bs-mtp-stem hanzi" translate="no">{question.stem}</p>
      ) : null}
    </>
  );
}

function TextOptionList({
  options,
  answer,
  correctKey,
  revealed,
  onPick,
}: {
  options: MockOption[];
  answer: string | null;
  correctKey: string | null;
  revealed: boolean;
  onPick: (key: string) => void;
}) {
  return (
    <div className="bs-mtp-options">
      {options.map((opt) => {
        const state = optionState(opt.key, answer, correctKey, revealed);
        return (
          <button
            key={opt.key}
            type="button"
            disabled={revealed}
            onClick={() => onPick(opt.key)}
            className={`bs-mtp-option${OPTION_STATE_CLASS[state]}`}
          >
            <span className="bs-mtp-option-key">{opt.key}</span>
            <span className="bs-mtp-option-text hanzi" translate="no">{opt.text}</span>
            <OptionMark state={state} />
          </button>
        );
      })}
    </div>
  );
}

function ImageOptionList({
  options,
  answer,
  correctKey,
  revealed,
  onPick,
}: {
  options: MockOption[];
  answer: string | null;
  correctKey: string | null;
  revealed: boolean;
  onPick: (key: string) => void;
}) {
  return (
    <div className="bs-mtp-image-options">
      {options.map((opt) => {
        const state = optionState(opt.key, answer, correctKey, revealed);
        return (
          <button
            key={opt.key}
            type="button"
            disabled={revealed}
            onClick={() => onPick(opt.key)}
            className={`bs-mtp-image-option${OPTION_STATE_CLASS[state]}`}
          >
            <span className="bs-mtp-option-key">{opt.key}</span>
            {opt.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={opt.image_url} alt="" />
            ) : (
              <span className="hanzi" translate="no">{opt.text}</span>
            )}
            <OptionMark state={state} />
          </button>
        );
      })}
    </div>
  );
}

function JudgeButtons({
  answer,
  correctKey,
  revealed,
  onPick,
}: {
  answer: string | null;
  correctKey: string | null;
  revealed: boolean;
  onPick: (value: string) => void;
}) {
  const choices = [
    { value: "√", label: "Зөв", glyph: "√" },
    { value: "×", label: "Буруу", glyph: "×" },
  ];
  return (
    <div className="bs-mtp-options bs-mtp-options--judge">
      {choices.map((choice) => {
        const state = optionState(choice.value, answer, correctKey, revealed);
        return (
          <button
            key={choice.value}
            type="button"
            disabled={revealed}
            onClick={() => onPick(choice.value)}
            className={`bs-mtp-option bs-mtp-option--judge${OPTION_STATE_CLASS[state]}`}
          >
            <span className="bs-mtp-judge-glyph" aria-hidden>
              {choice.glyph}
            </span>
            <span className="bs-mtp-option-text">{choice.label}</span>
            <OptionMark state={state} />
          </button>
        );
      })}
    </div>
  );
}

function SentenceOrderBuilder({
  question,
  answer,
  revealed,
  onAnswer,
}: {
  question: MockTestQuestionRow;
  answer: string | null;
  revealed: boolean;
  onAnswer: (value: string) => void;
}) {
  const tokens = parseSentenceOrderTokens(question);
  const [picked, setPicked] = useState<number[]>([]);
  const built = buildSentenceFromTokenIndices(tokens, picked);

  return (
    <div className="bs-mtp-order">
      <p className="bs-mtp-order-hint">
        {sentenceOrderInstruction(question.stem)}
      </p>
      <p className="bs-mtp-order-built hanzi" translate="no">{built || "…"}</p>
      <div className="bs-mtp-chip-row">
        {tokens.map((token, index) => (
          <button
            key={`${token}-${index}`}
            type="button"
            disabled={revealed || picked.includes(index)}
            className={`bs-mtp-chip hanzi${picked.includes(index) ? " bs-mtp-chip--used" : ""}`}
            translate="no"
            onClick={() => setPicked((prev) => [...prev, index])}
          >
            {token}
          </button>
        ))}
      </div>
      {!revealed ? (
        <div className="bs-mtp-order-actions">
          <button
            type="button"
            className="bs-mtp-link"
            onClick={() => setPicked([])}
          >
            Цэвэрлэх
          </button>
          <button
            type="button"
            className="bs-mtp-check"
            disabled={picked.length !== tokens.length || tokens.length === 0}
            onClick={() => onAnswer(built)}
          >
            Шалгах
          </button>
        </div>
      ) : (
        <p className="bs-mtp-your-line hanzi">
          Таны эвлүүлсэн: {answer || "—"}
        </p>
      )}
    </div>
  );
}

function FreeTextAnswer({
  answer,
  revealed,
  onAnswer,
  multiline,
}: {
  answer: string | null;
  revealed: boolean;
  onAnswer: (value: string) => void;
  multiline: boolean;
}) {
  const [draft, setDraft] = useState("");

  if (revealed) {
    return (
      <p className="bs-mtp-your-line hanzi">Таны бичсэн: {answer || "—"}</p>
    );
  }

  return (
    <div className="bs-mtp-free">
      {multiline ? (
        <textarea
          className="bs-mtp-textarea hanzi"
          rows={6}
          value={draft}
          placeholder="Хариултаа энд бичнэ үү…"
          onChange={(event) => setDraft(event.target.value)}
        />
      ) : (
        <input
          type="text"
          className="bs-mtp-input hanzi"
          value={draft}
          placeholder="Хариулт…"
          onChange={(event) => setDraft(event.target.value)}
        />
      )}
      <button
        type="button"
        className="bs-mtp-check"
        disabled={!draft.trim()}
        onClick={() => onAnswer(draft.trim())}
      >
        Шалгах
      </button>
    </div>
  );
}

export function MockTestPracticeQuestion({
  question,
  answer,
  revealed,
  onAnswer,
  onSelfGrade,
  feedback,
  hideAudio = false,
}: Props) {
  const options = question.options ?? [];
  const hasImageOptions = options.some((opt) => opt.image_url);
  const correctKey = feedback?.correctKey ?? null;
  const selfGraded = isSelfGradedPracticeQuestion(question);

  // Сонголт дарангуут шууд илчилнэ — тусдаа «Илгээх» товч байхгүй.
  const pick = (value: string) => {
    if (revealed) return;
    onAnswer(value);
  };

  let body: React.ReactNode;

  if (question.q_type === "judge") {
    body = (
      <JudgeButtons
        answer={answer}
        correctKey={correctKey}
        revealed={revealed}
        onPick={pick}
      />
    );
  } else if (question.q_type === "order") {
    body = (
      <TextOptionList
        options={options}
        answer={answer}
        correctKey={correctKey}
        revealed={revealed}
        onPick={pick}
      />
    );
  } else if (isMockSentenceOrderQuestion(question)) {
    body = (
      <SentenceOrderBuilder
        key={question.id}
        question={question}
        answer={answer}
        revealed={revealed}
        onAnswer={onAnswer}
      />
    );
  } else if (options.length > 0) {
    body = hasImageOptions ? (
      <ImageOptionList
        options={options}
        answer={answer}
        correctKey={correctKey}
        revealed={revealed}
        onPick={pick}
      />
    ) : (
      <TextOptionList
        options={options}
        answer={answer}
        correctKey={correctKey}
        revealed={revealed}
        onPick={pick}
      />
    );
  } else {
    body = (
      <FreeTextAnswer
        key={question.id}
        answer={answer}
        revealed={revealed}
        onAnswer={onAnswer}
        multiline={selfGraded}
      />
    );
  }

  return (
    <div className="bs-mtp-card">
      <p className="bs-mtp-qno">Асуулт {question.q_no}</p>
      {question.audio_url && !hideAudio ? (
        <PracticeAudio
          key={`${question.audio_url}#${question.audio_start_sec ?? 0}`}
          url={question.audio_url}
          startSec={question.audio_start_sec}
          endSec={question.audio_end_sec}
        />
      ) : null}
      <Stem question={question} />
      {body}
      {revealed && question.audio_transcript?.trim() ? (
        <section className="bs-mtp-transcript">
          <p className="bs-mtp-transcript-label">Сонссон бичвэр</p>
          <p className="bs-mtp-transcript-text hanzi" translate="no">
            {question.audio_transcript.trim()}
          </p>
          <p className="bs-mtp-transcript-note">
            Энэ бичвэрийг яриа таних програмаар автоматаар буулгасан тул
            нэр, ховор үг дээр алдаа гарсан байж болно. Албан ёсны HSK
            материалд сонсголын эх бичвэр нийтлэгддэггүй.
          </p>
        </section>
      ) : null}

      {revealed && feedback ? (
        <PracticeFeedbackPanel
          feedback={feedback}
          selfGraded={selfGraded}
          onSelfGrade={onSelfGrade}
        />
      ) : null}
    </div>
  );
}

function PracticeFeedbackPanel({
  feedback,
  selfGraded,
  onSelfGrade,
}: {
  feedback: PracticeFeedback;
  selfGraded: boolean;
  onSelfGrade: (isCorrect: boolean) => void;
}) {
  const tone =
    feedback.isCorrect === true
      ? "ok"
      : feedback.isCorrect === false
        ? "bad"
        : "pending";

  const headline =
    feedback.isCorrect === true
      ? "Зөв! 🎉"
      : feedback.isCorrect === false
        ? "Буруу байна"
        : "Өөрөө үнэлнэ үү";

  return (
    <div className={`bs-mtp-feedback bs-mtp-feedback--${tone}`}>
      <p className="bs-mtp-feedback-title">{headline}</p>

      {feedback.isCorrect === false && feedback.yourText ? (
        <p className="bs-mtp-feedback-row">
          <span>Таны хариулт</span>
          <b className="hanzi" translate="no">{feedback.yourText}</b>
        </p>
      ) : null}

      <p className="bs-mtp-feedback-row">
        <span>{selfGraded ? "Жишиг хариу" : "Зөв хариулт"}</span>
        <b className="hanzi" translate="no">{feedback.correctText}</b>
      </p>

      {feedback.explanation ? (
        <p className="bs-mtp-feedback-why">
          <b>Яагаад:</b> <span translate="no">{feedback.explanation}</span>
        </p>
      ) : null}

      {feedback.hint ? (
        <p className="bs-mtp-feedback-hint">💡 {feedback.hint}</p>
      ) : null}

      {feedback.tags.length > 0 ? (
        <div className="bs-mtp-tag-row">
          {feedback.tags.map((tag) => (
            <span key={tag.tag} className={`bs-mtp-tag bs-mtp-tag--${tag.category}`}>
              {tag.label}
            </span>
          ))}
        </div>
      ) : null}

      {selfGraded && feedback.isCorrect == null ? (
        <div className="bs-mtp-self-grade">
          <button
            type="button"
            className="bs-mtp-self-btn bs-mtp-self-btn--ok"
            onClick={() => onSelfGrade(true)}
          >
            Зөв бичсэн
          </button>
          <button
            type="button"
            className="bs-mtp-self-btn bs-mtp-self-btn--bad"
            onClick={() => onSelfGrade(false)}
          >
            Алдсан
          </button>
        </div>
      ) : null}
    </div>
  );
}
