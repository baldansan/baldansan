import { createClient } from "@supabase/supabase-js";
import type { HskLevel, HskWord } from "@/lib/hsk";
import { MEMORIZE_BATCH_SIZE } from "@/lib/hsk/pos-catalog";
import {
  getWordThemeGroup,
  getWordThemeGroups,
} from "@/lib/hsk/word-themes";
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
      .eq("is_function_word", false)
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
    .eq("hsk_level", level)
    .eq("is_function_word", false);

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
    .eq("is_function_word", false)
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

/** Түвшний бүх үгийн (id, simplified) хөнгөн мөрүүд — сэдэвчилсэн бүлэгт
 * дүрмийн үгс мөн ордог тул is_function_word filter ХЭРЭГЛЭХГҮЙ. */
async function loadLevelLightRows(level: HskLevel): Promise<LightRow[]> {
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
      .range(from, from + pageSize - 1);

    if (error) throw new Error(error.message);
    const chunk = (data ?? []) as LightRow[];
    rows.push(...chunk);
    if (chunk.length < pageSize) break;
    from += pageSize;
  }

  return rows;
}

export type MemorizeThemeGroupSummary = {
  batchIndex: number;
  groupId: string;
  title: string;
  icon: string;
  wordIds: number[];
  wordCount: number;
};

/** Сэдэвчилсэн бүлгүүдийн жагсаалт. Theme файл эсвэл Supabase байхгүй бол
 * null буцаана → дуудагч тал хуучин пиньинь багц руу fallback хийнэ. */
export async function fetchMemorizeThemeSummaries(level: HskLevel): Promise<{
  groups: MemorizeThemeGroupSummary[];
  totalWords: number;
} | null> {
  const themeGroups = await getWordThemeGroups(level);
  if (!themeGroups) return null;

  const rows = await loadLevelLightRows(level);
  if (rows.length === 0) return null;

  const idBySimplified = new Map<string, number>();
  for (const row of rows) {
    idBySimplified.set(row.simplified, row.id);
  }

  const groups: MemorizeThemeGroupSummary[] = [];
  for (const group of themeGroups) {
    const wordIds = group.words
      .map((s) => idBySimplified.get(s))
      .filter((id): id is number => typeof id === "number");
    if (wordIds.length === 0) continue;
    groups.push({
      batchIndex: groups.length,
      groupId: group.id,
      title: group.title,
      icon: group.icon,
      wordIds,
      wordCount: wordIds.length,
    });
  }

  if (groups.length === 0) return null;
  const totalWords = groups.reduce((sum, g) => sum + g.wordCount, 0);
  return { groups, totalWords };
}

/** Нэг сэдэвчилсэн бүлгийн үгс (theme файлын дарааллаар — түгээмэл нь эхэндээ). */
export async function fetchMemorizeThemeGroup(
  level: HskLevel,
  groupId: string
): Promise<{
  words: HskWord[];
  wordIds: number[];
  groupId: string;
  title: string;
  icon: string;
} | null> {
  const group = await getWordThemeGroup(level, groupId);
  if (!group) return null;

  const supabase = catalogClient();
  if (!supabase) {
    return { words: [], wordIds: [], groupId: group.id, title: group.title, icon: group.icon };
  }

  const { data, error } = await supabase
    .from("hsk_words")
    .select(WORD_SELECT)
    .eq("hsk_level", level)
    .in("simplified", group.words);

  if (error) throw new Error(error.message);

  const order = new Map(group.words.map((s, i) => [s, i]));
  const words = ((data ?? []) as HskWord[])
    .slice()
    .sort(
      (a, b) =>
        (order.get(a.simplified) ?? Number.MAX_SAFE_INTEGER) -
        (order.get(b.simplified) ?? Number.MAX_SAFE_INTEGER)
    );

  return {
    words,
    wordIds: words.map((w) => w.id),
    groupId: group.id,
    title: group.title,
    icon: group.icon,
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
