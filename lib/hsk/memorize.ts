import { createClient } from "@supabase/supabase-js";
import type { HskLevel, HskWord } from "@/lib/hsk";
import { hasServerSupabaseConfig } from "@/lib/supabase/server";
import {
  MEMORIZE_BATCH_SIZE,
  type PosCategoryId,
  POS_UI_CATEGORIES,
  wordMatchesPosCategory,
} from "@/lib/hsk/pos-catalog";

const LIGHT_SELECT = "id, pos, frequency";
const WORD_SELECT =
  "id, simplified, traditional, pinyin, pos, radical, frequency, hsk_level, hsk_old, meaning_en, meaning_mn, example_zh, example_pinyin, example_mn";

type LightRow = { id: number; pos: string[]; frequency: number | null };

function catalogClient() {
  if (!hasServerSupabaseConfig) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

const filterCache = new Map<
  string,
  { at: number; ids: number[]; total: number }
>();
const FILTER_TTL_MS = 10 * 60 * 1000;

async function loadLevelRows(level: HskLevel): Promise<LightRow[]> {
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
      .order("frequency", { ascending: true, nullsFirst: false })
      .range(from, from + pageSize - 1);

    if (error) throw new Error(error.message);
    const chunk = (data ?? []) as LightRow[];
    rows.push(...chunk);
    if (chunk.length < pageSize) break;
    from += pageSize;
  }

  return rows;
}

async function getFilteredIds(
  level: HskLevel,
  categoryId: PosCategoryId
): Promise<{ ids: number[]; total: number }> {
  const key = `${level}:${categoryId}`;
  const hit = filterCache.get(key);
  if (hit && Date.now() - hit.at < FILTER_TTL_MS) {
    return { ids: hit.ids, total: hit.total };
  }

  const rows = await loadLevelRows(level);
  const filtered = rows.filter((row) =>
    wordMatchesPosCategory(row.pos, categoryId)
  );
  const ids = filtered.map((r) => r.id);
  filterCache.set(key, { at: Date.now(), ids, total: ids.length });
  return { ids, total: ids.length };
}

export type MemorizeCategoryMeta = {
  id: PosCategoryId;
  labelMn: string;
  count: number;
};

export async function fetchMemorizeMeta(level: HskLevel): Promise<{
  categories: MemorizeCategoryMeta[];
  totalWords: number;
  batchSize: number;
}> {
  const rows = await loadLevelRows(level);

  const categories: MemorizeCategoryMeta[] = POS_UI_CATEGORIES.map((cat) => ({
    id: cat.id,
    labelMn: cat.labelMn,
    count: rows.filter((row) => wordMatchesPosCategory(row.pos, cat.id)).length,
  })).filter((c) => c.count > 0);

  return {
    categories,
    totalWords: rows.length,
    batchSize: MEMORIZE_BATCH_SIZE,
  };
}

export async function fetchMemorizeBatch(
  level: HskLevel,
  categoryId: PosCategoryId,
  batchIndex: number
): Promise<{
  words: HskWord[];
  wordIds: number[];
  batchIndex: number;
  batchSize: number;
  rangeStart: number;
  rangeEnd: number;
  totalInFilter: number;
  batchCount: number;
}> {
  const { ids, total } = await getFilteredIds(level, categoryId);
  const batchSize = MEMORIZE_BATCH_SIZE;
  const batchCount = Math.max(1, Math.ceil(total / batchSize));
  const safeBatch = Math.max(0, Math.min(batchIndex, batchCount - 1));
  const slice = ids.slice(
    safeBatch * batchSize,
    safeBatch * batchSize + batchSize
  );

  if (slice.length === 0) {
    return {
      words: [],
      wordIds: [],
      batchIndex: safeBatch,
      batchSize,
      rangeStart: 0,
      rangeEnd: 0,
      totalInFilter: total,
      batchCount,
    };
  }

  const supabase = catalogClient();
  if (!supabase) {
    return {
      words: [],
      wordIds: slice,
      batchIndex: safeBatch,
      batchSize,
      rangeStart: safeBatch * batchSize + 1,
      rangeEnd: safeBatch * batchSize + slice.length,
      totalInFilter: total,
      batchCount,
    };
  }

  const { data, error } = await supabase
    .from("hsk_words")
    .select(WORD_SELECT)
    .in("id", slice);

  if (error) throw new Error(error.message);

  const byId = new Map(
    ((data ?? []) as HskWord[]).map((w) => [w.id, w] as const)
  );
  const words = slice
    .map((id) => byId.get(id))
    .filter((w): w is HskWord => w != null);

  const rangeStart = safeBatch * batchSize + 1;
  const rangeEnd = rangeStart + words.length - 1;

  return {
    words,
    wordIds: slice,
    batchIndex: safeBatch,
    batchSize,
    rangeStart,
    rangeEnd,
    totalInFilter: total,
    batchCount,
  };
}

export type MemorizeBatchSummary = {
  batchIndex: number;
  rangeStart: number;
  rangeEnd: number;
  wordIds: number[];
};

export async function fetchMemorizeBatchSummaries(
  level: HskLevel,
  categoryId: PosCategoryId
): Promise<{
  batches: MemorizeBatchSummary[];
  totalInFilter: number;
  batchSize: number;
}> {
  const { ids, total } = await getFilteredIds(level, categoryId);
  const batchSize = MEMORIZE_BATCH_SIZE;
  const batches: MemorizeBatchSummary[] = [];

  for (let i = 0; i < ids.length; i += batchSize) {
    const slice = ids.slice(i, i + batchSize);
    const batchIndex = Math.floor(i / batchSize);
    batches.push({
      batchIndex,
      rangeStart: i + 1,
      rangeEnd: i + slice.length,
      wordIds: slice,
    });
  }

  return { batches, totalInFilter: total, batchSize };
}
