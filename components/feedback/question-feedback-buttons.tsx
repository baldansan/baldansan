"use client";

import { useState } from "react";
import {
  recordFeedback,
  type QuestionFeedbackRating,
} from "@/lib/analytics/record-feedback";

type Props = {
  lessonId: string;
  questionId: string;
  stage?: "question";
  disabled?: boolean;
};

export function QuestionFeedbackButtons({
  lessonId,
  questionId,
  disabled = false,
}: Props) {
  const [rating, setRating] = useState<QuestionFeedbackRating | null>(null);
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);

  function submit(next: QuestionFeedbackRating, noteText?: string) {
    if (disabled || sent) return;
    setRating(next);
    recordFeedback({
      stage: "question",
      lessonId,
      questionId,
      rating: next,
      note: noteText ?? null,
    });
    setSent(true);
    if (next === "down") {
      setShowNote(false);
    }
  }

  if (sent) {
    return (
      <p className="bs-fb-sent" aria-live="polite">
        {rating === "up" ? "👍 Баярлалаа!" : "👎 Санал хүлээн авлаа."}
      </p>
    );
  }

  return (
    <div className="bs-fb-q">
      <span className="bs-fb-q-label">Энэ асуулт хэрэгтэй юу?</span>
      <div className="bs-fb-q-actions">
        <button
          type="button"
          className="bs-fb-btn"
          disabled={disabled}
          aria-label="Сайн"
          onClick={() => submit("up")}
        >
          👍
        </button>
        <button
          type="button"
          className="bs-fb-btn"
          disabled={disabled}
          aria-label="Сайжруулах"
          onClick={() => setShowNote(true)}
        >
          👎
        </button>
      </div>
      {showNote ? (
        <div className="bs-fb-note">
          <label className="bs-fb-note-label" htmlFor={`fb-note-${questionId}`}>
            Юу болохгүй/ойлгомжгүй байна?
          </label>
          <textarea
            id={`fb-note-${questionId}`}
            className="bs-fb-note-input"
            rows={2}
            value={note}
            placeholder="Заавал биш — бичвэл илүү тус болно"
            onChange={(e) => setNote(e.target.value)}
          />
          <button
            type="button"
            className="bs-fb-note-send"
            onClick={() => submit("down", note)}
          >
            Илгээх
          </button>
        </div>
      ) : null}
    </div>
  );
}
