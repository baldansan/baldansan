/**
 * «Өдрийн аялгуу» (每日声调) — 3 минутын өдөр тутмын дасгал.
 * localStorage["buunduu-daily-tone-v1"] = { history: { "YYYY-MM-DD": score }, streak, best }
 */

export const DAILY_TONE_STORAGE_KEY = "buunduu-daily-tone-v1";
export const DAILY_TOTAL = 20;
export const DAILY_A = 8;
export const DAILY_B = 6;
export const DAILY_C = 4;
export const DAILY_D = 2;

export type DailyToneStore = {
  history: Record<string, number>;
  streak: number;
  best: number;
};

export const EMPTY_DAILY: DailyToneStore = { history: {}, streak: 0, best: 0 };

/** Орон нутгийн огноо YYYY-MM-DD */
export function dayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function dayOfYear(d: Date = new Date()): number {
  const start = new Date(d.getFullYear(), 0, 1);
  return Math.floor((d.getTime() - start.getTime()) / 86400000);
}

function shiftDay(key: string, delta: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, d + delta);
  return dayKey(dt);
}

/** Өнөөдрөөс (эсвэл өчигдрөөс) хойш дараалан тоглосон өдрийн тоо */
export function computeStreak(history: Record<string, number>, today: string = dayKey()): number {
  let cur = history[today] != null ? today : history[shiftDay(today, -1)] != null ? shiftDay(today, -1) : null;
  if (!cur) return 0;
  let n = 0;
  while (history[cur] != null) {
    n += 1;
    cur = shiftDay(cur, -1);
  }
  return n;
}

export function normalizeDaily(raw: Partial<DailyToneStore> | null | undefined): DailyToneStore {
  const history = raw?.history && typeof raw.history === "object" ? raw.history : {};
  return { history, streak: computeStreak(history), best: raw?.best ?? Math.max(0, ...Object.values(history)) };
}

/** Өнөөдрийн онооог бичнэ; өнөөдөр аль хэдийн тоглосон бол хамгийн сайныг үлдээнэ (streak өөрчлөгдөхгүй) */
export function recordDaily(store: DailyToneStore, score: number, today: string = dayKey()): DailyToneStore {
  const history = { ...store.history };
  history[today] = history[today] != null ? Math.max(history[today], score) : score;
  // 60 өдрөөс хуучныг хаяна
  const keys = Object.keys(history).sort();
  while (keys.length > 60) delete history[keys.shift()!];
  return { history, streak: computeStreak(history, today), best: Math.max(store.best, score) };
}

/** Тогтмол санамсаргүй тоо (mulberry32) — өдөр бүр ижил дараалал */
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

export function daySeed(d: Date = new Date(), salt = 0): number {
  return d.getFullYear() * 1000 + dayOfYear(d) + salt * 7919;
}

/** 16 бүхэл үе (整体认读音节) */
export const WHOLE_SYLLABLES = ["zhi", "chi", "shi", "ri", "zi", "ci", "si", "yi", "wu", "yu", "ye", "yue", "yuan", "yin", "yun", "ying"];
