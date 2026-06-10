import type {
  WordSrsRating,
  WordSrsScheduleState,
  WordSrsScheduleUpdate,
} from "@/lib/srs/word-srs-types";

const MIN_EASE = 1.3;
const DEFAULT_EASE = 2.5;
const MINUTE_MS = 60_000;
const DAY_MS = 86_400_000;

function addMs(from: Date, ms: number): Date {
  return new Date(from.getTime() + ms);
}

function intervalDaysToMs(days: number): number {
  return Math.max(0, days) * DAY_MS;
}

/**
 * Leitner / SM-2-lite for HSK words:
 * - forgot: reset reps, re-due in ~1 minute
 * - hard: interval *= 1.2, ease -= 0.15, due in max(10 min, interval)
 * - known: first success → 4 days; else interval *= ease (days)
 */
export function applyWordSrsRating(
  current: WordSrsScheduleState,
  rating: WordSrsRating,
  now: Date = new Date()
): WordSrsScheduleUpdate {
  let { ease, interval_days, reps } = current;

  if (rating === "forgot") {
    return {
      reps: 0,
      ease: Math.max(MIN_EASE, ease - 0.1),
      interval_days: 0,
      due_at: addMs(now, MINUTE_MS),
      last_rating: "forgot",
    };
  }

  if (rating === "hard") {
    ease = Math.max(MIN_EASE, ease - 0.15);
    interval_days =
      interval_days <= 0 ? 10 / (24 * 60) : interval_days * 1.2;
    const waitMs = Math.max(10 * MINUTE_MS, intervalDaysToMs(interval_days));
    return {
      reps: reps + 1,
      ease,
      interval_days,
      due_at: addMs(now, waitMs),
      last_rating: "hard",
    };
  }

  // known
  reps += 1;
  if (reps === 1) {
    interval_days = 4;
  } else {
    interval_days = Math.max(1, interval_days * ease);
  }

  return {
    reps,
    ease,
    interval_days,
    due_at: addMs(now, intervalDaysToMs(interval_days)),
    last_rating: "known",
  };
}

export function initialWordSrsSchedule(): WordSrsScheduleState {
  return {
    reps: 0,
    ease: DEFAULT_EASE,
    interval_days: 0,
  };
}
