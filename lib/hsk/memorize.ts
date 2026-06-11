import { createClient } from "@supabase/supabase-js";
import type { HskLevel, HskWord } from "@/lib/hsk";
import { MEMORIZE_BATCH_SIZE } from "@/lib/hsk/pos-catalog";
import { hasServerSupabaseConfig } from "@/lib/supabase/server";

const LIGHT_SELECT = "id, simplified";
const WORD_SELECT =
  "id, simplified, traditional, pinyin, pos, radical, frequency, hsk_level, hsk_old, meaning_en, meaning_mn, example_zh, example_pinyin, example_mn";

type LightRow = { id: number; simplified: string };

function catalogClient() {
  if (!hasServerSupabaseConfig) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

async function loadOrderedLightRows(level: HskLevel): Promise<LightRow[]> {
  const supabase = catalogClient();
  if (!supabase) return [];

  const rows: LightRow[] = [];
  const pageSize = 1000;
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("hsk_words")
      .select(LIGHT_SELECT)
      .eq("hsk_level", level)
      .order("pinyin_sort_key", { ascending: true, nullsFirst: false })
      .order("simplified", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) throw new Error(error.message);
    const chunk = (data ?? []) as LightRow[];
    rows.push(...chunk);
    if (chunk.length < pageSize) break;
    from += pageSize;
  }

  return rows;
}

async function countLevelWords(level: HskLevel): Promise<number> {
  const supabase = catalogClient();
  if (!supabase) return 0;

  const { count, error } = await supabase
    .from("hsk_words")
    .select("id", { count: "exact", head: true })
    .eq("hsk_level", level);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function fetchMemorizeMeta(level: HskLevel): Promise<{
  totalWords: number;
  batchSize: number;
  batchCount: number;
}> {
  const totalWords = await countLevelWords(level);
  const batchSize = MEMORIZE_BATCH_SIZE;
  const batchCount = totalWords > 0 ? Math.ceil(totalWords / batchSize) : 0;

  return { totalWords, batchSize, batchCount };
}

export async function fetchMemorizeBatch(
  level: HskLevel,
  batchIndex: number
): Promise<{
  words: HskWord[];
  wordIds: number[];
  batchIndex: number;
  batchSize: number;
  rangeStart: number;
  rangeEnd: number;
  totalWords: number;
  batchCount: number;
  firstSimplified: string | null;
  lastSimplified: string | null;
}> {
  const batchSize = MEMORIZE_BATCH_SIZE;
  const totalWords = await countLevelWords(level);
  const batchCount = totalWords > 0 ? Math.ceil(totalWords / batchSize) : 0;
  const safeBatch = Math.max(
    0,
    Math.min(batchIndex, Math.max(0, batchCount - 1))
  );
  const from = safeBatch * batchSize;
  const to = from + batchSize - 1;

  const supabase = catalogClient();
  if (!supabase || totalWords === 0) {
    return {
      words: [],
      wordIds: [],
      batchIndex: safeBatch,
      batchSize,
      rangeStart: 0,
      rangeEnd: 0,
      totalWords,
      batchCount,
      firstSimplified: null,
      lastSimplified: null,
    };
  }

  const { data, error } = await supabase
    .from("hsk_words")
    .select(WORD_SELECT)
    .eq("hsk_level", level)
    .order("pinyin_sort_key", { ascending: true, nullsFirst: false })
    .order("simplified", { ascending: true })
    .range(from, to);

  if (error) throw new Error(error.message);

  const words = (data ?? []) as HskWord[];
  const wordIds = words.map((w) => w.id);
  const rangeStart = from + 1;
  const rangeEnd = from + words.length;
  const firstSimplified = words[0]?.simplified ?? null;
  const lastSimplified = words[words.length - 1]?.simplified ?? null;

  return {
    words,
    wordIds,
    batchIndex: safeBatch,
    batchSize,
    rangeStart,
    rangeEnd,
    totalWords,
    batchCount,
    firstSimplified,
    lastSimplified,
  };
}

export type MemorizeBatchSummary = {
  batchIndex: number;
  rangeStart: number;
  rangeEnd: number;
  wordIds: number[];
  firstSimplified: string;
  lastSimplified: string;
};

export async function fetchMemorizeBatchSummaries(level: HskLevel): Promise<{
  batches: MemorizeBatchSummary[];
  totalWords: number;
  batchSize: number;
}> {
  const rows = await loadOrderedLightRows(level);
  const batchSize = MEMORIZE_BATCH_SIZE;
  const batches: MemorizeBatchSummary[] = [];

  for (let i = 0; i < rows.length; i += batchSize) {
    const slice = rows.slice(i, i + batchSize);
    const batchIndex = Math.floor(i / batchSize);
    batches.push({
      batchIndex,
      rangeStart: i + 1,
      rangeEnd: i + slice.length,
      wordIds: slice.map((r) => r.id),
      firstSimplified: slice[0]!.simplified,
      lastSimplified: slice[slice.length - 1]!.simplified,
    });
  }

  return { batches, totalWords: rows.length, batchSize };
}
