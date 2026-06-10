const STORAGE_KEY = "buunduu-daily-challenge-v1";

export type DailyChallengeResult = {
  date: string;
  score: number;
  correct: number;
  total: number;
  completedAt: string;
};

function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function readStore(): DailyChallengeResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DailyChallengeResult;
  } catch {
    return null;
  }
}

function writeStore(result: DailyChallengeResult) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
}

export function getDailyChallengeState(): DailyChallengeResult | null {
  const stored = readStore();
  if (!stored || stored.date !== todayKey()) return null;
  return stored;
}

export function canPlayDailyChallenge(): boolean {
  return getDailyChallengeState() === null;
}

export function saveDailyChallengeResult(
  score: number,
  correct: number,
  total: number
): DailyChallengeResult {
  const result: DailyChallengeResult = {
    date: todayKey(),
    score,
    correct,
    total,
    completedAt: new Date().toISOString(),
  };
  writeStore(result);
  return result;
}
