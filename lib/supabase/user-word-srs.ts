import {
  activeLevelToCatalogLevel,
  type ActiveHskLevel,
} from "@/lib/hsk/active-hsk-level";
import { applyWordSrsRating } from "@/lib/srs/word-srs-scheduler";
import {
  DAILY_SRS_GOAL,
  type WordSrsQueueItem,
  type WordSrsRating,
  type WordSrsRow,
} from "@/lib/srs/word-srs-types";
import {
  fetchHskLevelTotals,
  type HskWordRow,
} from "@/lib/supabase/hsk-words";
import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";

const WORD_SELECT =
  "id, simplified, traditional, pinyin, pos, radical, frequency, hsk_level, meaning_mn, example_zh, example_pinyin, example_mn";

function parseCatalogLevel(value: string | null | undefined): number | null {
  if (!value) return null;
  if (value === "7-9") return null;
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 6 ? n : null;
}

type FetchWordsByIdsOptions = {
  catalogLevel?: string;
  select?: string;
  /** When true, omit grammatical particles (SRS-eligible words only). */
  srsEligibleOnly?: boolean;
};

async function fetchWordsByIds(
  wordIds: number[],
  options: FetchWordsByIdsOptions = {}
): Promise<Map<number, HskWordRow>> {
  const {
    catalogLevel,
    select = WORD_SELECT,
    srsEligibleOnly = false,
  } = options;
  const map = new Map<number, HskWordRow>();
  if (wordIds.length === 0 || !supabase) return map;

  const unique = [...new Set(wordIds)];
  for (let i = 0; i < unique.length; i += 200) {
    const chunk = unique.slice(i, i + 200);
    let query = supabase.from("hsk_words").select(select).in("id", chunk);
    if (catalogLevel) {
      query = query.eq("hsk_level", catalogLevel);
    }
    if (srsEligibleOnly) {
      query = query.eq("is_function_word", false);
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    for (const row of (data ?? []) as unknown as HskWordRow[]) {
      if (row.id != null) map.set(row.id, row);
    }
  }
  return map;
}

export type UserWordSrsStats = {
  studiedCount: number;
  dueToday: number;
  dailyDone: number;
  dailyGoal: number;
  accuracyPct: number;
  hskProgress: { level: number; studied: number; total: number }[];
};

export async function getDueWordQueue(
  userId: string,
  activeLevel: ActiveHskLevel,
  dailyGoal = DAILY_SRS_GOAL
): Promise<{ items: WordSrsQueueItem[]; error: string | null }> {
  if (!supabase || !hasSupabaseConfig) {
    return { items: [], error: "Supabase тохиргоо байхгүй." };
  }

  const nowIso = new Date().toISOString();
  const catalogLevel = activeLevelToCatalogLevel(activeLevel);

  const { data: dueRows, error: dueError } = await supabase
    .from("user_word_srs")
    .select("*")
    .eq("user_id", userId)
    .lte("due_at", nowIso)
    .order("due_at", { ascending: true })
    .limit(dailyGoal * 15);

  if (dueError) {
    return { items: [], error: dueError.message };
  }

  const srsRows = (dueRows ?? []) as WordSrsRow[];
  let wordMap: Map<number, HskWordRow>;

  try {
    wordMap = await fetchWordsByIds(srsRows.map((r) => r.word_id), {
      catalogLevel,
      srsEligibleOnly: true,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Үг татахад алдаа";
    return { items: [], error: message };
  }

  const dueItems: WordSrsQueueItem[] = [];
  for (const row of srsRows) {
    const word = wordMap.get(row.word_id);
    if (!word?.id) continue;
    dueItems.push({
      srs: row,
      word,
      isNew: row.reps === 0,
    });
    if (dueItems.length >= dailyGoal) break;
  }

  const remaining = Math.max(0, dailyGoal - dueItems.length);
  if (remaining === 0) {
    return { items: dueItems, error: null };
  }

  const { data: studiedIds, error: studiedError } = await supabase
    .from("user_word_srs")
    .select("word_id")
    .eq("user_id", userId)
    .limit(4000);

  if (studiedError) {
    return { items: dueItems, error: studiedError.message };
  }

  const exclude = new Set((studiedIds ?? []).map((r) => r.word_id as number));

  const { data: candidates, error: candError } = await supabase
    .from("hsk_words")
    .select(WORD_SELECT)
    .eq("hsk_level", catalogLevel)
    .eq("is_function_word", false)
    .order("frequency", { ascending: true, nullsFirst: false })
    .limit(500);

  if (candError) {
    return { items: dueItems, error: candError.message };
  }

  const newWords = ((candidates ?? []) as HskWordRow[])
    .filter((w) => w.id != null && !exclude.has(w.id))
    .slice(0, remaining);

  for (const word of newWords) {
    dueItems.push({ srs: null, word, isNew: true });
  }

  return { items: dueItems, error: null };
}

/** New-word SRS row (reps=0, due now) — same defaults as first rating base. */
export async function ensureInitialWordSrs(
  userId: string,
  wordId: number
): Promise<{ created: boolean; error: string | null }> {
  if (!supabase || !hasSupabaseConfig) {
    return { created: false, error: "Supabase тохиргоо байхгүй." };
  }

  const { data: existing, error: readError } = await supabase
    .from("user_word_srs")
    .select("id")
    .eq("user_id", userId)
    .eq("word_id", wordId)
    .maybeSingle();

  if (readError) {
    return { created: false, error: readError.message };
  }
  if (existing) {
    return { created: false, error: null };
  }

  const { data: wordRow, error: wordError } = await supabase
    .from("hsk_words")
    .select("is_function_word")
    .eq("id", wordId)
    .maybeSingle();

  if (wordError) {
    return { created: false, error: wordError.message };
  }
  if (wordRow?.is_function_word) {
    return { created: false, error: null };
  }

  const { error: insertError } = await supabase.from("user_word_srs").insert({
    user_id: userId,
    word_id: wordId,
    reps: 0,
    ease: 2.5,
    interval_days: 0,
    due_at: new Date().toISOString(),
    last_rating: null,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return { created: false, error: null };
    }
    return { created: false, error: insertError.message };
  }

  return { created: true, error: null };
}

export type SrsWordListItem = {
  srs: WordSrsRow;
  word: HskWordRow;
  fromBichleg: boolean;
};

export async function getUserSrsWordList(
  userId: string,
  filter: "all" | "bichleg" = "all"
): Promise<{ items: SrsWordListItem[]; error: string | null }> {
  if (!supabase || !hasSupabaseConfig) {
    return { items: [], error: "Supabase тохиргоо байхгүй." };
  }

  const { fetchBichlegHskWordIds } = await import("@/lib/supabase/saved-words");
  const bichlegIds = await fetchBichlegHskWordIds(userId);

  const { data: srsRows, error: srsError } = await supabase
    .from("user_word_srs")
    .select("*")
    .eq("user_id", userId)
    .order("due_at", { ascending: true })
    .limit(5000);

  if (srsError) {
    return { items: [], error: srsError.message };
  }

  const rows = (srsRows ?? []) as WordSrsRow[];
  if (rows.length === 0) {
    return { items: [], error: null };
  }

  let wordMap: Map<number, HskWordRow>;
  try {
    wordMap = await fetchWordsByIds(rows.map((r) => r.word_id), {
      srsEligibleOnly: true,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Үг татахад алдаа";
    return { items: [], error: message };
  }

  const items: SrsWordListItem[] = [];
  for (const srs of rows) {
    const word = wordMap.get(srs.word_id);
    if (!word?.id) continue;
    const fromBichleg = bichlegIds.has(srs.word_id);
    if (filter === "bichleg" && !fromBichleg) continue;
    items.push({ srs, word, fromBichleg });
  }

  return { items, error: null };
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

/** How many of the given word ids have reps > 0 for this user. */
export async function countStudiedAmongWordIds(
  userId: string,
  wordIds: number[]
): Promise<{ count: number; error: string | null }> {
  if (!supabase || !hasSupabaseConfig) {
    return { count: 0, error: "Supabase тохиргоо байхгүй." };
  }
  if (wordIds.length === 0) {
    return { count: 0, error: null };
  }

  const unique = [...new Set(wordIds)];
  let count = 0;

  for (let i = 0; i < unique.length; i += 200) {
    const chunk = unique.slice(i, i + 200);
    const { data, error } = await supabase
      .from("user_word_srs")
      .select("word_id")
      .eq("user_id", userId)
      .gt("reps", 0)
      .in("word_id", chunk);

    if (error) {
      return { count: 0, error: error.message };
    }
    count += (data ?? []).length;
  }

  return { count, error: null };
}

export async function getUserWordSrsStats(
  userId: string
): Promise<{ data: UserWordSrsStats | null; error: string | null }> {
  if (!supabase || !hasSupabaseConfig) {
    return { data: null, error: "Supabase тохиргоо байхгүй." };
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data: srsRows, error: srsError } = await supabase
    .from("user_word_srs")
    .select("reps, due_at, last_rating, word_id, updated_at")
    .eq("user_id", userId)
    .limit(5000);

  if (srsError) {
    return { data: null, error: srsError.message };
  }

  const rows = srsRows ?? [];
  const studiedCount = rows.filter((r) => (r.reps as number) > 0).length;
  const dueToday = rows.filter(
    (r) => new Date(r.due_at as string) <= new Date()
  ).length;

  const ratedToday = rows.filter((r) => {
    const updated = r.updated_at ? new Date(r.updated_at as string) : null;
    return (
      updated != null && updated >= todayStart && r.last_rating != null
    );
  }).length;

  const totalRated = rows.filter((r) => r.last_rating != null).length;
  const knownTotal = rows.filter((r) => r.last_rating === "known").length;
  const accuracyPct =
    totalRated > 0 ? Math.round((knownTotal / totalRated) * 100) : 0;

  const studiedByLevel = new Map<number, number>();
  const studiedWordIds = rows
    .filter((r) => (r.reps as number) > 0)
    .map((r) => r.word_id as number);

  try {
    const wordMap = await fetchWordsByIds(studiedWordIds, {
      select: "id, hsk_level",
    });
    for (const row of rows) {
      if ((row.reps as number) <= 0) continue;
      const word = wordMap.get(row.word_id as number);
      const level = parseCatalogLevel(word?.hsk_level as string | undefined);
      if (level == null) continue;
      studiedByLevel.set(level, (studiedByLevel.get(level) ?? 0) + 1);
    }
  } catch {
    // stats degrade gracefully without level breakdown
  }

  const { totals: levelTotals, error: levelError } =
    await fetchHskLevelTotals();

  if (levelError) {
    return { data: null, error: levelError };
  }

  const totalByLevel = new Map<number, number>(Object.entries(levelTotals).map(
    ([level, total]) => [Number(level), total]
  ));

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
