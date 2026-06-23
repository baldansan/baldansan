import { createClient } from "@supabase/supabase-js";
import { shuffleArray } from "@/lib/games/game-data-core";
import { createServerSupabaseClient, hasServerSupabaseConfig } from "@/lib/supabase/server";

/** Catalog level tag stored in public.hsk_words.hsk_level */
export type HskLevel = "1" | "2" | "3" | "4" | "5" | "6" | "7-9";

export type HskWord = {
  id: number;
  simplified: string;
  traditional: string | null;
  pinyin: string | null;
  pos: string[];
  radical: string | null;
  frequency: number | null;
  hsk_level: HskLevel;
  hsk_old: number[];
  meaning_en: string | null;
  meaning_mn: string | null;
  example_zh: string | null;
  example_pinyin: string | null;
  example_mn: string | null;
  /** Grammatical particle — excluded from SRS / memorize queues. */
  is_function_word?: boolean;
};

const WORD_SELECT =
  "id, simplified, traditional, pinyin, pos, radical, frequency, hsk_level, hsk_old, meaning_en, meaning_mn, example_zh, example_pinyin, example_mn";

/** Lighter payload for games / review pools (no traditional, radical, hsk_old). */
const QUIZ_WORD_SELECT =
  "id, simplified, pinyin, pos, frequency, hsk_level, radical, meaning_mn, example_zh, example_pinyin, example_mn";

async function serverClient() {
  if (!hasServerSupabaseConfig) return null;
  return createServerSupabaseClient();
}

/** Cookie-free client for public catalog reads (safe inside route handlers). */
function catalogClient() {
  if (!hasServerSupabaseConfig) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

const quizPoolCache = new Map<
  string,
  { at: number; words: HskWord[] }
>();
const QUIZ_POOL_TTL_MS = 10 * 60 * 1000;

/** All words for a catalog level, ordered by frequency (most common first). */
export async function getWordsByLevel(level: HskLevel): Promise<HskWord[]> {
  const supabase = await serverClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("hsk_words")
    .select(WORD_SELECT)
    .eq("hsk_level", level)
    .order("frequency", { ascending: true, nullsFirst: false });

  if (error) {
    throw new Error(`getWordsByLevel(${level}): ${error.message}`);
  }

  return (data ?? []) as HskWord[];
}

/** Single word by primary key. */
export async function getWordById(id: number): Promise<HskWord | null> {
  const supabase = await serverClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("hsk_words")
    .select(WORD_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`getWordById(${id}): ${error.message}`);
  }

  return (data as HskWord | null) ?? null;
}

async function fetchQuizWordPool(
  level: HskLevel,
  poolSize: number
): Promise<HskWord[]> {
  const supabase = catalogClient();
  if (!supabase) return [];

  const limit = Math.max(20, Math.min(poolSize, 300));
  const { data, error } = await supabase
    .from("hsk_words")
    .select(QUIZ_WORD_SELECT)
    .eq("hsk_level", level)
    .eq("is_function_word", false)
    .not("meaning_mn", "is", null)
    .order("frequency", { ascending: true, nullsFirst: false })
    .limit(limit);

  if (error) {
    throw new Error(`getQuizWordPool(${level}): ${error.message}`);
  }

  return (data ?? []) as HskWord[];
}

/** Top-frequency pool for quizzes — in-memory cache 10 min per level/size. */
export async function getQuizWordPool(
  level: HskLevel,
  poolSize = 120
): Promise<HskWord[]> {
  const size = Math.max(20, Math.min(poolSize, 300));
  const key = `${level}:${size}`;
  const hit = quizPoolCache.get(key);
  if (hit && Date.now() - hit.at < QUIZ_POOL_TTL_MS) {
    return hit.words;
  }
  const words = await fetchQuizWordPool(level, size);
  quizPoolCache.set(key, { at: Date.now(), words });
  return words;
}

const HANZI_GLYPH_RE = /[\u4e00-\u9fff]/;

/** True when simplified is exactly one CJK character (ignores whitespace). */
export function isSingleHanziWordText(text: string | null | undefined): boolean {
  const zh = text?.trim();
  if (!zh) return false;
  const glyphs = [...zh].filter((ch) => HANZI_GLYPH_RE.test(ch));
  return glyphs.length === 1 && glyphs[0] === zh;
}

/** Lookup catalog rows where simplified is a single hanzi (e.g. 代, not 代表). */
export async function getSingleCharWordsByGlyphs(
  glyphs: string[]
): Promise<Map<string, HskWord>> {
  const supabase = catalogClient();
  const unique = [...new Set(glyphs.map((g) => g.trim()).filter(Boolean))];
  const map = new Map<string, HskWord>();
  if (!supabase || unique.length === 0) return map;

  for (let i = 0; i < unique.length; i += 200) {
    const chunk = unique.slice(i, i + 200);
    const { data, error } = await supabase
      .from("hsk_words")
      .select(QUIZ_WORD_SELECT)
      .in("simplified", chunk)
      .eq("is_function_word", false);

    if (error) {
      throw new Error(`getSingleCharWordsByGlyphs: ${error.message}`);
    }

    for (const row of (data ?? []) as HskWord[]) {
      const zh = row.simplified?.trim();
      if (!zh || !isSingleHanziWordText(zh)) continue;
      const existing = map.get(zh);
      const freq = row.frequency ?? Number.MAX_SAFE_INTEGER;
      const existingFreq = existing?.frequency ?? Number.MAX_SAFE_INTEGER;
      if (!existing || freq < existingFreq) {
        map.set(zh, row);
      }
    }
  }

  return map;
}

/** Fetch words by id list (for SRS marathon). */
export async function getWordsByIds(ids: number[]): Promise<HskWord[]> {
  const supabase = catalogClient();
  if (!supabase || ids.length === 0) return [];

  const unique = [...new Set(ids)];
  const rows: HskWord[] = [];

  for (let i = 0; i < unique.length; i += 200) {
    const chunk = unique.slice(i, i + 200);
    const { data, error } = await supabase
      .from("hsk_words")
      .select(QUIZ_WORD_SELECT)
      .in("id", chunk)
      .eq("is_function_word", false);

    if (error) {
      throw new Error(`getWordsByIds: ${error.message}`);
    }
    rows.push(...((data ?? []) as HskWord[]));
  }

  return rows;
}

/** Random sample for game distractors (shuffled subset of a limited pool). */
export async function getRandomWords(
  level: HskLevel,
  count: number
): Promise<HskWord[]> {
  if (count <= 0) return [];
  const pool = await getQuizWordPool(level, Math.max(count * 4, 80));
  if (pool.length === 0) return [];
  return shuffleArray(pool).slice(0, Math.min(count, pool.length));
}
