import {
  activeLevelToCatalogLevel,
  type ActiveHskLevel,
} from "@/lib/hsk/active-hsk-level";
import type { HskWord } from "@/lib/hsk";
import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";

/** @deprecated Prefer HskWord from @/lib/hsk — kept for client components. */
export type HskWordRow = HskWord & {
  id?: number;
  hsk_level?: string | number | null;
};

const WORD_SELECT =
  "id, simplified, traditional, pinyin, pos, radical, frequency, hsk_level, hsk_old, meaning_en, meaning_mn, example_zh, example_pinyin, example_mn";

export type FetchHskWordsOptions = {
  /** Cap rows for guest/review pools — skips full-level downloads. */
  limit?: number;
};

export async function fetchHskWordsByLevel(
  activeLevel: ActiveHskLevel,
  options?: FetchHskWordsOptions
): Promise<{ data: HskWordRow[]; error: string | null }> {
  if (!supabase || !hasSupabaseConfig) {
    return { data: [], error: "Supabase тохиргоо байхгүй." };
  }

  const catalogLevel = activeLevelToCatalogLevel(activeLevel);

  let query = supabase
    .from("hsk_words")
    .select(WORD_SELECT)
    .eq("hsk_level", catalogLevel)
    .order("frequency", { ascending: true, nullsFirst: false });

  if (options?.limit != null && options.limit > 0) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    return { data: [], error: error.message };
  }

  return {
    data: (data ?? []) as HskWordRow[],
    error: null,
  };
}

const CATALOG_LEVELS = ["1", "2", "3", "4", "5", "6"] as const;

const TOTALS_CACHE_KEY = "buunduu-hsk-level-totals-v1";
const TOTALS_TTL_MS = 10 * 60 * 1000;

function readTotalsCache(): Record<number, number> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(TOTALS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      at: number;
      totals: Record<number, number>;
    };
    if (Date.now() - parsed.at > TOTALS_TTL_MS) return null;
    return parsed.totals;
  } catch {
    return null;
  }
}

function writeTotalsCache(totals: Record<number, number>) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      TOTALS_CACHE_KEY,
      JSON.stringify({ at: Date.now(), totals })
    );
  } catch {
    // ignore quota
  }
}

/** Head-only counts per HSK level (6 small requests vs 10k+ rows). */
export async function fetchHskLevelTotals(): Promise<{
  totals: Record<number, number>;
  error: string | null;
}> {
  if (!supabase || !hasSupabaseConfig) {
    return { totals: {}, error: "Supabase тохиргоо байхгүй." };
  }

  const cached = readTotalsCache();
  if (cached) {
    return { totals: cached, error: null };
  }

  const client = supabase;
  const entries = await Promise.all(
    CATALOG_LEVELS.map(async (level) => {
      const { count, error } = await client
        .from("hsk_words")
        .select("*", { count: "exact", head: true })
        .eq("hsk_level", level);

      return {
        level: Number(level),
        total: error ? 0 : (count ?? 0),
        error: error?.message ?? null,
      };
    })
  );

  const failed = entries.find((e) => e.error);
  if (failed?.error) {
    return { totals: {}, error: failed.error };
  }

  const totals: Record<number, number> = {};
  for (const { level, total } of entries) {
    totals[level] = total;
  }
  writeTotalsCache(totals);
  return { totals, error: null };
}

export async function fetchHskWordsByIds(
  wordIds: number[]
): Promise<{ data: HskWordRow[]; error: string | null }> {
  if (!supabase || !hasSupabaseConfig) {
    return { data: [], error: "Supabase тохиргоо байхгүй." };
  }
  if (wordIds.length === 0) {
    return { data: [], error: null };
  }

  const unique = [...new Set(wordIds)];
  const rows: HskWordRow[] = [];

  for (let i = 0; i < unique.length; i += 200) {
    const chunk = unique.slice(i, i + 200);
    const { data, error } = await supabase
      .from("hsk_words")
      .select("id, hsk_level")
      .in("id", chunk);

    if (error) {
      return { data: [], error: error.message };
    }
    rows.push(...((data ?? []) as HskWordRow[]));
  }

  return { data: rows, error: null };
}
