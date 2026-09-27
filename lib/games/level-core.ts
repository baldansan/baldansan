/**
 * «Үе давах» — 4 тоглоомын (arrange, match, translate, missing-word) хуваалцсан
 * үеийн хөдөлгүүр. Client-safe: төрөл + цэвэр функц + localStorage ахиц.
 *
 * Энэ файл: цэвэр хэсэг (сервер/клиент аль алинд нь). Ахиц → levels.ts.
 *
 * Үе n (1-ээс) → HSK түвшин + тухайн түвшний доторх дугаар. Түвшин бүрт
 * тодорхой тооны үе; түвшний дотор 5 дахь үе бүр болон сүүлийн үе нь
 * «⭐ Шалгалтын үе» (8 асуулт, ≥ 7 зөв бол давна).
 */

export type LevelGame = "arrange" | "match" | "translate" | "missing-word";

export const LEVEL_GAMES: LevelGame[] = ["arrange", "match", "translate", "missing-word"];

export function isLevelGame(value: string): value is LevelGame {
  return (LEVEL_GAMES as string[]).includes(value);
}

export type LevelHskBand = "1" | "2" | "3" | "4" | "5" | "6" | "7-9";

export const LEVELS_PER_HSK: Record<LevelHskBand, number> = {
  "1": 12,
  "2": 10,
  "3": 16,
  "4": 20,
  "5": 24,
  "6": 24,
  "7-9": 40,
};

export const HSK_BAND_ORDER: LevelHskBand[] = ["1", "2", "3", "4", "5", "6", "7-9"];

export const TOTAL_LEVELS = HSK_BAND_ORDER.reduce((sum, band) => sum + LEVELS_PER_HSK[band], 0);

/** Нэг үеийн дээд од — нийт боломжит од = TOTAL_LEVELS × 3. */
export const MAX_STARS_PER_LEVEL = 3;
export const TOTAL_STARS = TOTAL_LEVELS * MAX_STARS_PER_LEVEL;

export const NORMAL_QUESTIONS = 6;
export const BOSS_QUESTIONS = 8;
export const BOSS_PASS_CORRECT = 7;

/** Тоглоом бүрийн нэг үеийн үгийн цонх: match/translate 12 (сатааруулагч хэрэгтэй), arrange/missing-word 8. */
export const WINDOW_SIZE: Record<LevelGame, number> = {
  match: 12,
  translate: 12,
  arrange: 8,
  "missing-word": 8,
};

export type LevelMeta = {
  level: number;
  hskLevel: LevelHskBand;
  /** Түвшний доторх дугаар (1-ээс). */
  indexInLevel: number;
  /** Тухайн түвшний нийт үе. */
  levelsInBand: number;
  /** Энэ үеэс өмнөх энгийн (шалгалтын бус) үеийн тоо тухайн түвшинд — үгийн цонхны индекс. */
  windowIndex: number;
  isBoss: boolean;
  questions: number;
  /** Давахад шаардагдах хамгийн бага зөв хариулт. */
  passCorrect: number;
  title: string;
  subtitle: string;
};

export function isBossIndex(indexInLevel: number, levelsInBand: number): boolean {
  return indexInLevel % 5 === 0 || indexInLevel === levelsInBand;
}

export function clampLevel(n: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.min(TOTAL_LEVELS, Math.max(1, Math.floor(n)));
}

export function levelMeta(rawLevel: number): LevelMeta {
  const level = clampLevel(rawLevel);
  let remaining = level;
  let hskLevel: LevelHskBand = "7-9";
  for (const band of HSK_BAND_ORDER) {
    const count = LEVELS_PER_HSK[band];
    if (remaining <= count) {
      hskLevel = band;
      break;
    }
    remaining -= count;
  }
  const levelsInBand = LEVELS_PER_HSK[hskLevel];
  const indexInLevel = remaining;
  const isBoss = isBossIndex(indexInLevel, levelsInBand);
  let windowIndex = 0;
  for (let i = 1; i < indexInLevel; i += 1) {
    if (!isBossIndex(i, levelsInBand)) windowIndex += 1;
  }
  const questions = isBoss ? BOSS_QUESTIONS : NORMAL_QUESTIONS;
  const passCorrect = isBoss ? BOSS_PASS_CORRECT : Math.ceil(questions * 0.67);
  return {
    level,
    hskLevel,
    indexInLevel,
    levelsInBand,
    windowIndex,
    isBoss,
    questions,
    passCorrect,
    title: `Үе ${level}`,
    subtitle: `HSK ${hskLevel} · ${indexInLevel}/${levelsInBand}`,
  };
}

/** Түвшний эхний үеийн дугаар (1-ээс). */
export function firstLevelOfBand(band: LevelHskBand): number {
  let start = 1;
  for (const b of HSK_BAND_ORDER) {
    if (b === band) return start;
    start += LEVELS_PER_HSK[b];
  }
  return start;
}

/** Од: зөв/нийт ≥ 1 → 3, ≥ 0.83 → 2, ≥ 0.67 → 1, бусад → 0. Шалгалтын үе: ≥ 7/8 давна. */
export function starsFor(correct: number, total: number, isBoss = false): number {
  if (total <= 0) return 0;
  if (isBoss) {
    if (correct >= total) return 3;
    if (correct >= BOSS_PASS_CORRECT) return 2;
    return 0;
  }
  const ratio = correct / total;
  if (ratio >= 1) return 3;
  if (ratio >= 0.83) return 2;
  if (ratio >= 0.67) return 1;
  return 0;
}

export function isPassed(correct: number, total: number, isBoss = false): boolean {
  return starsFor(correct, total, isBoss) >= 1;
}

/** XP: зөв × 10, шалгалтын үе ×2. */
export function levelXp(correct: number, isBoss = false): number {
  return correct * 10 * (isBoss ? 2 : 1);
}

// ---------- Тодорхойлогдсон (seeded) холих ----------

/** mulberry32 — жижиг, тогтвортой PRNG. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededShuffle<T>(items: T[], seed: number): T[] {
  const copy = [...items];
  const rand = seededRandom(seed);
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Тоглоом + үеийн дугаараас нэг seed. */
export function levelSeed(game: LevelGame, level: number): number {
  const gameIndex = LEVEL_GAMES.indexOf(game) + 1;
  return level * 1000 + gameIndex * 7919;
}

/** Тоглоомын клиентэд дамжуулах үеийн горим (level-game-host → *-game-client). */
export type LevelMode = {
  level: number;
  /** Асуултын тоо (энгийн 6, шалгалтын 8). */
  total: number;
  meta: LevelMeta;
  /** Энэ тоглоомын нийт од — header-ийн тооллого. */
  gameStars: number;
  onFinished: (correct: number, total: number) => void;
  onNextLevel: () => void;
  /** Үеийн газрын зураг руу. */
  mapHref: string;
};

export function levelMapHref(game: LevelGame): string {
  return `/games/${game}/levels`;
}

export function levelPlayHref(game: LevelGame, level: number): string {
  return `/games/${game}?level=${level}`;
}

/** GameHeader-ийн `level` prop — «Үе 7 · HSK 2», од, шалгалтын badge. */
export function levelHeaderInfo(mode: LevelMode): { label: string; stars: number; boss: boolean } {
  return {
    label: `${mode.meta.title} · HSK ${mode.meta.hskLevel}`,
    stars: mode.gameStars,
    boss: mode.meta.isBoss,
  };
}

/** Шалгалтын үеийн дэвсгэр өнгө (GameShell mainClassName). */
export function levelShellClass(mode?: LevelMode): string {
  return mode?.meta.isBoss ? "level-boss-shell" : "";
}
