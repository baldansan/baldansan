import { checkPublicRateLimit } from "@/lib/api/public-rate-limit";

const DECK_RATE = { max: 40, windowMs: 60_000, keyPrefix: "games-deck" } as const;
const PRACTICE_RATE = {
  max: 30,
  windowMs: 60_000,
  keyPrefix: "review-practice",
} as const;

export function guardGamesDeckRoute(request: Request): Response | null {
  return checkPublicRateLimit(request, DECK_RATE);
}

export function guardReviewPracticeRoute(request: Request): Response | null {
  return checkPublicRateLimit(request, PRACTICE_RATE);
}
