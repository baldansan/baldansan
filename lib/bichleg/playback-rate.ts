/** User-facing speed cycle on /bichleg (feed-level preference). */
export const BICHLEG_SPEED_CYCLE = [1, 0.75, 0.5] as const;

export type BichlegPreferredSpeed = (typeof BICHLEG_SPEED_CYCLE)[number];

export function nextBichlegSpeed(
  current: BichlegPreferredSpeed
): BichlegPreferredSpeed {
  const index = BICHLEG_SPEED_CYCLE.indexOf(current);
  return BICHLEG_SPEED_CYCLE[(index + 1) % BICHLEG_SPEED_CYCLE.length]!;
}

export function formatPlaybackRateLabel(rate: number): string {
  if (Math.abs(rate - 1) < 0.001) return "1×";
  const rounded = Math.round(rate * 100) / 100;
  return `${rounded}×`;
}

export function resolveAvailablePlaybackRate(
  preferred: number,
  available: number[]
): number {
  const rates = available.filter((rate) => rate > 0);
  if (!rates.length) return preferred;

  const exact = rates.find((rate) => Math.abs(rate - preferred) < 0.001);
  if (exact != null) return exact;

  return rates.reduce((best, rate) =>
    Math.abs(rate - preferred) < Math.abs(best - preferred) ? rate : best
  );
}
