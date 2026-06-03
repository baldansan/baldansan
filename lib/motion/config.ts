/** Shared motion timings — calm, mobile-first. */
export const MOTION = {
  duration: {
    fast: 0.12,
    normal: 0.2,
    flip: 0.3,
    progress: 0.45,
    count: 0.5,
  },
  ease: {
    standard: [0.2, 0, 0, 1] as const,
    out: [0, 0, 0.2, 1] as const,
  },
  distance: {
    slideUp: 8,
  },
  press: {
    buttonScale: 0.97,
    cardScale: 0.985,
    cardLift: -2,
  },
  shake: {
    x: [-6, 6, -4, 4, -2, 2, 0] as number[],
  },
} as const;

export function motionDuration(
  seconds: number,
  reducedMotion: boolean | null
): number {
  if (reducedMotion) return 0;
  return seconds;
}
