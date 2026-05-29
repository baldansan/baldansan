import type { GameType } from "@/lib/games/game-types";

export type GameResult = {
  gameType: GameType;
  lessonId: string;
  score: number;
  correct: number;
  total: number;
  accuracy: number;
  playedAt: string;
};

const STORAGE_KEY = "buunduu-game-results-v1";
const MAX_RESULTS = 200;

function readResults(): GameResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as GameResult[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeResults(results: GameResult[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(results.slice(-MAX_RESULTS))
    );
  } catch {
    // ignore quota errors
  }
}

export function saveGameResult(result: GameResult): void {
  const results = readResults();
  results.push(result);
  writeResults(results);
}

export function getRecentGameResults(limit = 20): GameResult[] {
  return readResults()
    .slice(-limit)
    .reverse();
}

export function getBestScore(gameType: GameType, lessonId: string): number {
  const matches = readResults().filter(
    (r) => r.gameType === gameType && r.lessonId === lessonId
  );
  if (matches.length === 0) return 0;
  return Math.max(...matches.map((r) => r.score));
}

export function getGameStats(): {
  played: number;
  bestScore: number;
  avgAccuracy: number;
} {
  const results = readResults();
  if (results.length === 0) {
    return { played: 0, bestScore: 0, avgAccuracy: 0 };
  }
  const bestScore = Math.max(...results.map((r) => r.score));
  const avgAccuracy = Math.round(
    results.reduce((sum, r) => sum + r.accuracy, 0) / results.length
  );
  return { played: results.length, bestScore, avgAccuracy };
}
