/** Light haptic feedback — no-op when unsupported or reduced motion preferred. */

export function canVibrate(): boolean {
  return typeof navigator !== "undefined" && "vibrate" in navigator;
}

export function lightHaptic(pattern: number | number[] = 12): void {
  if (!canVibrate()) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // ignore
  }
}

export function successHaptic(): void {
  lightHaptic([10, 40, 10]);
}

export function errorHaptic(): void {
  lightHaptic(8);
}
