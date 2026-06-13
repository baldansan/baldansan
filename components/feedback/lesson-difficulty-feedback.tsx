"use client";

import { useState } from "react";
import {
  recordFeedback,
  type LessonDifficultyRating,
} from "@/lib/analytics/record-feedback";

type Props = {
  lessonId: string;
};

const OPTIONS: { value: LessonDifficultyRating; label: string; emoji: string }[] =
  [
    { value: "hard", label: "Хүнд", emoji: "😣" },
    { value: "medium", label: "Дунд", emoji: "😐" },
    { value: "easy", label: "Амар", emoji: "😊" },
  ];

export function LessonDifficultyFeedback({ lessonId }: Props) {
  const [rating, setRating] = useState<LessonDifficultyRating | null>(null);
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);

  function submit(selected: LessonDifficultyRating) {
    if (sent) return;
    setRating(selected);
    recordFeedback({
      stage: "lesson_feedback",
      lessonId,
      rating: selected,
      note: note.trim() || null,
    });
    setSent(true);
  }

  if (sent) {
    return (
      <div className="bs-fb-lesson bs-fb-lesson--done">
        <p>Баярлалаа! {OPTIONS.find((o) => o.value === rating)?.emoji} санал хүлээн авлаа.</p>
      </div>
    );
  }

  return (
    <div className="bs-fb-lesson">
      <p className="bs-fb-lesson-title">Энэ хичээл хэр хүнд байсан бэ?</p>
      <div className="bs-fb-lesson-options">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className="bs-fb-lesson-opt"
            onClick={() => submit(opt.value)}
          >
            <span aria-hidden>{opt.emoji}</span>
            <span>{opt.label}</span>
          </button>
        ))}
      </div>
      <label className="bs-fb-note-label" htmlFor="lesson-fb-note">
        Нэмэлт сэтгэгдэл (заавал биш)
      </label>
      <textarea
        id="lesson-fb-note"
        className="bs-fb-note-input"
        rows={2}
        value={note}
        placeholder="Юу сайн, юу хүнд байсан бэ?"
        onChange={(e) => setNote(e.target.value)}
      />
    </div>
  );
}
