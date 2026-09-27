/**
 * «Үе давах» — хуваалцсан үеийн хөдөлгүүр (client): цэвэр функцүүдийг
 * level-core.ts-ээс дахин экспортолж, localStorage ахицыг энд хадгална.
 */
import { saveGameResult } from "@/lib/games/game-progress";
import {
  LEVEL_GAMES,
  TOTAL_LEVELS,
  levelMeta,
  levelXp,
  starsFor,
  type LevelGame,
} from "@/lib/games/level-core";

export * from "@/lib/games/level-core";

// ---------- Ахиц (localStorage) ----------

export type LevelResult = {
  stars: number;
  /** Хамгийн сайн зөв хариултын тоо. */
  best: number;
  attempts: number;
  /** ISO огноо — сүүлд тоглосон. */
  at: string;
};

export type GameLevelProgress = Record<string, LevelResult>;
export type AllLevelProgress = Partial<Record<LevelGame, GameLevelProgress>>;

export const LEVEL_STORAGE_KEY = "buunduu-game-levels-v1";

function readAll(): AllLevelProgress {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LEVEL_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as AllLevelProgress;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(data: AllLevelProgress): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LEVEL_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // quota — үл тоох
  }
}

export function getLevelProgress(game: LevelGame): GameLevelProgress {
  return readAll()[game] ?? {};
}

/** Одоогийн үе — 0 одтой эхний үе (бүгд давсан бол сүүлийн үе). */
export function currentLevel(game: LevelGame): number {
  const progress = getLevelProgress(game);
  for (let n = 1; n <= TOTAL_LEVELS; n += 1) {
    if ((progress[String(n)]?.stars ?? 0) <= 0) return n;
  }
  return TOTAL_LEVELS;
}

export function totalStars(game: LevelGame): number {
  const progress = getLevelProgress(game);
  return Object.values(progress).reduce((sum, r) => sum + (r?.stars ?? 0), 0);
}

export function totalStarsAllGames(): number {
  return LEVEL_GAMES.reduce((sum, game) => sum + totalStars(game), 0);
}

/** Үе n тоглож болох уу — одоогийн үе хүртэл (түүнийг оруулаад). */
export function isLevelUnlocked(game: LevelGame, level: number): boolean {
  return level <= currentLevel(game);
}

export type SavedLevelResult = LevelResult & {
  stars: number;
  passed: boolean;
  xp: number;
  /** Энэ оролдлогын од (best биш). */
  earnedStars: number;
};

export function saveLevelResult(
  game: LevelGame,
  level: number,
  correct: number,
  total: number
): SavedLevelResult {
  const meta = levelMeta(level);
  const earnedStars = starsFor(correct, total, meta.isBoss);
  const all = readAll();
  const gameProgress = all[game] ?? {};
  const prev = gameProgress[String(level)];
  const next: LevelResult = {
    stars: Math.max(prev?.stars ?? 0, earnedStars),
    best: Math.max(prev?.best ?? 0, correct),
    attempts: (prev?.attempts ?? 0) + 1,
    at: new Date().toISOString(),
  };
  gameProgress[String(level)] = next;
  all[game] = gameProgress;
  writeAll(all);

  // Хуучин dashboard-ууд ажилласаар байхын тулд нийт үр дүнд ч хадгална.
  const xp = levelXp(correct, meta.isBoss);
  saveGameResult({
    gameType: game,
    lessonId: `level-${level}`,
    score: xp,
    correct,
    total,
    accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
    playedAt: next.at,
  });

  return { ...next, earnedStars, passed: earnedStars >= 1, xp };
}

/** Тоглоом бүрийн одоогийн үе + од (hub-д). */
export function levelSummary(game: LevelGame): { current: number; stars: number } {
  return { current: currentLevel(game), stars: totalStars(game) };
}

/** Хамгийн бага одоогийн үетэй тоглоом (hub-ийн онцлох карт). */
export function lowestCurrentLevelGame(): LevelGame {
  let best: LevelGame = LEVEL_GAMES[0];
  let bestLevel = Number.POSITIVE_INFINITY;
  for (const game of LEVEL_GAMES) {
    const n = currentLevel(game);
    if (n < bestLevel) {
      bestLevel = n;
      best = game;
    }
  }
  return best;
}
