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
 * SM-2-lite for HSK word SRS (per product spec):
 * - forgot: reps=0, interval=0 (~1 min), ease-=0.2 (floor 1.3)
 * - hard: interval*=1.2, ease-=0.15
 * - known: first reps→interval=4d, else interval*=ease; reps+=1
 * due_at = now + interval (days; forgot uses 1 minute)
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
      ease: Math.max(MIN_EASE, ease - 0.2),
      interval_days: 0,
      due_at: addMs(now, MINUTE_MS),
      last_rating: "forgot",
    };
  }

  if (rating === "hard") {
    ease = Math.max(MIN_EASE, ease - 0.15);
    // A new/reset card has interval 0 — multiplying keeps it permanently due.
    // "Hard" on a fresh card means "saw it, shaky": schedule 1 day out.
    interval_days = interval_days > 0 ? interval_days * 1.2 : 1;
    return {
      reps: reps + 1,
      ease,
      interval_days,
      due_at: addMs(now, intervalDaysToMs(interval_days)),
      last_rating: "hard",
    };
  }

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
