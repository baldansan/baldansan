"use client";

import { useState } from "react";
import { MotionButton } from "@/components/motion/motion-pressable";
import { VocabFlipCard } from "@/components/motion/vocab-flip-card";
import { SpeakerButton } from "@/components/tts/speaker-button";
import type { ExerciseOnResult, LessonV2VocabularyItem } from "@/types/lesson-v2";
import type { ReviewRating } from "@/lib/reviews/types";
import { EXERCISE_PRIMARY, EXERCISE_PRIMARY_LIGHT } from "./exercise-theme";

type Props = {
  word: LessonV2VocabularyItem;
  audioUrl?: string;
  onResult?: ExerciseOnResult;
  /** SRS review session: show Again / Good / Easy after flip */
  reviewMode?: boolean;
  onReviewRating?: (rating: ReviewRating) => void;
};

export function VocabCard({
  word,
  audioUrl,
  onResult,
  reviewMode = false,
  onReviewRating,
}: Props) {
  const [flipped, setFlipped] = useState(false);
  const [answered, setAnswered] = useState(false);

  const handleFlip = () => {
    if (!answered) setFlipped((value) => !value);
  };

  const handleSrs = (knows: boolean) => {
    if (answered) return;
    setAnswered(true);
    onResult?.({ correct: knows });
  };

  const handleReviewRating = (rating: ReviewRating) => {
    if (answered) return;
    setAnswered(true);
    onReviewRating?.(rating);
  };

  const front = (
    <div className="flex flex-col items-center justify-center gap-4 py-6">
      <span className="text-5xl font-bold text-slate-900">{word.zh}</span>
      <div onClick={(e) => e.stopPropagation()} role="presentation">
        <SpeakerButton
          text={word.zh}
          lang="zh-CN"
          hskLevel="HSK1"
          audioUrl={audioUrl}
          size="lg"
          stopPropagation
        />
      </div>
      <p className="text-xs text-slate-400">Tap → эргүүлэх</p>
    </div>
  );

  const back = (
    <div className="flex flex-col items-center gap-3 py-4">
      <span className="text-3xl font-bold text-slate-900">{word.zh}</span>
      <p className="text-lg font-medium" style={{ color: EXERCISE_PRIMARY }}>
        {word.pinyin}
      </p>
      <p className="text-base text-slate-700">{word.mn}</p>
      {word.example_zh ? (
        <p
          className="mt-1 rounded-xl px-3 py-2 text-sm text-slate-600"
          style={{ backgroundColor: EXERCISE_PRIMARY_LIGHT }}
        >
          {word.example_zh}
        </p>
      ) : null}
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-[430px]">
      <VocabFlipCard
        flipped={flipped}
        onFlip={handleFlip}
        disabled={answered && !flipped}
        front={front}
        back={back}
      />

      {flipped && !answered ? (
        reviewMode ? (
          <div className="mt-3 grid grid-cols-3 gap-2">
            <MotionButton
              onClick={() => handleReviewRating("again")}
              className="min-h-[44px] rounded-full border border-red-200 bg-red-50 text-xs font-semibold text-red-700"
            >
              Again
            </MotionButton>
            <MotionButton
              onClick={() => handleReviewRating("good")}
              className="min-h-[44px] rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: EXERCISE_PRIMARY }}
            >
              Good
            </MotionButton>
            <MotionButton
              onClick={() => handleReviewRating("easy")}
              className="min-h-[44px] rounded-full border border-emerald-200 bg-emerald-50 text-xs font-semibold text-emerald-800"
            >
              Easy
            </MotionButton>
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <MotionButton
              onClick={() => handleSrs(false)}
              className="min-h-[44px] rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700"
            >
              Мэдэхгүй
            </MotionButton>
            <MotionButton
              onClick={() => handleSrs(true)}
              className="min-h-[44px] rounded-full text-sm font-semibold text-white"
              style={{ backgroundColor: EXERCISE_PRIMARY }}
            >
              Мэдэж байна
            </MotionButton>
          </div>
        )
      ) : null}

      {answered && !reviewMode ? (
        <p className="mt-2 text-center text-xs text-slate-500">
          SRS-д бүртгэгдэх (удаа хийгдэнэ)
        </p>
      ) : null}
    </div>
  );
}
