import {
  wordMatchesActiveHskLevel,
  type ActiveHskLevel,
} from "@/lib/hsk/active-hsk-level";

function parseCatalogLevelNumber(
  value: string | number | null | undefined
): number | null {
  if (value == null) return null;
  if (value === "7-9") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 6 ? n : null;
}
import { applyWordSrsRating } from "@/lib/srs/word-srs-scheduler";
import {
  DAILY_SRS_GOAL,
  type WordSrsQueueItem,
  type WordSrsRating,
  type WordSrsRow,
} from "@/lib/srs/word-srs-types";
import type { HskWordRow } from "@/lib/supabase/hsk-words";

const STORAGE_KEY = "buunduu-word-srs-local";
const SESSION_KEY = "buunduu-word-srs-session";

type LocalSrsStore = {
  rows: Record<string, WordSrsRow>;
  favorites: number[];
};

function readStore(): LocalSrsStore {
  if (typeof window === "undefined") {
    return { rows: {}, favorites: [] };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { rows: {}, favorites: [] };
    return JSON.parse(raw) as LocalSrsStore;
  } catch {
    return { rows: {}, favorites: [] };
  }
}

function writeStore(store: LocalSrsStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function srsKey(wordId: number): string {
  return String(wordId);
}

export function getLocalFavorites(): Set<number> {
  return new Set(readStore().favorites);
}

export function readLocalStudiedWordIds(): number[] {
  return Object.values(readStore().rows)
    .filter((r) => r.reps > 0)
    .map((r) => r.word_id);
}

export function countLocalStudiedAmong(wordIds: number[]): number {
  const studied = new Set(readLocalStudiedWordIds());
  return wordIds.filter((id) => studied.has(id)).length;
}

export function toggleLocalFavorite(wordId: number): boolean {
  const store = readStore();
  const set = new Set(store.favorites);
  if (set.has(wordId)) {
    set.delete(wordId);
  } else {
    set.add(wordId);
  }
  store.favorites = [...set];
  writeStore(store);
  return set.has(wordId);
}

export function buildLocalQueue(
  words: HskWordRow[],
  activeLevel: ActiveHskLevel,
  dailyGoal = DAILY_SRS_GOAL
): WordSrsQueueItem[] {
  const store = readStore();
  const now = Date.now();
  const filtered = words.filter(
    (w) => wordMatchesActiveHskLevel(activeLevel, w) && !w.is_function_word
  );

  const due: WordSrsQueueItem[] = [];
  for (const word of filtered) {
    if (!word.id) continue;
    const row = store.rows[srsKey(word.id)];
    if (row && new Date(row.due_at).getTime() <= now) {
      due.push({ srs: row, word, isNew: row.reps === 0 });
    }
  }

  due.sort(
    (a, b) =>
      new Date(a.srs!.due_at).getTime() - new Date(b.srs!.due_at).getTime()
  );

  const sessionForgot = readSessionForgot();
  const forgotItems: WordSrsQueueItem[] = [];
  for (const wordId of sessionForgot) {
    const word = filtered.find((w) => w.id === wordId);
    if (word) {
      forgotItems.push({
        srs: store.rows[srsKey(wordId)] ?? null,
        word,
        isNew: false,
      });
    }
  }

  const merged = [...forgotItems, ...due.filter((d) => !sessionForgot.has(d.word.id!))];
  const unique = new Map<number, WordSrsQueueItem>();
  for (const item of merged) {
    if (item.word.id) unique.set(item.word.id, item);
  }

  const queue = [...unique.values()].slice(0, dailyGoal);
  const remaining = dailyGoal - queue.length;
  if (remaining <= 0) return queue;

  const studied = new Set(Object.keys(store.rows).map(Number));
  const fresh = filtered
    .filter((w) => w.id && !studied.has(w.id) && !unique.has(w.id))
    .slice(0, remaining);

  for (const word of fresh) {
    queue.push({ srs: null, word, isNew: true });
  }

  return queue;
}

function readSessionForgot(): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as number[]);
  } catch {
    return new Set();
  }
}

function writeSessionForgot(ids: Set<number>) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify([...ids]));
}

export function rateLocalWordSrs(
  wordId: number,
  rating: WordSrsRating,
  existing: WordSrsRow | null
): WordSrsRow {
  const store = readStore();
  const key = srsKey(wordId);
  const base = existing ?? store.rows[key] ?? null;

  const update = applyWordSrsRating(
    base
      ? {
          reps: base.reps,
          ease: base.ease,
          interval_days: base.interval_days,
        }
      : { reps: 0, ease: 2.5, interval_days: 0 },
    rating
  );

  const row: WordSrsRow = {
    id: base?.id ?? `local-${wordId}`,
    user_id: "local",
    word_id: wordId,
    reps: update.reps,
    ease: update.ease,
    interval_days: update.interval_days,
    due_at: update.due_at.toISOString(),
    last_rating: update.last_rating,
  };

  store.rows[key] = row;
  writeStore(store);

  const forgot = readSessionForgot();
  if (rating === "forgot") {
    forgot.add(wordId);
  } else {
    forgot.delete(wordId);
  }
  writeSessionForgot(forgot);

  return row;
}

export function getLocalWordSrsStats(
  levelTotals: Record<number, number>,
  studiedWordLevels: Map<number, number>
): {
  studiedCount: number;
  dueToday: number;
  dailyDone: number;
  dailyGoal: number;
  accuracyPct: number;
  hskProgress: { level: number; studied: number; total: number }[];
} {
  const store = readStore();
  const rows = Object.values(store.rows);
  const now = Date.now();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const studiedCount = rows.filter((r) => r.reps > 0).length;
  const dueToday = rows.filter((r) => new Date(r.due_at).getTime() <= now).length;
  const dailyDone = rows.filter((r) => {
    if (r.reps <= 0) return false;
    return new Date(r.due_at).getTime() >= todayStart.getTime();
  }).length;
  const knownTotal = rows.filter((r) => r.last_rating === "known").length;
  const ratedTotal = rows.filter((r) => r.last_rating != null).length;
  const accuracyPct =
    ratedTotal > 0 ? Math.round((knownTotal / ratedTotal) * 100) : 0;

  const studiedByLevel = new Map<number, number>();

  for (const row of rows) {
    if (row.reps <= 0) continue;
    const level = studiedWordLevels.get(row.word_id);
    if (level == null) continue;
    studiedByLevel.set(level, (studiedByLevel.get(level) ?? 0) + 1);
  }

  return {
    studiedCount,
    dueToday,
    dailyDone: Math.min(dailyDone, DAILY_SRS_GOAL),
    dailyGoal: DAILY_SRS_GOAL,
    accuracyPct,
    hskProgress: [1, 2, 3, 4, 5, 6].map((level) => ({
      level,
      studied: studiedByLevel.get(level) ?? 0,
      total: levelTotals[level] ?? 0,
    })),
  };
}
