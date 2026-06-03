"use client";

import type { ReviewRating } from "@/lib/reviews/types";
import { EXERCISE_PRIMARY } from "@/components/lesson-exercises/exercise-theme";

type Props = {
  onRate: (rating: ReviewRating) => void;
  disabled?: boolean;
};

export function SrsRatingButtons({ onRate, disabled = false }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onRate("again")}
        className="min-h-[48px] rounded-2xl border border-red-200 bg-red-50 text-sm font-bold text-red-700 disabled:opacity-40"
      >
        Again
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onRate("good")}
        className="min-h-[48px] rounded-2xl text-sm font-bold text-white disabled:opacity-40"
        style={{ backgroundColor: EXERCISE_PRIMARY }}
      >
        Good
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onRate("easy")}
        className="min-h-[48px] rounded-2xl border border-emerald-200 bg-emerald-50 text-sm font-bold text-emerald-800 disabled:opacity-40"
      >
        Easy
      </button>
    </div>
  );
}
