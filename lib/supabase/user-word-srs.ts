import {
  activeLevelMatchesNumeric,
  type ActiveHskLevel,
} from "@/lib/hsk/active-hsk-level";
import { applyWordSrsRating } from "@/lib/srs/word-srs-scheduler";
import {
  DAILY_SRS_GOAL,
  type WordSrsQueueItem,
  type WordSrsRating,
  type WordSrsRow,
} from "@/lib/srs/word-srs-types";
import type { HskWordRow } from "@/lib/supabase/hsk-words";
import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";

const WORD_SELECT =
  "id, simplified, traditional, pinyin, pos, radical, frequency, hsk_level, meaning_mn, example_zh, example_pinyin, example_mn";

export type UserWordSrsStats = {
  studiedCount: number;
  dueToday: number;
  dailyDone: number;
  dailyGoal: number;
  accuracyPct: number;
  hskProgress: { level: number; studied: number; total: number }[];
};

function wordRowFromJoin(row: Record<string, unknown>): HskWordRow | null {
  const word = row.hsk_words as HskWordRow | HskWordRow[] | null | undefined;
  if (!word) return null;
  if (Array.isArray(word)) return word[0] ?? null;
  return word;
}

export async function getDueWordQueue(
  userId: string,
  activeLevel: ActiveHskLevel,
  dailyGoal = DAILY_SRS_GOAL
): Promise<{ items: WordSrsQueueItem[]; error: string | null }> {
  if (!supabase || !hasSupabaseConfig) {
    return { items: [], error: "Supabase тохиргоо байхгүй." };
  }

  const nowIso = new Date().toISOString();

  const { data: dueRows, error: dueError } = await supabase
    .from("user_word_srs")
    .select(`*, hsk_words (${WORD_SELECT})`)
    .eq("user_id", userId)
    .lte("due_at", nowIso)
    .order("due_at", { ascending: true })
    .limit(dailyGoal);

  if (dueError) {
    return { items: [], error: dueError.message };
  }

  const dueItems: WordSrsQueueItem[] = [];
  for (const row of dueRows ?? []) {
    const word = wordRowFromJoin(row as Record<string, unknown>);
    if (
      !word?.id ||
      word.hsk_level == null ||
      !activeLevelMatchesNumeric(activeLevel, word.hsk_level)
    ) {
      continue;
    }
    dueItems.push({
      srs: row as WordSrsRow,
      word,
      isNew: (row as WordSrsRow).reps === 0,
    });
  }

  const remaining = Math.max(0, dailyGoal - dueItems.length);
  if (remaining === 0) {
    return { items: dueItems, error: null };
  }

  const { data: studiedIds, error: studiedError } = await supabase
    .from("user_word_srs")
    .select("word_id")
    .eq("user_id", userId);

  if (studiedError) {
    return { items: dueItems, error: studiedError.message };
  }

  const exclude = new Set((studiedIds ?? []).map((r) => r.word_id as number));

  const { data: candidates, error: candError } = await supabase
    .from("hsk_words")
    .select(WORD_SELECT)
    .order("frequency", { ascending: true, nullsFirst: false })
    .limit(500);

  if (candError) {
    return { items: dueItems, error: candError.message };
  }

  const newWords = ((candidates ?? []) as HskWordRow[])
    .filter(
      (w) =>
        w.id != null &&
        !exclude.has(w.id) &&
        w.hsk_level != null &&
        activeLevelMatchesNumeric(activeLevel, w.hsk_level)
    )
    .slice(0, remaining);

  for (const word of newWords) {
    dueItems.push({ srs: null, word, isNew: true });
  }

  return { items: dueItems, error: null };
}

export async function rateWordSrs(
  userId: string,
  wordId: number,
  rating: WordSrsRating,
  existing: WordSrsRow | null
): Promise<{ data: WordSrsRow | null; error: string | null }> {
  if (!supabase || !hasSupabaseConfig) {
    return { data: null, error: "Supabase тохиргоо байхгүй." };
  }

  const base = existing ?? {
    reps: 0,
    ease: 2.5,
    interval_days: 0,
  };

  const update = applyWordSrsRating(
    {
      reps: base.reps,
      ease: base.ease,
      interval_days: base.interval_days,
    },
    rating
  );

  const payload = {
    user_id: userId,
    word_id: wordId,
    reps: update.reps,
    ease: update.ease,
    interval_days: update.interval_days,
    due_at: update.due_at.toISOString(),
    last_rating: update.last_rating,
  };

  const { data, error } = await supabase
    .from("user_word_srs")
    .upsert(payload, { onConflict: "user_id,word_id" })
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as WordSrsRow, error: null };
}

export async function getUserWordSrsStats(
  userId: string
): Promise<{ data: UserWordSrsStats | null; error: string | null }> {
  if (!supabase || !hasSupabaseConfig) {
    return { data: null, error: "Supabase тохиргоо байхгүй." };
  }

  const nowIso = new Date().toISOString();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data: srsRows, error: srsError } = await supabase
    .from("user_word_srs")
    .select("reps, due_at, last_rating, word_id, hsk_words (hsk_level)")
    .eq("user_id", userId);

  if (srsError) {
    return { data: null, error: srsError.message };
  }

  const rows = srsRows ?? [];
  const studiedCount = rows.filter((r) => (r.reps as number) > 0).length;
  const dueToday = rows.filter(
    (r) => new Date(r.due_at as string) <= new Date()
  ).length;

  const ratedToday = rows.filter((r) => {
    const due = new Date(r.due_at as string);
    return due >= todayStart && (r.reps as number) > 0;
  }).length;

  const knownToday = rows.filter(
    (r) =>
      r.last_rating === "known" &&
      new Date(r.due_at as string) > new Date(nowIso)
  ).length;
  const totalRated = rows.filter((r) => r.last_rating != null).length;
  const knownTotal = rows.filter((r) => r.last_rating === "known").length;
  const accuracyPct =
    totalRated > 0 ? Math.round((knownTotal / totalRated) * 100) : 0;

  const studiedByLevel = new Map<number, number>();
  for (const row of rows) {
    if ((row.reps as number) <= 0) continue;
    const word = row.hsk_words as { hsk_level?: number | null } | null;
    const level = word?.hsk_level;
    if (level == null || level < 1 || level > 6) continue;
    studiedByLevel.set(level, (studiedByLevel.get(level) ?? 0) + 1);
  }

  const { data: levelCounts, error: levelError } = await supabase
    .from("hsk_words")
    .select("hsk_level")
    .not("hsk_level", "is", null);

  if (levelError) {
    return { data: null, error: levelError.message };
  }

  const totalByLevel = new Map<number, number>();
  for (const row of levelCounts ?? []) {
    const level = row.hsk_level as number;
    if (level >= 1 && level <= 6) {
      totalByLevel.set(level, (totalByLevel.get(level) ?? 0) + 1);
    }
  }

  const hskProgress = [1, 2, 3, 4, 5, 6].map((level) => ({
    level,
    studied: studiedByLevel.get(level) ?? 0,
    total: totalByLevel.get(level) ?? 0,
  }));

  return {
    data: {
      studiedCount,
      dueToday,
      dailyDone: Math.min(ratedToday, DAILY_SRS_GOAL),
      dailyGoal: DAILY_SRS_GOAL,
      accuracyPct,
      hskProgress,
    },
    error: null,
  };
}
