import type {
  ReviewRating,
  ReviewScheduleState,
  ReviewScheduleUpdate,
} from "@/lib/reviews/types";

const MIN_EASE = 1.3;
const DEFAULT_EASE = 2.5;

function addDays(from: Date, days: number): Date {
  const next = new Date(from);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

/**
 * SM-2-lite: Again resets interval; Good/Easy grow interval using ease factor.
 */
export function applySm2Lite(
  current: ReviewScheduleState,
  rating: ReviewRating,
  now: Date = new Date()
): ReviewScheduleUpdate {
  let { ease, interval_days, reps } = current;

  if (rating === "again") {
    ease = Math.max(MIN_EASE, ease - 0.2);
    interval_days = 0;
    reps = 0;
    return {
      ease,
      interval_days,
      reps,
      due_at: now,
      last_result: "again",
    };
  }

  reps += 1;

  if (rating === "good") {
    interval_days =
      reps === 1 ? 1 : Math.max(1, Math.round(interval_days * ease));
    return {
      ease,
      interval_days,
      reps,
      due_at: addDays(now, interval_days),
      last_result: "good",
    };
  }

  // easy
  ease = ease + 0.15;
  interval_days =
    reps === 1
      ? 2
      : Math.max(interval_days + 1, Math.round(interval_days * ease * 1.3));

  return {
    ease,
    interval_days,
    reps,
    due_at: addDays(now, interval_days),
    last_result: "easy",
  };
}

export function initialReviewSchedule(): ReviewScheduleState {
  return {
    ease: DEFAULT_EASE,
    interval_days: 0,
    reps: 0,
  };
}
